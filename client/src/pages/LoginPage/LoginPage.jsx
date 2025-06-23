import React, { useState } from 'react';
import './login.css';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        const meRes = await fetch("http://localhost:5000/api/me", {
          credentials: "include",
        });
        const userData = await meRes.json();

        setUser(userData);
        navigate("/");
      } else {
        alert("Неверные данные");
      }
    } catch (err) {
      console.error("Ошибка при входе:", err);
      alert("Произошла ошибка при попытке входа");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Вход</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-field">
            <i className="fas fa-user"></i>
            <input
              type="text"
              placeholder="Логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-field">
            <i className="fas fa-lock"></i>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="toggle-visibility" onClick={() => setShowPassword(!showPassword)}>
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </span>
          </div>
          <div className="reg">
            <button type="submit" className="login-btn">Войти</button>
            <button type="button" className="register-btn" onClick={() => navigate('/register')}>Зарегистрироваться</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
