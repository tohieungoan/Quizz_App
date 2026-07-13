const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend service is running smoothly' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to QuizzApp API' });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
