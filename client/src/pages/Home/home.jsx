import React, { useState } from 'react';
import Collection from '../../components/Collection';
import Footer from '../../components/Footer';
import './home.css';

export default function Home() {
  const [filters] = useState({
    style: 'all',
    tone: 'all',
    weather: 'all'
  });

  return (
    <>
      <Collection filters={filters} />
      <Footer />
    </>
  );
}
