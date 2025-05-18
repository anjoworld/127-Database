const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite
const dbPath = path.resolve(__dirname, 'CarendaBase_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('DB connection error:', err.message);
  console.log('Connected to the SQLite database.');
});

// Routes
app.get('/', (req, res) => {
  res.send('Carinderia Inventory API is running!');
});

app.post('/ingredients', (req, res) => {
  const { IngredientName, IngredientType, Unit } = req.body;
  const query = `INSERT INTO Ingredients (IngredientName, IngredientType, Unit) VALUES (?, ?, ?)`;

  db.run(query, [IngredientName, IngredientType, Unit], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Ingredient added!', id: this.lastID });
  });
});

app.get('/ingredients', (req, res) => {
  db.all('SELECT * FROM Ingredients', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/ingredients-stocks', (req, res) => {
  const query = `SELECT IngredientID, OrderID, Quantity, Location FROM IngredientStock`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/orders', (req, res) => {
  db.all('SELECT * FROM Orders', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
