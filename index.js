require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect DB before every request (safe for serverless)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use("/user", require("./api/user"));
app.use("/post", require("./api/request"));

app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀", status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
