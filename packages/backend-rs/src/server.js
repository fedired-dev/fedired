// server.js (backend)

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.get('/api/verified-users', (req, res) => {
  const verifiedFilePath = path.join(__dirname, '../../../.config', 'verified.txt');

  fs.readFile(verifiedFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo leer el archivo.' });
    }
    const verifiedUsers = data.split('\n').map(user => user.trim());
    res.json({ verifiedUsers });
  });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
