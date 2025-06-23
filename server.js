const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const app = express();

const db = new Pool({
  user: 'postgres',     
  host: 'localhost',
  database: 'wardrobe_db', 
  password: 'Ilnara22',
  port: 5432,
});

(async () => {
  try {
    await db.connect();
    console.log('PostgreSQL подключен');
  } catch (err) {
    console.error('Ошибка подключения к PostgreSQL:', err);
  }
})();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/login', async (req, res) => {
 const { username, password } = req.body;
const userRes = await db.query(
  'SELECT * FROM users WHERE username = $1',
  [username]
);

if (userRes.rows.length === 0) {
  return res.status(400).json({ error: 'Неверные данные' });
}

const user = userRes.rows[0];
const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
  return res.status(401).json({ error: 'Неверный пароль' });
}

req.session.username = username;
res.json({ success: true });

});

app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3)',
      [username, hashedPassword, email]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Ошибка при выходе:', err);
      return res.status(500).json({ message: 'Ошибка выхода' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Вы вышли из системы' });
  });
});

app.get('/api/me', async (req, res) => {
  if (!req.session.username) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await db.query('SELECT id, username FROM users WHERE username = $1', [req.session.username]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка запроса' });
  }
});

app.get('/api/outfits/shared', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*, u.username
      FROM outfits o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.is_shared = TRUE
      ORDER BY o.id DESC
    `);

    const outfitsWithItems = await Promise.all(result.rows.map(async (outfit) => {
      const items = await db.query(`
        SELECT w.*
        FROM outfit_items oi
        JOIN wardrobe w ON w.id = oi.item_id
        WHERE oi.outfit_id = $1
      `, [outfit.id]);

      return {
        ...outfit,
        items: items.rows
      };
    }));

    res.json(outfitsWithItems);
  } catch (err) {
    console.error('Ошибка получения опубликованных образов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/favorites', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userRes = await db.query('SELECT id FROM users WHERE username = $1', [req.session.username]);
    const userId = userRes.rows[0].id;

    const favorites = await db.query(`
      SELECT o.*, u.username
      FROM favorites f
      JOIN outfits o ON o.id = f.outfit_id
      JOIN users u ON u.id = o.user_id
      WHERE f.user_id = $1
    `, [userId]);

    const outfitsWithItems = await Promise.all(favorites.rows.map(async (outfit) => {
      const items = await db.query(`
        SELECT w.*
        FROM outfit_items oi
        JOIN wardrobe w ON w.id = oi.item_id
        WHERE oi.outfit_id = $1
      `, [outfit.id]);

      return { ...outfit, items: items.rows, isFavorite: true };
    }));

    res.json(outfitsWithItems);
  } catch (err) {
    console.error('Ошибка получения избранных:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/favorites/:id', async (req, res) => {
  const { id } = req.params;

  if (!req.session.username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userResult = await db.query('SELECT id FROM users WHERE username = $1', [req.session.username]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const userId = userResult.rows[0].id;

    const likeResult = await db.query(
      'SELECT * FROM favorites WHERE user_id = $1 AND outfit_id = $2',
      [userId, id]
    );

    if (likeResult.rows.length > 0) {
      await db.query('DELETE FROM favorites WHERE user_id = $1 AND outfit_id = $2', [userId, id]);
      await db.query('UPDATE outfits SET likes = likes - 1 WHERE id = $1 AND likes > 0', [id]);
      res.json({ liked: false });
    } else {
      await db.query('INSERT INTO favorites (user_id, outfit_id) VALUES ($1, $2)', [userId, id]);
      await db.query('UPDATE outfits SET likes = likes + 1 WHERE id = $1', [id]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('Ошибка обработки лайка:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/wardrobe', upload.single('image'), async (req, res) => {
  const { name, category, color, season } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const userRes = await db.query('SELECT id FROM users WHERE username = $1', [req.session.username]);
    const userId = userRes.rows[0].id;

    const insertRes = await db.query(
      `INSERT INTO wardrobe (name, category, color, season, image, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, category, color, season, image, userId]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    console.error('Ошибка добавления вещи:', err);
    res.status(500).json({ error: 'Ошибка при добавлении вещи' });
  }
});

