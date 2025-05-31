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

// app.post('/ingredients', (req, res) => {
//   const { IngredientName, IngredientType, Unit } = req.body;
//   console.log('Received:', IngredientName, IngredientType, Unit);

//   if (!IngredientName || !IngredientType || !Unit) {
//     return res.status(400).json({ error: 'Please provide IngredientName, IngredientType, and Unit.' });
//   }

//   const query = `INSERT INTO Ingredients (IngredientName, IngredientType, Unit) VALUES (?, ?, ?)`;

//   db.run(query, [IngredientName, IngredientType, Unit], function (err) {
//     if (err) {
//       console.error('Insert error:', err.message);
//       return res.status(500).json({ error: err.message });
//     }
//     res.status(201).json({ message: 'Ingredient added!', id: this.lastID });
//   });
// });


app.get('/orders', (req, res) => {
  db.all('SELECT * FROM Orders', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create a new order
app.post('/orders', (req, res) => {
  const { SupplierName } = req.body;

  if (!SupplierName) {
    return res.status(400).json({ error: 'SupplierName is required' });
  }

  const insertQuery = 'INSERT INTO Orders (SupplierName) VALUES (?)';

  db.run(insertQuery, [SupplierName], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // `this.lastID` gives the ID of the inserted row
    res.status(201).json({ orderId: this.lastID });
  });
});

// Get all supplier names (or filter by query)
app.get('/suppliers', (req, res) => {
  const search = req.query.search || "";
  const query = `SELECT DISTINCT SupplierName FROM Orders WHERE SupplierName LIKE ? LIMIT 10`;
  db.all(query, [`%${search}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.SupplierName));
  });
});

//View Orders page
app.get('/order-items/:orderId', (req, res) => {
  const orderId = req.params.orderId;

  const query = `
    SELECT
      ing.IngredientName,
      i.Quantity,
      ing.Unit,
      i.IngredientID as id,
      ing.IngredientType,
      s.SpoilageMinDays as spoilageMin,
      s.SpoilageMaxDays as spoilageMax,
      i.OrderID
    FROM IngredientStock i
    LEFT JOIN SpoilageInfo s ON i.OrderID = s.OrderID AND i.IngredientID = s.IngredientID
    JOIN Ingredients ing ON i.IngredientID = ing.IngredientID
    WHERE i.OrderID = ?
  `;

  db.all(query, [orderId], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
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
