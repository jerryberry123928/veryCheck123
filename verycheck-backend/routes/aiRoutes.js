// routes/aiRoutes.js

const express = require("express");
const router = express.Router();
const {
    predictDemand,
    recommendItems,
    clubForecast,
    generalQuery  // <-- Import the new function
} = require("../controllers/aiController");
const auth = require("../middleware/auth");

// --- General Purpose AI Query (The Chatbot) ---
// This is the core endpoint your frontend will use.
router.post("/query", auth, generalQuery);

// --- Heuristic AI Endpoints ---
router.post("/predict-demand", auth, predictDemand);
router.post("/recommend", auth, recommendItems);
router.post("/club-forecast", auth, clubForecast);

module.exports = router;