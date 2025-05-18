// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('API is running!');
});

// TODO: Add actual routes here
// app.use('/api/ingredients', require('./routes/ingredientsRoute'))

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
