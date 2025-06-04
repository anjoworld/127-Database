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
}); //done

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

app.post('/orders', (req, res) => {
  const { SupplierName, DateReceived } = req.body;
  if (!SupplierName) {
    return res.status(400).json({ error: 'SupplierName is required' });
  }
  const insertQuery = 'INSERT INTO Orders (SupplierName, DateReceived) VALUES (?, ?)';
  db.run(insertQuery, [SupplierName, DateReceived], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ orderId: this.lastID });
  });
}); //done


// Add items to an order 
app.post('/order-items/:OrderID', (req, res) => {
  const OrderID = req.params.OrderID;
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Items array required" });
  }

  let completed = 0;
  let hasError = false;

  items.forEach(item => {
    // Insert into IngredientStock
    db.run(
      `INSERT INTO IngredientStock (OrderID, IngredientID, CurrentQuantity) VALUES (?, ?, ?)`,
      [OrderID, item.id, item.quantity],
      function (err) {
        if (err && !hasError) {
          hasError = true;
          return res.status(500).json({ error: err.message });
        }
        // Insert into OrderInfo
        db.run(
          `INSERT INTO OrderInfo (OrderID, IngredientID, SpoilageMinDays, SpoilageMaxDays) VALUES (?, ?, ?, ?)`,
          [OrderID, item.id, item.spoilageMin, item.spoilageMax],
          function (err2) {
            completed++;
            if (err2 && !hasError) {
              hasError = true;
              return res.status(500).json({ error: err2.message });
            }
            if (completed === items.length && !hasError) {
              res.json({ message: "Order items added" });
            }
          }
        );
      }
    );
  });

  if (items.length === 0) res.json({ message: "No items to add" });
}); //done





// Get all supplier names (or filter by query)
app.get('/suppliers', (req, res) => {
  const search = req.query.search || "";
  const query = `SELECT DISTINCT SupplierName FROM Orders WHERE SupplierName LIKE ? LIMIT 10`;
  db.all(query, [`%${search}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.SupplierName));
  });
});

//View Orders page - Get Order Items for an Order
app.get('/order-items/:OrderID', (req, res) => {
  const OrderID = req.params.OrderID;
  const query = `
    SELECT
      ing.IngredientName,
      s.CurrentQuantity AS Quantity,
      ing.Unit,
      s.IngredientID as id,
      ing.IngredientType,
      o.SpoilageMinDays as spoilageMin,
      o.SpoilageMaxDays as spoilageMax,
      s.OrderID
    FROM IngredientStock s
    LEFT JOIN OrderInfo o ON s.OrderID = o.OrderID AND s.IngredientID = o.IngredientID
    JOIN Ingredients ing ON s.IngredientID = ing.IngredientID
    WHERE s.OrderID = ?
  `;
  db.all(query, [OrderID], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
}); //Done

//follow-up request for adding ingredient to ingredientstock with the same orderID as the first user input
//since the user will input min and max for spoiling time, though there isn't any tab yet for that
app.post('/add-ingredients-to-ingredient-stock', (req, res) => {
  const {
    OrderID,
    IngredientID,
    CurrentQuantity,
    Unit,
    SpoilageMinDays,
    SpoilageMaxDays
  } = req.body;

  const stockQuery = `
    INSERT INTO IngredientStock (OrderID, IngredientID, CurrentQuantity)
    VALUES (?, ?, ?)`;

  db.run(stockQuery, [OrderID, IngredientID, CurrentQuantity, Unit], function(err) {
    if (err) return res.status(500).send('Error inserting into IngredientStock: ' + err.message);

  const spoilageQuery = `
    INSERT INTO OrderInfo (OrderID, IngredientID, SpoilageMinDays, SpoilageMaxDays)
    VALUES (?, ?, ?, ?)`;

  db.run(spoilageQuery, [OrderID, IngredientID, SpoilageMinDays, SpoilageMaxDays], function(err2) {
    if (err2) return res.status(500).send('Error inserting into SpoilageInfo: ' + err2.message);
    res.send(`Ingredient and spoilage info added successfully.`);

  const IngredientQuery = `
    INSERT INTO Ingredients (IngredientID, IngredientName, IngredientType, Unit)
    VALUES (?, ?, ?, ?)`;

    db.run(IngredientQuery, [IngredientID, req.body.IngredientName, req.body.IngredientType, Unit], function(err3) {
      if (err3) return res.status(500).send('Error inserting into Ingredients: ' + err3.message);
      res.send(`Ingredient added successfully.`);
    });
  });
  });
}); // DONE

//for getting the days-left sa dashboard page
app.get('/ingredients-with-daysleft', (req, res) => {
  const query = `
    SELECT
      i.IngredientID,
      i.IngredientName,
      i.IngredientType,
      i.Unit,
      s.OrderID,
      s.CurrentQuantity,
      date(o.DateReceived) AS DateReceived,
      oi.SpoilageMinDays,
      oi.SpoilageMaxDays,
      date(julianday(o.DateReceived) + oi.SpoilageMaxDays) AS ExpiryDate,
      CAST(oi.SpoilageMaxDays - julianday('now') + julianday(o.DateReceived) AS INTEGER) AS DaysLeft 
    FROM IngredientStock s
    JOIN Ingredients i ON s.IngredientID = i.IngredientID
    JOIN Orders o ON s.OrderID = o.OrderID
    JOIN OrderInfo oi ON oi.IngredientID = s.IngredientID AND oi.OrderID = s.OrderID
    WHERE s.CurrentQuantity > 0
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).send('Error fetching ingredients with days left: ' + err.message);
    res.json(rows);
  });
}); //Done

//For the use button in the dashboard - when consuming ingredients - deducts quantity when ingredient is used
app.post('/use-ingredient', (req, res) => {
  const { OrderID, IngredientID, QuantityUsed } = req.body;

  const getQuery = `
    SELECT s.CurrentQuantity, i.IngredientName
    FROM IngredientStock s
    JOIN Ingredients i ON s.IngredientID = i.IngredientID
    WHERE s.OrderID = ? AND s.IngredientID = ?
  `;

  const updateQuery = `
    UPDATE IngredientStock
    SET CurrentQuantity = CurrentQuantity - ?
    WHERE OrderID = ? AND IngredientID = ?
  `;

  db.get(getQuery, [OrderID, IngredientID], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Stock not found' });

    if (row.CurrentQuantity < QuantityUsed) {
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
}); //Done

//get all ingredient types and saturate the filters
app.get('/ingredient-types', (req, res) => {
  const query = `SELECT DISTINCT IngredientType 
  FROM Ingredients 
  JOIN IngredientStock ON Ingredients.IngredientID = IngredientStock.IngredientID 
  WHERE IngredientStock.CurrentQuantity > 0`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.IngredientType));
  });
}); // Done

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
