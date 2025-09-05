const express = require("express");
const app = express();
const PORT = 8888;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "online", service: "collector" });
});

app.all("*", (req, res) => {
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Collector running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Error:', err.message);
});
