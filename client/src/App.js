import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from "react";
import MainPage from './pages/MainPage/MainPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/LoginPage/RegisterPage';
import Home from './pages/Home/home';
import ItemPage from './pages/ItemPage/ItemPage';
import Favorite from './pages/Favorite/Favorite';
import axios from 'axios';
import LayoutWithHeader from './components/LayoutWithHeader';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/me', {
      withCredentials: true,
    }).then(res => {
      setUser(res.data);
    }).catch(() => {
      setUser(null);
    });
  }, []);

  return (
    <Router>
      <Routes>
      <Route element={<LayoutWithHeader user={user} setUser={setUser}/>}>        
        <Route path="/outfits/:id" element={<MainPage user={user} />} />
        <Route path="/description" element={<ItemPage />} /> 
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<Favorite />} />

      </Route>
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
}

export default App;
