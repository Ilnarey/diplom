import React, { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
import axios from 'axios';
import '../pages/Favorite/Favorite.css';

const OutfitCard = ({ outfit, onRemove, isFavorite: initialFavorite }) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite ?? false);
  const [likeCount, setLikeCount] = useState(outfit.likes || 0);

  useEffect(() => {
    if (initialFavorite !== undefined) {
      setIsFavorite(initialFavorite); // если передали — установи
      return;
    }

    // иначе делаем запрос
    const checkFavorite = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/favorites', {
          withCredentials: true,
        });
        const ids = res.data.map(f => f.outfit_id);
        setIsFavorite(ids.includes(outfit.id));
      } catch (err) {
        console.error('Ошибка при проверке избранного:', err);
      }
    };

    checkFavorite();
  }, [outfit.id, initialFavorite]);


  const handleFavoriteToggle = async () => {
    try {
      const res = await axios.post(`http://localhost:5000/api/favorites/${outfit.id}`, {}, {
        withCredentials: true
      });

      setIsFavorite(res.data.liked);
      setLikeCount(prev => res.data.liked ? prev + 1 : prev - 1);

      if (!res.data.liked && onRemove) {
        onRemove(outfit.id); // Удаляем из избранного
      }
    } catch (err) {
      console.error('Ошибка при обновлении избранного:', err);
    }
  };

  return (
    <div className="outfit-card-custom">
      <a href={`/description?id=${outfit.id}`}>
        <img src={outfit.cover} alt={outfit.name} className="cover-img" />
      </a>
      <div className="card-info">
        <h3 className="card-title">{outfit.name}</h3>
        <div className="like-section">
          <button onClick={handleFavoriteToggle} className="heart-btn">
            <FaHeart color={isFavorite ? 'crimson' : 'gray'} size={22} />
          </button>
          <span className="like-count">{likeCount}</span>
        </div>
      </div>
    </div>
  );
};

export default OutfitCard;
