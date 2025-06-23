import React from 'react';
import { FiFacebook, FiInstagram, FiTwitter } from 'react-icons/fi';
import { FaVk } from 'react-icons/fa';
import '../pages/Home/home.css';

export default function Footer() {
  return (
    <section className="footer">
        <div className="footer-container">
          <div className="footer-info">
            <h1>Мой гардероб</h1>
            <p>Создайте свой идеальный стиль вместе с нами!</p>
            <p>&copy; {new Date().getFullYear()} Все права защищены.</p>
          </div>
      
          <div className="footer-social">
            <h3>Присоединяйтесь к нам</h3>
            <ul className="social-icons">
              <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FiFacebook /></a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FiInstagram /></a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FiTwitter /></a></li>
              <li><a href="https://vk.com" target="_blank" rel="noopener noreferrer"><FaVk /></a></li>
            </ul>
          </div>
      
          <div className="footer-links">
            <h3>Полезные ссылки</h3>
            <ul>
              <li><a href="http://127.0.0.1:5501/index.html">О нас</a></li>
              <li><a href="http://127.0.0.1:5501/index.html">Контакты</a></li>
              <li><a href="http://127.0.0.1:5501/index.html">Условия использования</a></li>
              <li><a href="http://127.0.0.1:5501/index.html">Политика конфиденциальности</a></li>
            </ul>
          </div>
      
          <div className="footer-credits">
            <p>Разработано с ❤️ </p>
            <p>Команда My Wardrobe</p>
            <p>Свяжитесь с нами: <a href="mailto:support@mywardrobe.com">support@mywardrobe.com</a></p>
          </div>
        </div>
      </section>
  );
}
