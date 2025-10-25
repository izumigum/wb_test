import React, { useState, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:8080/api';

export default function HotelSearch() {
  const [cities, setCities] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchParams, setSearchParams] = useState({
    table: 'hotels',
    field: 'name',
    query: ''
  });

  // Фильтрация данных (useCallback для предотвращения warning)
  const filterData = useCallback(() => {
    const { table, field, query } = searchParams;
    
    if (!query.trim()) {
      setFilteredData(table === 'cities' ? cities : hotels);
      return;
    }

    const searchQuery = query.toLowerCase();
    let filtered = [];

    if (table === 'cities') {
      filtered = cities.filter(city => {
        const value = String(city[field] || '').toLowerCase();
        return value.includes(searchQuery);
      });
    } else {
      filtered = hotels.filter(hotel => {
        let value = '';
        if (field === 'city') {
          value = String(hotel.city_name || '').toLowerCase();
        } else {
          value = String(hotel[field] || '').toLowerCase();
        }
        return value.includes(searchQuery);
      });
    }

    setFilteredData(filtered);
  }, [searchParams, cities, hotels]);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadAllData();
  }, []);

  // Фильтрация данных при изменении параметров поиска
  useEffect(() => {
    filterData();
  }, [filterData]);

  const loadAllData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [citiesRes, hotelsRes] = await Promise.all([
        fetch(`${API_URL}/cities`),
        fetch(`${API_URL}/hotels`)
      ]);

      const citiesData = await citiesRes.json();
      const hotelsData = await hotelsRes.json();

      if (citiesData.success && hotelsData.success) {
        setCities(citiesData.data || []);
        setHotels(hotelsData.data || []);
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      setError('Error connecting to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (e) => {
    const newTable = e.target.value;
    const newField = newTable === 'cities' ? 'name' : 'name';
    setSearchParams({ table: newTable, field: newField, query: '' });
    setFilteredData(newTable === 'cities' ? cities : hotels);
  };

  const handleFieldChange = (e) => {
    setSearchParams({ ...searchParams, field: e.target.value });
  };

  const handleQueryChange = (e) => {
    setSearchParams({ ...searchParams, query: e.target.value });
  };

  const handleClear = () => {
    setSearchParams({ ...searchParams, query: '' });
  };

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