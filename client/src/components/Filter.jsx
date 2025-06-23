import React, { useState } from 'react';
import '../pages/Home/home.css';

export default function Filter({ outfits, setFilteredOutfits }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleApply = () => {
    const query = searchQuery.toLowerCase();

    const filtered = outfits.filter((outfit) => {
      const inName = outfit.name?.toLowerCase().includes(query);
      const inDescription = outfit.description?.toLowerCase().includes(query);
      const inItems = outfit.items?.some(item =>
        item.name?.toLowerCase().includes(query)
      );

      return inName || inDescription || inItems;
    });

    setFilteredOutfits(filtered);
  };

  return (
    <section className="filter">
      <div className="filter-container">
      <div className="filter-group">
        <input
          id="searchInput"
          type="text"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleApply();
            }
          }}
        />
      </div>
        <button className="apply-filter-btn" onClick={handleApply}>
          Найти
        </button>
      </div>
    </section>
  );
}
