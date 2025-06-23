// src/services/database.js
import Database from 'better-sqlite3';

class WardrobeDatabase {
  constructor() {
    this.db = new Database('wardrobe.db');
    this.initializeDatabase();
  }

  initializeDatabase() {
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS outfits (
        id INTEGER PRIMARY KEY,
        style TEXT,
        tone TEXT,
        weather TEXT,
        image TEXT
      )
    `).run();

    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS likes (
        outfit_id INTEGER,
        liked INTEGER, -- 1 for like, 0 for dislike
        FOREIGN KEY(outfit_id) REFERENCES outfits(id),
        UNIQUE(outfit_id, liked)
      )
    `).run();

    // Insert sample data if empty
    const count = this.db.prepare('SELECT COUNT(*) as count FROM outfits').get();
    if (count.count === 0) {
      const insert = this.db.prepare(`
        INSERT INTO outfits (id, style, tone, weather, image) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const outfits = [
        [1, 'casual', 'light', 'warm', 'IMG/obraz1.png'],
        [2, 'business', 'dark', 'cold', 'IMG/obraz2.png'],
        [3, 'sport', 'bright', 'rain', 'IMG/obraz3.png'],
        [4, 'casual', 'light', 'warm', 'IMG/obraz4.png'],
        [5, 'casual', 'light', 'warm', 'IMG/obraz5.png']
      ];
      
      const transaction = this.db.transaction(() => {
        outfits.forEach(outfit => insert.run(outfit));
      });
      
      transaction();
    }
  }

  getOutfitsWithLikes() {
    return this.db.prepare(`
      SELECT o.*, 
             (SELECT liked FROM likes WHERE outfit_id = o.id AND liked = 1) as is_liked,
             (SELECT liked FROM likes WHERE outfit_id = o.id AND liked = 0) as is_disliked
      FROM outfits o
    `).all();
  }

  getFilteredOutfits(filters) {
    let query = 'SELECT * FROM outfits WHERE 1=1';
    const params = [];

    if (filters.style !== 'all') {
      query += ' AND style = ?';
      params.push(filters.style);
    }

    if (filters.tone !== 'all') {
      query += ' AND tone = ?';
      params.push(filters.tone);
    }

    if (filters.weather !== 'all') {
      query += ' AND weather = ?';
      params.push(filters.weather);
    }

    const outfits = this.db.prepare(query).all(...params);
    
    // Get likes for each outfit
    return outfits.map(outfit => {
      const likeStatus = this.db.prepare(`
        SELECT liked FROM likes WHERE outfit_id = ?
      `).get(outfit.id);
      
      return {
        ...outfit,
        isLiked: likeStatus?.liked === 1,
        isDisliked: likeStatus?.liked === 0
      };
    });
  }

  toggleLike(outfitId, like) {
    // Remove any existing like/dislike for this outfit
    this.db.prepare(`
      DELETE FROM likes WHERE outfit_id = ?
    `).run(outfitId);

    // If like is not null (user is setting a like/dislike, not removing)
    if (like !== null) {
      this.db.prepare(`
        INSERT INTO likes (outfit_id, liked) VALUES (?, ?)
      `).run(outfitId, like ? 1 : 0);
    }

    return this.db.prepare(`
      SELECT liked FROM likes WHERE outfit_id = ?
    `).get(outfitId);
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
const database = new WardrobeDatabase();
export default database;