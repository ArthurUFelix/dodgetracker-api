const express = require('express');
const app = express();
const port = 3333;

app.get('/', (req, res) => {
  res.send({ idx: "32" })
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
