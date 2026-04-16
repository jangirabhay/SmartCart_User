require("dotenv").config(); 

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/user", require("./api/user"));

app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀", status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORTS = process.env.PORT || 8000;

app.listen(PORTS, () => {
  console.log("Server on booooom!");
});