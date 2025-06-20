import { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaTshirt, FaMagic, FaPaw, FaTimes, FaEdit, FaTrash, FaPlus, FaMinus, FaShare, FaBan } from 'react-icons/fa';
import  Footer from '../../components/Footer.jsx';
import './MainPage.css';

const API_BASE_URL = 'http://localhost:5000/api';

const MainPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(true);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [currentOutfitItems, setCurrentOutfitItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    color: '#ffffff',
    season: 'all',
    image: null,
    imagePreview: '',
    outfitCover: null,
    outfitCoverPreview: '',
    outfitName: '',
    outfitStyle: 'casual',
    outfitDescription: '',
    editingOutfitId: null
  });

  useEffect(() => {
    
    getWeatherRecommendation();
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
    
      try {
        const meRes = await fetch(`${API_BASE_URL}/me`, { credentials: 'include' });
      
        if (meRes.status === 401) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      
        if (!meRes.ok) throw new Error('Ошибка проверки авторизации');

        const userData = await meRes.json();
        setIsAuthenticated(true);
        setUserInfo(userData);
        
        const [wardrobeResponse, outfitsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/wardrobe`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/outfits`, { credentials: 'include' }),
        ]);
    
        if (!wardrobeResponse.ok || !outfitsResponse.ok) {
          throw new Error('Ошибка загрузки данных');
        }
    
        const wardrobeData = await wardrobeResponse.json();
        const outfitsData = await outfitsResponse.json();

        const transformed = outfitsData.map(o => ({
          ...o,
          isShared: o.is_shared,
        }));
        setSavedOutfits(transformed);
    
        setWardrobeItems(wardrobeData);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError(err.message);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  


  const getWeatherRecommendation = async (loc = 'Москва') => {
    try {
      setLoading(true);
      const apiKey = "f337c21db179b041b903d86f99c6fccb";
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${loc}&units=metric&lang=ru&appid=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

      const data = await response.json();
      if (!data.main || !data.main.temp) throw new Error("Неверный формат данных о погоде");

      setWeather(data);
      setWeatherError(null);
    } catch (err) {
      console.error('Ошибка получения погоды:', err);
      setWeather(null);
      setWeatherError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateClothingRecommendation = (weatherData) => {
    const temp = weatherData.main.temp;
    const weatherMain = weatherData.weather[0]?.main || '';
    let recommendation = '';

    if (temp < -10) recommendation = "Термобелье, пуховик, шапка, варежки";
    else if (temp < 0) recommendation = "Теплое пальто, шарф, перчатки";
    else if (temp < 10) recommendation = "Куртка, джинсы, свитер";
    else if (temp < 20) recommendation = "Легкая куртка или толстовка";
    else recommendation = "Футболка, шорты/легкие брюки";

    if (weatherMain.includes('дожд')) recommendation += ", зонт и непромокаемая обувь";
    if (weatherMain.includes('снег')) recommendation += ", зимняя обувь";

    return recommendation;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ 
          ...formData, 
          image: file,
          imagePreview: event.target.result 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOutfitCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ 
          ...formData, 
          outfitCover: file,
          outfitCoverPreview: event.target.result 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Чтобы добавить вещь, пожалуйста, авторизуйтесь.');
      return;
    }
    const form = new FormData();
    form.append('name', formData.itemName);
    form.append('category', formData.category);
    form.append('color', formData.color);
    form.append('season', formData.season);
    form.append('image', formData.image); 
    try {
      const response = await fetch(`${API_BASE_URL}/wardrobe/`, {
        method: 'POST',
        body: form,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Ошибка при добавлении вещи');
      const createdItem = await response.json();
      setWardrobeItems([...wardrobeItems, createdItem]);
      setFormData({
        ...formData,
        itemName: '',
        category: '',
        season: 'all',
        image: null,
        imagePreview: ''
      });
    } catch (err) {
      console.error('Ошибка добавления вещи:', err);
      alert('Не удалось добавить вещь. Пожалуйста, попробуйте снова.');
    }
  };
  const deleteItem = async (id) => {
    const usedInOutfits = savedOutfits.filter(outfit => 
      outfit.items.some(item => item.id === id)
    );
    
    if (usedInOutfits.length > 0) {
      const confirmDelete = window.confirm(
        `Эта вещь используется в ${usedInOutfits.length} образах. Удалить?`
      );
      if (!confirmDelete) return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/wardrobe/${id}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        throw new Error('Ошибка при удалении вещи');
      }
      
      setWardrobeItems(wardrobeItems.filter(item => item.id !== id));
      setCurrentOutfitItems(currentOutfitItems.filter(item => item.id !== id));
    } catch (err) {
      console.error('Ошибка удаления вещи:', err);
      alert('Не удалось удалить вещь. Пожалуйста, попробуйте снова.');
    }
  };
 
  const addToOutfit = (item) => {
    const hasCategory = currentOutfitItems.some(i => 
      (i.category || i.item?.category) === item.category
    );
    
    if (hasCategory) {
      if (!window.confirm(`Заменить ${getCategoryName(item.category)} в образе?`)) return;
      setCurrentOutfitItems(prev => 
        prev.filter(i => (i.category || i.item?.category) !== item.category)
      );
    }
    
    setCurrentOutfitItems(prev => [...prev, {
      id: item.id,
      name: item.name,
      category: item.category,
      color: item.color,
      image: item.image
    }]);
  };
  const removeFromOutfit = (idToRemove) => {
    setCurrentOutfitItems(prevItems =>
      prevItems.filter(item =>
        (item.id ?? item.item_id) !== idToRemove
      )
    );
  };
  
  const saveOutfit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', formData.outfitName || 'Мой образ');
    form.append('style', formData.outfitStyle);
    form.append('description', formData.outfitDescription || 'Без описания');
    form.append('items', JSON.stringify(currentOutfitItems.map(item => ({ id: item.id }))));
  
    if (formData.outfitCover) {
      form.append('cover', formData.outfitCover);
    }
    try {
      let response;
      if (formData.editingOutfitId) {
        response = await fetch(`${API_BASE_URL}/outfits/${formData.editingOutfitId}`, {
          method: 'PUT',
          body: form,
          credentials: 'include'
        });
      } else {
        response = await fetch(`${API_BASE_URL}/outfits`, {
          method: 'POST',
          body: form,
          credentials: 'include'
        });
      }
  
      if (!response.ok) throw new Error('Ошибка сохранения образа');
  
      const updatedOrCreated = await response.json();
  
      if (formData.editingOutfitId) {
        setSavedOutfits(savedOutfits.map(o =>
          o.id === updatedOrCreated.id ? updatedOrCreated : o
        ));
      } else {
        setSavedOutfits([...savedOutfits, updatedOrCreated]);
      }
  
      setCurrentOutfitItems([]);
      setFormData({
        ...formData,
        editingOutfitId: null,
        outfitName: '',
        outfitStyle: 'casual',
        outfitDescription: '',
        outfitCover: null,
        outfitCoverPreview: ''
      });
    } catch (err) {
      console.error('Ошибка сохранения образа:', err);
      alert('Не удалось сохранить образ.');
    }
  };
  
  const publishOutfit = async (outfitId) => {
    setIsPublishing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/outfits/${outfitId}/publish`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Ошибка публикации');
      
      const updatedOutfit = await response.json();
      updatedOutfit.isShared = updatedOutfit.is_shared;
      setSavedOutfits(savedOutfits.map(outfit => 
        outfit.id === outfitId ? updatedOutfit : outfit
      ));
      alert('Образ опубликован!');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const unpublishOutfit = async (outfitId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/outfits/${outfitId}/unpublish`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Ошибка снятия с публикации');

    const updatedOutfit = await response.json();
    updatedOutfit.isShared = updatedOutfit.is_shared;
    setSavedOutfits(savedOutfits.map(outfit =>
      outfit.id === outfitId ? updatedOutfit : outfit
    ));
    alert('Образ снят с публикации.');
  } catch (err) {
    alert(err.message);
  }
};

  const deleteOutfit = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот образ?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/outfits/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSavedOutfits(prev => prev.filter(o => o.id !== id));
      } else {
        throw new Error('Не удалось удалить образ');
      }
    } catch (err) {
      console.error('Ошибка удаления образа:', err);
      alert('Не удалось удалить образ. Пожалуйста, попробуйте снова.');
    }
  };

  const getCategoryName = (category) => {
    const names = {
      'top': 'Верх',
      'bottom': 'Низ',
      'shoes': 'Обувь',
      'accessories': 'Аксессуар'
    };
    return names[category] || category;
  };

  const getStyleName = (style) => {
    const names = {
      'casual': 'Повседневный',
      'business': 'Деловой',
      'sport': 'Спортивный',
      'evening': 'Вечерний',
      'street': 'Уличный'
    };
    return names[style] || style;
  };

  if (isLoading) {
    return <div className="loading">Загрузка данных...</div>;
  }

  if (error) {
    return <div className="error">Ошибка: {error}. Используется локальное хранилище.</div>;
  }

  return (
    <div className="main-page">
    {isAuthenticated === false && (
      <div className="unauthorized-message">
        <p>Просим авторизоваться, чтобы пользоваться гардеробом и создавать образы.</p>
        <a href="/login" style={{ color: '#007bff', textDecoration: 'underline' }}>
          Перейти к авторизации
        </a>
      </div>
    )}

    {isAuthenticated === true && (
      <>      
      {userInfo && (
    <div className="user-banner">
      <h2>Добро пожаловать, <span>{userInfo.username}</span>!</h2>
    </div>
)}

      <main className="container-w">
        <section className="section">
          <h2 className="section-title"><FaCloudUploadAlt /> Добавить вещь</h2>
          <form onSubmit={addItem} className="upload-form">
            <div className="form-group">
              <label htmlFor="itemName">Название вещи</label>
              <input
                type="text"
                id="itemName"
                name="itemName"
                className="form-control"
                placeholder="Например: Белая футболка"
                value={formData.itemName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Категория</label>
              <select
                id="category"
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Выберите категорию</option>
                <option value="top">Верх</option>
                <option value="bottom">Низ</option>
                <option value="shoes">Обувь</option>
                <option value="accessories">Аксессуары</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="color">Основной цвет</label>
              <input
                type="color"
                id="color"
                name="color"
                className="form-control"
                value={formData.color}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="season">Сезон</label>
              <select
                id="season"
                name="season"
                className="form-control"
                value={formData.season}
                onChange={handleInputChange}
              >
                <option value="all">Всесезонная</option>
                <option value="summer">Лето</option>
                <option value="winter">Зима</option>
                <option value="demi">Демисезон</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="image">Изображение</label>
              <input
                type="file"
                id="image"
                name="image"
                className="form-control"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
              <div className="image-preview-container">
                {formData.imagePreview && (
                  <img src={formData.imagePreview} className="image-preview" alt="Предпросмотр" />
                )}
              </div>
            </div>
            <button type="submit" className="btn">Добавить в гардероб</button>
          </form>
          <div className="mt-3">
          <h2
            className="section-title"
            onClick={() => setIsWardrobeOpen(!isWardrobeOpen)}
            style={{ cursor: 'pointer' }}
          >
            <FaTshirt /> Мой гардероб {isWardrobeOpen ? '▲' : '▼'}
          </h2>

            <div className="wardrobe-items">
              {wardrobeItems.length === 0 ? (
                <p className="text-center">Ваш гардероб пуст</p>
              ) : (isWardrobeOpen && (
                ['top', 'bottom', 'shoes', 'accessories'].map(category => (
                  <div key={category} className="wardrobe-category">
                    <h4>{getCategoryName(category)}</h4>
                    <div className="wardrobe-items">
                      {wardrobeItems.filter(i => i.category === category).map(item => (
                        <div
                          key={item.id}
                          className="wardrobe-item"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', item.id.toString());
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onClick={() => addToOutfit(item)}
                        >
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <div
                              className="color-placeholder"
                              style={{ backgroundColor: item.color }}
                            ></div>
                          )}
                          <button 
                            className="delete-item-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                          >
                            <FaTimes />
                          </button>
                          <div className="item-info">
                            <h4>{item.name}</h4>
                            <span className="item-category">{getCategoryName(item.category)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            ))}
            </div>
          </div> 
        </section> 
        <section className="section">          
          <h2 className="section-title"><FaMagic /> Создать образ</h2>
        <div className="weather-section">
      <div className="weather-controls">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') getWeatherRecommendation(location);
          }}
          placeholder="Введите город"
        />
        <button 
          onClick={() => getWeatherRecommendation(location)}
          disabled={!location.trim()}
        >
          {loading ? "Загрузка..." : "Обновить погоду"}
        </button>
      </div>
      {weather ? (
        <div className="weather-info fade-in">
          <h3>Погода в {weather.name}</h3>
          <p>Температура: {Math.round(weather.main.temp)}°C</p>
          <p>Погода: {weather.weather[0]?.description}</p>
          <p>Ощущается как: {Math.round(weather.main.feels_like)}°C</p>
          <p>Влажность: {weather.main.humidity}%</p>
          <p className="recommendation">
            <strong>Рекомендация:</strong> {generateClothingRecommendation(weather)}
          </p>
        </div>
      ) : weatherError ? (
        <div className="weather-error fade-in">
          Ошибка: {weatherError}
          <p>Проверьте название города</p>
        </div>
      ) : (
        <p>Введите город, чтобы получить погоду</p>
      )}
    </div>
          <div className="outfit-builder">
            <div 
              className="outfit-preview"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('drag-over');
                e.currentTarget.style.backgroundColor = '';
                const itemId = e.dataTransfer.getData('text/plain');
                const item = wardrobeItems.find(i => i.id.toString() === itemId);
                if (item) {
                  addToOutfit(item);
                }
              }}
            >
              {currentOutfitItems.length === 0 ? (
                <p className="empty-outfit-message">Перетащите сюда вещи из гардероба</p>
              ) : (
                currentOutfitItems.map((item, i) => (
                  <div 
                  key={item.id ? `item-${item.id}` : `generated-${i}`}
                      style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}
                                    className="outfit-item">
                    {item.name || item.image ? (
                      item.image ? (
                        <img src={item.image} alt={item.name || 'Вещь'} />
                      ) : (
                        <div className="color-placeholder" style={{ backgroundColor: item.color || '#ccc' }}></div>
                      )
                    ) : (
                      <div className="missing-item">
                        <div className="color-placeholder" style={{ backgroundColor: '#ccc' }}></div>
                        <span className="missing-label">Вещь не найдена</span>
                      </div>
                    )}
                  <button 
                    className="remove-item"
                    onClick={() => removeFromOutfit(item.id ?? item.item_id)}
                  >
                    <FaTimes />
                  </button>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={saveOutfit}>
              <div className="form-group">
                <label htmlFor="outfitCover">Обложка образа</label>
                <input
                  type="file"
                  id="outfitCover"
                  name="outfitCover"
                  className="form-control"
                  accept="image/*"
                  onChange={handleOutfitCoverChange}
                />
                <div className="image-preview-container">
                  {formData.outfitCoverPreview && (
                    <img src={formData.outfitCoverPreview} className="image-preview" alt="Предпросмотр обложки" />
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="outfitName">Название образа</label>
                <input
                  type="text"
                  id="outfitName"
                  name="outfitName"
                  className="form-control"
                  placeholder="Мой повседневный образ"
                  value={formData.outfitName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="outfitStyle">Стиль</label>
                <select
                  id="outfitStyle"
                  name="outfitStyle"
                  className="form-control"
                  value={formData.outfitStyle}
                  onChange={handleInputChange}
                >
                  <option value="casual">Повседневный</option>
                  <option value="business">Деловой</option>
                  <option value="sport">Спортивный</option>
                  <option value="evening">Вечерний</option>
                  <option value="street">Уличный</option>
                </select>
              </div> 
              <div className="form-group">
                <label htmlFor="outfitDescription">Описание</label>
                <textarea
                  id="outfitDescription"
                  name="outfitDescription"
                  className="form-control"
                  rows="3"
                  placeholder="Опишите ваш образ..."
                  value={formData.outfitDescription}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="btn"
                disabled={currentOutfitItems.length === 0 || (!formData.outfitCover && !formData.editingOutfitId)}
                >Сохранить образ
              </button>

            </form>
          </div>
        </section>
        
        <section className="section" style={{ gridColumn: 'span 2' }}>
          <h2 className="section-title"><FaPaw /> Мои образы</h2>
          <div className="outfits-gallery">
            {savedOutfits.length === 0 ? (
              <p className="text-center">У вас пока нет сохраненных образов</p>
            ) : (
              savedOutfits.map(outfit => (
                <div key={outfit.id} className="outfit-card-q">
                  <div className="outfit-cover">
                    {outfit.cover ? (
                      <img src={outfit.cover} alt={outfit.name} />
                    ) : (
                      <div className="color-placeholder"></div>
                    )}
                    {outfit.isShared && (
                      <div className="shared-badge">
                        <FaShare /> Опубликовано
                      </div>
                    )}
                  </div>
                  <div className="outfit-main-info">
                    <h3>{outfit.name}</h3>
                    <span className="outfit-style">{getStyleName(outfit.style)}</span>
                  </div>
                  <div className="outfit-details" style={{ display: outfit.showDetails ? 'block' : 'none' }}>
                    <p className="outfit-description">{outfit.description}</p>
                    <div className="outfit-items-grid">
                    {outfit.items.map((item, index) => (
                      <div key={item.item_id || `missing-${index}`} className="outfit-item-preview">
                        {item.name ? (
                          item.image ? (
                            <img src={item.image} alt={item.name || 'Вещь не найдена'} />
                          ) : (
                            <div className="color-placeholder" style={{ backgroundColor: item.color }}></div>
                          )
                        ) : (
                          <div className="missing-item">
                            <div className="color-placeholder" style={{ backgroundColor: '#ccc' }}></div>
                            <span className="missing-label">Вещь не найдена</span>
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
                    <div className="outfit-actions">
                    {outfit.isShared ? (
                      <div className="already-published">
                        <button 
                          className="btn btn-secondary"
                          onClick={() => unpublishOutfit(outfit.id)}
                        >
                          <FaBan /> Отменить публикацию
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn btn-publish"
                        onClick={() => publishOutfit(outfit.id)}
                        disabled={isPublishing}
                      >
                        <FaShare /> {isPublishing ? 'Публикация...' : 'Выложить'}
                      </button>
                    )}
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          const unifiedItems = outfit.items.map(item => ({
                            id: item.id || item.item_id,
                            name: item.name,
                            category: item.category,
                            color: item.color,
                            image: item.image
                          }));
                          setCurrentOutfitItems(unifiedItems);
                          setFormData({
                            ...formData,
                            editingOutfitId: outfit.id,
                            outfitName: outfit.name,
                            outfitStyle: outfit.style,
                            outfitDescription: outfit.description,
                            outfitCover: null,
                            outfitCoverPreview: outfit.cover
                          });
                        }} 
                      >
                        <FaEdit /> Изменить
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => deleteOutfit(outfit.id)}
                      >
                        <FaTrash /> Удалить
                      </button>
                    </div>
                  </div>
                  <button 
                    className="toggle-details"
                    onClick={() => {
                      const updatedOutfits = savedOutfits.map(o => 
                        o.id === outfit.id ? { ...o, showDetails: !o.showDetails } : o
                      );
                      setSavedOutfits(updatedOutfits);
                    }}
                  >
                    {outfit.showDetails ? <FaMinus /> : <FaPlus />}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer/>
      </>
    )}
    </div>
  );
};

export default MainPage;