const express = require('express');
const cors = require('cors');
const app = express();
const { db } = require('./database.js');
const PORT = 4544;

app.use(cors());
app.use(express.json());
app.use(express.static('build'));

app.get('/api/presets', (req, res) => {
  db.query('SELECT * from Preset', (err, results) => {
    res.status(200).send(results);
  })
})

app.get('/api/preset/:presetid', (req, res) => {
  let presetid = Number(req.params.presetid);
  console.log(req.params);
  db.query('SELECT * from Preset WHERE presetid="?"', [presetid], (err, result) => {
    if (err) {
      console.log(err);
      res.status(400).send("Couldn't set preset")
    } else {
      console.log(result)
      res.status(200).send(result);
    }
  })
})

app.delete('/api/presets', (req, res) => {
  console.log(req.data);
  console.log(req.body.presetid);
  let toDelete = req.body.presetid;
  db.query('DELETE FROM Preset WHERE presetid="?"', [toDelete], (err, results) => {
    if (err) {
      console.log(err);
    } else {
      console.log(results);
      res.status(201).send("Preset has been deleted");
    }
  })
})

app.post('/api/presets', (req, res) => {
  // console.log(req.body);
  let presetName = req.body.presetName;
  let waveshape = req.body.waveshape;
  let timedelay = req.body.timedelay.toString();
  let dist = req.body.dist;
  let oversample = req.body.oversample;
  db.query('INSERT INTO Preset (presetName, waveshape, timedelay, dist, oversample) VALUES (?, ?, ?, ?, ?)', [presetName, waveshape, timedelay, dist, oversample], (err, results) => {
    if (err) {
      console.log(err);
    } else {
      console.log(results);
      res.status(201).send("Preset has been saved")
    }
  })
})

app.listen(4544, () => {
  console.log(`Listening on ${PORT}`);
});








