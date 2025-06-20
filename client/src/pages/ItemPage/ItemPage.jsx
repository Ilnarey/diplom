import React, { useEffect, useState  } from 'react';
import { useLocation, useNavigate} from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './ItemPage.css';

export default function ItemPage() {
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const outfitId = queryParams.get('id');

    const fetchOutfitDetails = async () => {
      try {
        const response = await fetch(`/api/outfits/${outfitId}`);
        const data = await response.json();
        setOutfit(data);
      } catch (err) {
        console.error('Ошибка загрузки информации об образе:', err);
      }
    };

    if (outfitId) {
      fetchOutfitDetails();
    }
  }, [location]);

  if (!outfit) {
    return <div>Загрузка...</div>;
  }

  return (
    
    <div className="item-page">
      <button className="back-button" onClick={() => navigate(-1)}>
      <FaArrowLeft className="left"  />
      </button>
      <h2>{outfit.name}</h2>
      
      <img src={outfit.cover} alt={outfit.name} />
      <p>{outfit.description}</p>
      <h3>Состав:</h3>
      <ul className="outfit-items-list-q">
        {Array.isArray(outfit.items) ? (
          outfit.items.map(item => (
            <li key={item.id} className="outfit-item-q">
              <div className="item-image-block">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="item-image" 
                  />
                ) : (
                  <div className="color-placeholder" style={{ backgroundColor: item.color }}></div>
                )}
                <div className="item-name">{item.name}</div>
              </div>
            </li>
          ))
        ) : (
          <p>Нет данных о составе образа.</p>
        )}
      </ul>
    </div>
  );  
}
