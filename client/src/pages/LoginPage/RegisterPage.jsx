import React, { useState } from 'react';
import './login.css';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
 
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    const re = /^(?=.*[A-Z])(?=.*[\d@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/;
    return re.test(password);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    if (!validateEmail(email)) {
      newErrors.email = 'Неверный формат email';
    }

    if (!validatePassword(password)) {
      newErrors.password =
        'Пароль должен быть не менее 8 символов, содержать одну заглавную букву и цифру или спецсимвол';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (!username.trim()) {
      newErrors.username = 'Введите логин';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const res = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
    });

    const data = await res.json();
    if (data.success) {
      alert('Регистрация успешна!');
      navigate('/login');
    } else {
      setErrors({ general: data.message });
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Регистрация</h2>
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
            {errors.username && <span className="error">{errors.username}</span>}
          </div>
          <div className="input-field">
            <i className="fas fa-envelope"></i>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && <span className="error">{errors.email}</span>}
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
            {errors.password && <span className="error">{errors.password}</span>}
          </div>
          <div className="input-field">
            <i className="fas fa-lock"></i>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span className="toggle-visibility" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </span>
            {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
          </div>
          {errors.general && <div className="error general-error">{errors.general}</div>}
          <div className="reg">
            <button type="submit" className="login-btn">Зарегистрироваться</button>
            <button type="button" className="register-btn" onClick={() => navigate('/login')}>Войти</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
