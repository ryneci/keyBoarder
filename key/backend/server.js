const express = require('express');
const cors = require('cors');
const app = express();
const { db } = require('./database.js');
const PORT = 4544;

app.use(cors());
app.use(express.static('build'));


app.listen(4544, () => {
  console.log(`Listening on ${PORT}`);
});