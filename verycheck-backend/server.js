// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: "10mb" })); // allow qr base64 payloads

// connect to MongoDB
connectDB();

// health
app.get("/", (req, res) => res.send("Backend running successfully 🚀"));

// mount routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/clubs", require("./routes/clubRoutes"));
app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/qr", require("./routes/qrRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));