package main

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-contrib/cors" // middleware для настройки CORS (разрешения запросов с других доменов)
	"github.com/gin-gonic/gin"    // веб-фреймворк Gin
	_ "github.com/lib/pq"         // драйвер PostgreSQL (импортируем ради side-effect: регистрирует драйвер)
)

// City — структура, в которую мы будем маппить строки из таблицы cities.
// Теги json определяют имена полей при маршалинге в JSON-ответы.
type City struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// Hotel — структура для отданных клиенту данных о гостинице.
// Содержит как id города (CityID), так и CityName для удобства (чтобы клиент видел имя города сразу).
type Hotel struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	CityID   int     `json:"city_id"`
	CityName string  `json:"city_name"`
	Capacity int     `json:"capacity"`
	Price    float64 `json:"price"`
}

// Response — универсальная обёртка для HTTP-ответа в JSON.
// Поля:
// - Success: статус выполнения (true/false)
// - Data: полезная нагрузка (может быть slice, объект и т.д.)
// - Count: количество элементов в Data (удобно для фронтенда)
// - Error: строка ошибки (если есть)
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Count   int         `json:"count"`
	Error   string      `json:"error,omitempty"`
}

// глобальная переменная db хранит пул подключений к базе данных.
// Используем её во всех обработчиках. В реальном приложении можно обернуть в структуру приложения.
var db *sql.DB

// initDB открывает соединение с PostgreSQL и проверяет его.
// Возвращает ошибку, если не удалось подключиться или пропинговать БД.
// В connStr указываются параметры подключения: host, port, user, password, dbname, sslmode.
func initDB() error {
	connStr := "host=localhost port=5432 user=postgres password=12345 dbname=wb sslmode=disable"
	var err error

	// sql.Open не делает реального подключения — он просто подготавливает пул соединений.
	// Реальное подключение проверяется при вызове db.Ping() ниже.
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		// Возвращаем ошибку вызывающему (main) — приложение не может работать без БД.
		return err
	}

	// Ping проверяет соединение с БД: если БД недоступна — вернёт ошибку.
	if err = db.Ping(); err != nil {
		return err
	}

	log.Println("Successfully connected to database")
	return nil
}

// getAllCities — HTTP-обработчик для получения списка всех городов.
// Реагирует на GET /api/cities
func getAllCities(c *gin.Context) {
	// Выполняем SQL-запрос: выбираем id и name из таблицы cities, упорядочивая по имени.
	rows, err := db.Query("SELECT id, name FROM cities ORDER BY name")
	if err != nil {
		// Если ошибка при выполнении запроса — возвращаем 500 и JSON с ошибкой.
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	// Не забываем закрыть rows, чтобы вернуть соединение в пул.
	defer rows.Close()

	// Собираем результаты в слайс City.
	cities := []City{}
	for rows.Next() {
		var city City
		// Сканируем колонки в поля структуры.
		if err := rows.Scan(&city.ID, &city.Name); err != nil {
			// Если сканирование одной строки провалилось — логируем и продолжаем,
			// чтобы не терять остальные корректные записи.
			log.Printf("Error scanning city: %v", err)
			continue
		}
		cities = append(cities, city)
	}

	// Возвращаем 200 OK и JSON-объект Response.
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    cities,
		Count:   len(cities),
	})
}

// getAllHotels — HTTP-обработчик для получения списка гостиниц.
// Реагирует на GET /api/hotels
func getAllHotels(c *gin.Context) {
	// В этом запросе:
	// - выбираем поля из таблицы hotels (h)
	// - LEFT JOIN с cities (c) по полю h.city = c.id, чтобы получить имя города (если оно есть)
	// - COALESCE(c.name, '') используется, чтобы при отсутствии города вернуть пустую строку
	// - h.price::numeric — приведение типа в SQL (в зависимости от схемы можно было бы брать float напрямую)
	//
	// Важно: имена колонок в SELECT соответствуют порядку сканирования в rows.Scan ниже.
	query := `
		SELECT h.id, h.name, h.city, COALESCE(c.name, ''), h.capacity, h.price::numeric
		FROM hotels h
		LEFT JOIN cities c ON h.city = c.id
		ORDER BY h.name
	`

	rows, err := db.Query(query)
	if err != nil {
		// Ошибка выполнения запроса — возвращаем 500.
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	defer rows.Close()

	// Собираем результаты в слайс Hotel.
	hotels := []Hotel{}
	for rows.Next() {
		var hotel Hotel
		// Порядок сканирования должен соответствовать SELECT:
		// id, name, city (id), city.name, capacity, price
		if err := rows.Scan(&hotel.ID, &hotel.Name, &hotel.CityID, &hotel.CityName, &hotel.Capacity, &hotel.Price); err != nil {
			// Логируем ошибку и продолжаем считывать остальные строки.
			log.Printf("Error scanning hotel: %v", err)
			continue
		}
		hotels = append(hotels, hotel)
	}

	// Отправляем ответ с данными.
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    hotels,
		Count:   len(hotels),
	})
}

func main() {
	// Инициализируем подключение к БД. Если ошибка — завершаем приложение.
	if err := initDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	// Гарантированно закрываем пул соединений при завершении main.
	defer db.Close()

	// Создаём экземпляр роутера Gin с дефолтными middleware (лог, recovery и т.д.).
	router := gin.Default()

	// Настраиваем CORS — актуально, если фронтенд обращается с другого домена/порта.
	// В данном конфиге разрешены все источники (AllowOrigins: ["*"]) — это удобно при разработке,
	// но в продакшене рекомендуется сузить список разрешённых доменов.
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	// Группируем маршруты под префиксом /api
	api := router.Group("/api")
	{
		// Маршрут GET /api/cities — возвращает список городов.
		api.GET("/cities", getAllCities)
		// Маршрут GET /api/hotels — возвращает список гостиниц с информацией о городе.
		api.GET("/hotels", getAllHotels)
	}

	// Простейший маршрут для проверки здоровья сервера (health check).
	// Полезно для оркестраторов, мониторинга и локального тестирования.
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Println("Server starting on :8080")
	// Запускаем HTTP-сервер на порту 8080.
	// router.Run блокирует текущий поток, поэтому код после него выполняться не будет, пока сервер запущен.
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
