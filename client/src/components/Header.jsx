import React from 'react';
import { FaHome, FaUserCircle, FaSignOutAlt, FaStar  } from 'react-icons/fa';
import '../pages/Home/home.css';
import { useNavigate } from 'react-router-dom';

export default function Header({ user, setUser }) {
  const navigate = useNavigate();

  const handleUserClick = () => {
    if (user) {
      navigate(`/outfits/${user.id}`);
    } else {
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Ошибка при выходе:', err);
      alert('Не удалось завершить сессию');
    }
  };

  return (
    <section className="header">
      <div className="logo">
        <img className="logotip" src="/logo.png" alt="Логотип" />
      </div>
      <div className="garderob">
        <h1>Мой гардероб</h1>
      </div>
      <div className="profil">
        <a href="/favorites" className="profile-link-zero">
          <FaStar className="fa-star" />
        </a>
        <a href="/" className="profile-link-one">
          <FaHome className="fa-house" />
        </a>
        <button onClick={handleUserClick} className="profile-link-two">
          <FaUserCircle className="user-icon" />
        </button>
        {user && (
          <button onClick={handleLogout} className="profile-link-tree">
            <FaSignOutAlt className="out" />
          </button>
        )}
      </div>
    </section>
  );
}
