import React, { useState, useEffect, useCallback } from 'react';

// URL API для запросов к серверу
const API_URL = 'http://localhost:8080/api';

// Главный компонент поиска по городам и отелям
export default function HotelSearch() {
  // -------------------
  // Состояния компонента
  // -------------------

  // Список городов
  const [cities, setCities] = useState([]);
  // Список отелей
  const [hotels, setHotels] = useState([]);
  // Отфильтрованные данные для отображения
  const [filteredData, setFilteredData] = useState([]);
  // Индикатор загрузки
  const [loading, setLoading] = useState(true);
  // Сообщение об ошибке
  const [error, setError] = useState('');

  // Параметры поиска (таблица, поле, поисковый запрос)
  const [searchParams, setSearchParams] = useState({
    table: 'hotels',   // начальная таблица
    field: 'name',     // поле поиска
    query: ''          // поисковая строка
  });

  // -------------------
  // Фильтрация данных
  // -------------------

  // useCallback предотвращает ненужное пересоздание функции при ререндере
  const filterData = useCallback(() => {
    const { table, field, query } = searchParams;

    // Если поисковый запрос пустой — показываем все элементы
    if (!query.trim()) {
      setFilteredData(table === 'cities' ? cities : hotels);
      return;
    }

    const searchQuery = query.toLowerCase();
    let filtered = [];

    if (table === 'cities') {
      // Фильтрация городов по выбранному полю
      filtered = cities.filter(city => {
        const value = String(city[field] || '').toLowerCase();
        return value.includes(searchQuery);
      });
    } else {
      // Фильтрация отелей
      filtered = hotels.filter(hotel => {
        let value = '';
        // Если поле поиска — город, ищем по city_name
        if (field === 'city') {
          value = String(hotel.city_name || '').toLowerCase();
        } else {
          value = String(hotel[field] || '').toLowerCase();
        }
        return value.includes(searchQuery);
      });
    }

    // Сохраняем отфильтрованные данные
    setFilteredData(filtered);
  }, [searchParams, cities, hotels]);

  // -------------------
  // Загрузка данных при монтировании
  // -------------------

  useEffect(() => {
    loadAllData(); // вызов асинхронной функции загрузки данных
  }, []);

  // -------------------
  // Фильтрация данных при изменении параметров поиска
  // -------------------

  useEffect(() => {
    filterData(); // вызываем фильтрацию каждый раз, когда изменяются searchParams, cities или hotels
  }, [filterData]);

  // -------------------
  // Асинхронная функция для загрузки данных с сервера
  // -------------------

  const loadAllData = async () => {
    setLoading(true); // включаем индикатор загрузки
    setError('');     // очищаем ошибки

    try {
      // Одновременные запросы к API для городов и отелей
      const [citiesRes, hotelsRes] = await Promise.all([
        fetch(`${API_URL}/cities`),
        fetch(`${API_URL}/hotels`)
      ]);

      const citiesData = await citiesRes.json();
      const hotelsData = await hotelsRes.json();

      // Проверка, что оба запроса успешны
      if (citiesData.success && hotelsData.success) {
        setCities(citiesData.data || []);  // сохраняем города
        setHotels(hotelsData.data || []);  // сохраняем отели
      } else {
        setError('Failed to load data');   // ошибка загрузки
      }
    } catch (err) {
      setError('Error connecting to server: ' + err.message); // ошибка сети или сервера
    } finally {
      setLoading(false); // отключаем индикатор загрузки
    }
  };

  // -------------------
  // Обработчики изменения select/input
  // -------------------

  // Изменение таблицы (hotels/cities)
  const handleTableChange = (e) => {
    const newTable = e.target.value;
    // По умолчанию поле поиска — name
    const newField = newTable === 'cities' ? 'name' : 'name';
    setSearchParams({ table: newTable, field: newField, query: '' });
    // Сразу показываем все элементы выбранной таблицы
    setFilteredData(newTable === 'cities' ? cities : hotels);
  };

  // Изменение поля поиска
  const handleFieldChange = (e) => {
    setSearchParams({ ...searchParams, field: e.target.value });
  };

  // Изменение поисковой строки
  const handleQueryChange = (e) => {
    setSearchParams({ ...searchParams, query: e.target.value });
  };

  // Очистка поисковой строки
  const handleClear = () => {
    setSearchParams({ ...searchParams, query: '' });
  };

  // Получение списка доступных полей для выбранной таблицы
  const getFieldOptions = () => {
    if (searchParams.table === 'cities') {
      return [
        { value: 'id', label: 'ID' },
        { value: 'name', label: 'Name' }
      ];
    } else {
      return [
        { value: 'id', label: 'ID' },
        { value: 'name', label: 'Name' },
        { value: 'city', label: 'City' },
        { value: 'capacity', label: 'Capacity' },
        { value: 'price', label: 'Price' }
      ];
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffeef8 0%, #ffe0f0 50%, #ffd4eb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          fontSize: '24px',
          color: '#d63384',
          fontWeight: 'bold'
        }}>
          🌸 Loading data...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ffeef8 0%, #ffe0f0 50%, #ffd4eb 100%)',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
       
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#d63384',
            marginBottom: '12px',
            textShadow: '2px 2px 4px rgba(214, 51, 132, 0.2)'
          }}>
            🌸 Hotel & City Search 🌸
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#e685b5'
          }}>
            Search through {hotels.length} hotels in {cities.length} cities
          </p>
        </div>

        
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(214, 51, 132, 0.15)',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#d63384',
            marginBottom: '24px'
          }}>
            🔍 Search Database
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
           
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#555',
                marginBottom: '8px'
              }}>
                Table
              </label>
              <select
                value={searchParams.table}
                onChange={handleTableChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #ffc0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="hotels">Hotels</option>
                <option value="cities">Cities</option>
              </select>
            </div>

      
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#555',
                marginBottom: '8px'
              }}>
                Search Field
              </label>
              <select
                value={searchParams.field}
                onChange={handleFieldChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #ffc0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                {getFieldOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#555',
                marginBottom: '8px'
              }}>
                Search Query
              </label>
              <input
                type="text"
                value={searchParams.query}
                onChange={handleQueryChange}
                placeholder="Enter search text..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #ffc0e0',
                  borderRadius: '12px',
                  fontSize: '16px'
                }}
              />
            </div>

            
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={handleClear}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
                  color: '#555',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '16px',
              borderRadius: '12px',
              borderLeft: '4px solid #c62828',
              marginTop: '16px'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Results Card */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(214, 51, 132, 0.15)',
          padding: '32px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '2px solid #ffc0e0'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#d63384'
            }}>
              {searchParams.table === 'cities' ? '🏙️ Cities' : '🏨 Hotels'}
            </h3>
            <span style={{
              background: 'linear-gradient(135deg, #d63384 0%, #e685b5 100%)',
              color: 'white',
              padding: '8px 24px',
              borderRadius: '20px',
              fontWeight: 'bold'
            }}>
              {filteredData.length} results
            </span>
          </div>

          {filteredData.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '64px 0',
              color: '#999',
              fontSize: '20px'
            }}>
              No results found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {searchParams.table === 'cities' ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(135deg, #d63384 0%, #e685b5 100%)',
                      color: 'white'
                    }}>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        borderRadius: '12px 0 0 0'
                      }}>ID</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        borderRadius: '0 12px 0 0'
                      }}>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((city, index) => (
                      <tr 
                        key={city.id} 
                        style={{
                          borderBottom: '1px solid #ffc0e0',
                          background: index % 2 === 0 ? '#fff5f9' : 'white'
                        }}
                      >
                        <td style={{ padding: '16px' }}>{city.id}</td>
                        <td style={{ padding: '16px', fontWeight: '600' }}>{city.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(135deg, #d63384 0%, #e685b5 100%)',
                      color: 'white'
                    }}>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        borderRadius: '12px 0 0 0'
                      }}>ID</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600'
                      }}>Name</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600'
                      }}>City</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600'
                      }}>Capacity</th>
                      <th style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        borderRadius: '0 12px 0 0'
                      }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((hotel, index) => (
                      <tr 
                        key={hotel.id}
                        style={{
                          borderBottom: '1px solid #ffc0e0',
                          background: index % 2 === 0 ? '#fff5f9' : 'white'
                        }}
                      >
                        <td style={{ padding: '16px' }}>{hotel.id}</td>
                        <td style={{ padding: '16px', fontWeight: '600' }}>{hotel.name}</td>
                        <td style={{ padding: '16px' }}>{hotel.city_name}</td>
                        <td style={{ padding: '16px' }}>{hotel.capacity}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            background: '#ffebf5',
                            color: '#d63384',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontWeight: 'bold'
                          }}>
                            ${hotel.price.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          color: '#e685b5',
          fontSize: '14px'
        }}>
          💝 Data is loaded once and filtered on the client side 💝
        </div>
      </div>
    </div>
  );
}
