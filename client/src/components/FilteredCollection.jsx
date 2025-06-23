import { useEffect, useState } from 'react';
import Collection from './Collection';

export default function FilteredCollection() {
  const [allOutfits, setAllOutfits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const fetchOutfits = async () => {
      try {
        const response = await fetch('/api/outfits/shared', {
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Ошибка загрузки');

        const data = await response.json();
        setAllOutfits(data);
        setFiltered(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOutfits();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFiltered(
      allOutfits.filter(outfit =>
        outfit.name.toLowerCase().includes(term) ||
        outfit.description?.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, allOutfits]);

  return (
    <div>
      <input
        type="text"
        placeholder="Поиск образов..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <Collection outfits={filtered} />
    </div>
  );
}
