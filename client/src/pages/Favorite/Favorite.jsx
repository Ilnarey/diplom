
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OutfitCard from '../../components/OutfitCard';
import Footer from '../../components/Footer';
import './Favorite.css'

const Favorite = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/favorites', {
          withCredentials: true,
        });
        setFavorites(res.data);
      } catch (err) {
        console.error('Ошибка при загрузке избранного:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  if (loading) return <div className="text-center mt-10">Загрузка...</div>;

  return (
    <div className="favorite-page">
      {favorites.length === 0 ? (
        <div className="empty-state">
          <p>У вас пока нет избранных образов.</p>
        </div>
      ) : (
        <div className="container">
          <h1 className="text-center font-bold mb-6">Избранные образы</h1>
          <div className="collection-list">
            {favorites.map((outfit) => (
              <OutfitCard
              key={outfit.id}
              outfit={outfit}
              isFavorite={outfit.isFavorite === true}
            />
            ))}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
    
};

export default Favorite;
