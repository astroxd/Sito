import express from "express";
import "dotenv/config";
import { ROUTES } from "./routes";
import { setupProxies } from "./routes";

const PORT = process.env.PORT || 3001;

const app = express();

setupProxies(app, ROUTES);

app.get("/hello", (req, res) => {
  return res.send("HELLO WORLD!");
});

app.listen(PORT, () => {
  console.log(`Api Gateway is running on port ${PORT}`);
});
