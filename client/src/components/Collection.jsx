import { useEffect, useState }from 'react';
import { FaHeart} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Filter from './Filter';
import '../pages/Home/home.css';

export default function Collection() {
  const [outfits, setOutfits] = useState([]);
  const [filteredOutfits, setFilteredOutfits] = useState([]);
  const [likedOutfits, setLikedOutfits] = useState([]); // список id
  const [, setUserAuthenticated] = useState(false);

  useEffect(() => {
    const fetchOutfits = async () => {
      try {
        const response = await fetch('/api/outfits/shared', {
          credentials: 'include',
        });
        if (!response.ok) throw new Error(`Ошибка: ${response.statusText}`);
        const data = await response.json();
        setOutfits(data);
        setFilteredOutfits(data);
      } catch (err) {
        console.error('Ошибка загрузки образов:', err);
      }
    };

    const fetchFavorites = async () => {
      try {
        const res = await fetch('/api/favorites', { credentials: 'include' });
        if (res.ok) {
          const favs = await res.json();
          const likedIds = favs.map(o => o.id);
          setLikedOutfits(likedIds);
          setUserAuthenticated(true);
        } else {
          setUserAuthenticated(false);
        }
      } catch (err) {
        console.warn('Пользователь не авторизован или ошибка при загрузке избранного');
      }
    };
      fetchOutfits();
      fetchFavorites();
    }, []);
    
  const toggleLike = async (id) => {
    try {
      const response = await fetch(`/api/favorites/${id}`, {
        method: 'POST',
        credentials: 'include',
      });
  
      if (response.status === 401) {
        if (window.confirm('Чтобы поставить лайк, пожалуйста, авторизуйтесь. Перейти к авторизации?')) {
          window.location.href = '/login'; // ⚠️ путь на страницу логина
        }
        return;
      }
  
      const result = await response.json();
        setLikedOutfits((prev) =>
        result.liked ? [...prev, id] : prev.filter((likedId) => likedId !== id)
      );
  
      setOutfits((prev) => {
        const updated = prev.map((outfit) =>
          outfit.id === id
            ? { ...outfit, likes: (outfit.likes || 0) + (result.liked ? 1 : -1) }
            : outfit
        );
        setFilteredOutfits(updated);
        return updated;
      });
  
      const heartEl = document.getElementById(`heart-${id}`);
      if (heartEl) {
        heartEl.classList.add('heart-animate');
        setTimeout(() => heartEl.classList.remove('heart-animate'), 300);
      }
  
    } catch (err) {
      console.error('Ошибка при переключении лайка:', err);
    }
  };
  
  return (
    <section className="collection">
      <Filter outfits={outfits} setFilteredOutfits={setFilteredOutfits} />
      <h2>Опубликованные образы</h2>

      <div className="collection-list">
        {filteredOutfits.length === 0 ? (
          <p>Образы не найдены</p>
        ) : (
          filteredOutfits.map((item) => (
            <div className="collection-card" key={item.id}>
             
              <Link to={`/description?id=${item.id}`} className="card-link">
                <img
                  src={item.cover}
                  alt={`Образ ${item.name}`}
                  className="collection-image"
                />
              </Link>

              <div className="collection-actions">
              <button
                id={`heart-${item.id}`}
                className={`like-btn ${likedOutfits.includes(item.id) ? 'liked' : 'unliked'}`}
                onClick={() => toggleLike(item.id)}
              >
                <FaHeart /> {item.likes || 0}
              </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}