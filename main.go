package main

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

type City struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Hotel struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	CityID   int     `json:"city_id"`
	CityName string  `json:"city_name"`
	Capacity int     `json:"capacity"`
	Price    float64 `json:"price"`
}

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Count   int         `json:"count"`
	Error   string      `json:"error,omitempty"`
}

var db *sql.DB

func initDB() error {
	connStr := "host=localhost port=5432 user=postgres password=12345 dbname=wb sslmode=disable"
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		return err
	}

	if err = db.Ping(); err != nil {
		return err
	}

	log.Println("Successfully connected to database")
	return nil
}

func getAllCities(c *gin.Context) {
	rows, err := db.Query("SELECT id, name FROM cities ORDER BY name")
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	defer rows.Close()

	cities := []City{}
	for rows.Next() {
		var city City
		if err := rows.Scan(&city.ID, &city.Name); err != nil {
			log.Printf("Error scanning city: %v", err)
			continue
		}
		cities = append(cities, city)
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    cities,
		Count:   len(cities),
	})
}

func getAllHotels(c *gin.Context) {
	query := `
		SELECT h.id, h.name, h.city, COALESCE(c.name, ''), h.capacity, h.price::numeric
		FROM hotels h
		LEFT JOIN cities c ON h.city = c.id
		ORDER BY h.name
	`

	rows, err := db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	defer rows.Close()

	hotels := []Hotel{}
	for rows.Next() {
		var hotel Hotel
		if err := rows.Scan(&hotel.ID, &hotel.Name, &hotel.CityID, &hotel.CityName, &hotel.Capacity, &hotel.Price); err != nil {
			log.Printf("Error scanning hotel: %v", err)
			continue
		}
		hotels = append(hotels, hotel)
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    hotels,
		Count:   len(hotels),
	})
}

func main() {
	if err := initDB(); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	api := router.Group("/api")
	{
		api.GET("/cities", getAllCities)
		api.GET("/hotels", getAllHotels)
	}

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	log.Println("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
