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

// this creates order, for the orders tab (same sa ingredients) but here maka-add ang user sa list of ingredients
app.post('/add-order', (req, res) => {
  const { DateReceived, SupplierName } = req.body;
  const query = 'INSERT INTO Orders (DateReceived, SupplierName) VALUES (?, ?)';
  db.run(query, [DateReceived, SupplierName], function(err) {
    if (err) return res.status(500).send(err.message);
    res.send(`Order added with ID: ${this.lastID}`);
  });
});

//follow-up request for adding ingredient to ingredientstock with the same orderID as the first user input
//since the user will input min and max for spoiling time, though there isn't any tab yet for that
app.post('/add-ingredients-to-ingredient-stock', (req, res) => {
  const {
    OrderID,
    IngredientID,
    Quantity,
    Unit,
    SpoilageMinDays,
    SpoilageMaxDays
  } = req.body;

  const stockQuery = `
    INSERT INTO IngredientStock (OrderID, IngredientID, Quantity, Unit)
    VALUES (?, ?, ?, ?)
  `;

  db.run(stockQuery, [OrderID, IngredientID, Quantity, Unit], function(err) {
    if (err) return res.status(500).send('Error inserting into IngredientStock: ' + err.message);

    const spoilageQuery = `
      INSERT INTO SpoilageInfo (OrderID, IngredientID, SpoilageMinDays, SpoilageMaxDays)
      VALUES (?, ?, ?, ?)
    `;

    db.run(spoilageQuery, [OrderID, IngredientID, SpoilageMinDays, SpoilageMaxDays], function(err2) {
      if (err2) return res.status(500).send('Error inserting into SpoilageInfo: ' + err2.message);
      res.send(`Ingredient and spoilage info added successfully.`);
    });
  });
});

//for getting the days-left sa dashboard page
app.get('/ingredients-with-daysleft', (req, res) => {
  const query = `
    SELECT
      i.IngredientID,
      i.IngredientName,
      i.IngredientType,
      s.OrderID,
      s.Quantity,
      s.Unit,
      o.DateReceived,
      sp.SpoilageMinDays,
      sp.SpoilageMaxDays,
      CAST(sp.SpoilageMaxDays - julianday('now') + julianday(o.DateReceived) AS INTEGER) AS DaysLeft 
    FROM IngredientStock s
    JOIN Ingredients i ON s.IngredientID = i.IngredientID
    JOIN Orders o ON s.OrderID = o.OrderID
    JOIN SpoilageInfo sp ON sp.IngredientID = s.IngredientID AND sp.OrderID = s.OrderID
  `; //julianday is for converting todays date to a numeric and then casting it as an integer

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).send('Error fetching ingredients with days left: ' + err.message);
    res.json(rows);
  });
});



//For the use button in the dashboard - when consuming ingredients - deducts quantity when ingredient is used
app.post('/use-ingredient', (req, res) => {
  const { OrderID, IngredientID, QuantityUsed } = req.body;

  const getQuery = `
    SELECT s.Quantity, i.IngredientName
    FROM IngredientStock s
    JOIN Ingredients i ON s.IngredientID = i.IngredientID
    WHERE s.OrderID = ? AND s.IngredientID = ?
  `;

  const updateQuery = `
    UPDATE IngredientStock
    SET Quantity = Quantity - ?
    WHERE OrderID = ? AND IngredientID = ?
  `;

  db.get(getQuery, [OrderID, IngredientID], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Stock not found' });

    if (row.Quantity < QuantityUsed) {
      return res.status(400).json({ error: 'Not enough quantity to use' });
    }

    db.run(updateQuery, [QuantityUsed, OrderID, IngredientID], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        message: `Ingredient '${row.IngredientName}' used successfully`,
        IngredientName: row.IngredientName,
        OrderID,
        QuantityUsed
      });
    });
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