app.post('/api/outfits', upload.single('cover'), async (req, res) => {
  const { name, style, description } = req.body;
  const cover = req.file ? `/uploads/${req.file.filename}` : null;

  let items;
  try {
    items = JSON.parse(req.body.items);
  } catch (e) {
    return res.status(400).json({ error: 'Неверный формат items' });
  }

  if (!req.session.username) {
    return res.status(401).json({ error: 'Не авторизован' });
  }

  try {
    const userRes = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [req.session.username]
    );
    const userId = userRes.rows[0].id;

    const insertOutfit = await db.query(
      `INSERT INTO outfits (name, style, description, cover, user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, style, description, cover, userId]
    );
    const outfitId = insertOutfit.rows[0].id;

    for (const item of items) {
      await db.query(
        'INSERT INTO outfit_items (outfit_id, item_id) VALUES ($1, $2)',
        [outfitId, item.id]
      );
    }

    const created = await db.query('SELECT * FROM outfits WHERE id = $1', [outfitId]);
    const itemRes = await db.query(
      `SELECT oi.item_id, w.name, w.image, w.color, w.category
       FROM outfit_items oi
       LEFT JOIN wardrobe w ON w.id = oi.item_id
       WHERE oi.outfit_id = $1`,
      [outfitId]
    );

    res.status(201).json({ ...created.rows[0], items: itemRes.rows });
  } catch (err) {
    console.error('POST /api/outfits error:', err);
    res.status(500).json({ error: 'Ошибка сохранения образа' });
  }
});

app.post('/api/outfits/:id/publish', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('BEGIN');

    const result = await db.query(
      'UPDATE outfits SET is_shared = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Outfit not found' });
    }

    const outfit = result.rows[0];

    const items = await db.query(`
      SELECT w.* FROM wardrobe w
      JOIN outfit_items oi ON w.id = oi.item_id
      WHERE oi.outfit_id = $1
    `, [id]);

    await db.query('COMMIT');

    res.json({
      ...outfit,
      items: items.rows
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Ошибка публикации образа:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка публикации образа' });
    }
  }
});

app.post('/api/outfits/:id/unpublish', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'UPDATE outfits SET is_shared = FALSE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outfit not found' });
    }

    const outfit = result.rows[0];

    const items = await db.query(`
      SELECT w.* FROM wardrobe w
      JOIN outfit_items oi ON w.id = oi.item_id
      WHERE oi.outfit_id = $1
    `, [id]);

    res.json({
      ...outfit,
      items: items.rows
    });
  } catch (err) {
    console.error('Ошибка снятия с публикации:', err);
    res.status(500).json({ error: 'Ошибка снятия с публикации' });
  }
});

app.get('/api/wardrobe', async (req, res) => {
  if (!req.session.username) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const user = await db.query('SELECT id FROM users WHERE username = $1', [req.session.username]);
    const items = await db.query('SELECT * FROM wardrobe WHERE user_id = $1', [user.rows[0].id]);
    res.json(items.rows);
  } catch (err) {
    console.error('Ошибка загрузки гардероба:', err);
    res.status(500).json({ error: 'Ошибка при загрузке гардероба' });
  }
});

app.delete('/api/wardrobe/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM wardrobe WHERE id = $1', [id]);
        res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления вещи:', err);
    res.status(500).json({ error: 'Не удалось удалить вещь' });
  }
});

app.get('/api/outfits', async (req, res) => {
  if (!req.session.username) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await db.query('SELECT id FROM users WHERE username = $1', [req.session.username]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const outfitsResult = await db.query(
      'SELECT * FROM outfits WHERE user_id = $1 ORDER BY id DESC',
      [user.rows[0].id]
    );

    const outfits = await Promise.all(
      outfitsResult.rows.map(async (outfit) => {
        const itemsResult = await db.query(
          `
          SELECT oi.item_id, w.name, w.image, w.color, w.category
          FROM outfit_items oi
          LEFT JOIN wardrobe w ON w.id = oi.item_id
          WHERE oi.outfit_id = $1
          `,
          [outfit.id]
        );
        return { ...outfit, items: itemsResult.rows };
      })
    );

    res.json(outfits);
  } catch (err) {
    console.error('GET /api/outfits error:', err);
    res.status(500).json({ error: 'Ошибка при загрузке образов' });
  }
});

app.delete('/api/outfits/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM outfits WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Ошибка удаления образа:', err);
    res.status(500).json({ error: 'Не удалось удалить образ' });
  }
});

app.get('/api/outfits/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM outfits WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Образ не найден' });
    }

    const outfit = result.rows[0];

    const itemsResult = await db.query(`
      SELECT w.id, w.name, w.category, w.color, w.image
      FROM outfit_items oi
      JOIN wardrobe w ON w.id = oi.item_id
      WHERE oi.outfit_id = $1
    `, [id]);

    outfit.items = itemsResult.rows;

    res.json(outfit);
  } catch (err) {
    console.error('Ошибка получения образа по id:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/outfits/:id', upload.single('cover'), async (req, res) => {
  const { id } = req.params;
  const { name, style, description } = req.body;
  let items;

  if (!req.session.username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    items = JSON.parse(req.body.items);
  } catch {
    return res.status(400).json({ error: 'Неверный формат items' });
  }

  try {
    const userResult = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [req.session.username]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });

    const outfitResult = await db.query(
      'SELECT * FROM outfits WHERE id = $1',
      [id]
    );
    const outfit = outfitResult.rows[0];
    if (!outfit) return res.status(404).json({ error: 'Outfit not found' });
    if (outfit.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

    let coverPath = outfit.cover;
    if (req.file) {
      coverPath = `/uploads/${req.file.filename}`;

      if (outfit.cover) {
        const oldPath = path.join(__dirname, outfit.cover);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    await db.query('BEGIN');

await db.query(
  `UPDATE outfits SET name = $1, style = $2, description = $3, cover = $4 WHERE id = $5`,
  [name, style, description, coverPath, id]
);

await db.query('DELETE FROM outfit_items WHERE outfit_id = $1', [id]);

for (const item of items) {
  await db.query(
    'INSERT INTO outfit_items (outfit_id, item_id) VALUES ($1, $2)',
    [id, item.id]
  );
}

const updatedOutfitResult = await db.query('SELECT * FROM outfits WHERE id = $1', [id]);
const updatedOutfit = updatedOutfitResult.rows[0];

const itemsResult = await db.query(`
  SELECT w.id, w.name, w.category, w.color, w.image
  FROM outfit_items oi
  JOIN wardrobe w ON w.id = oi.item_id
  WHERE oi.outfit_id = $1
`, [id]);

updatedOutfit.items = itemsResult.rows;

await db.query('COMMIT');
res.json(updatedOutfit);

  } catch (err) {
    await db.query('ROLLBACK');
    console.error('PUT /api/outfits/:id error:', err);
    res.status(500).json({ error: 'Не удалось обновить образ' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
