import express from "express";
import "dotenv/config";

const PORT = process.env.PORT || 3002;

const app = express();

app.get("/", (req, res) => {
  console.log(req.headers);
  return res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`User Service is running on port ${PORT}`);
});
