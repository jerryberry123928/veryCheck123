// routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const {
    predictDemand,
    recommendItems,
    clubForecast
} = require("../controllers/aiController");

// TODO: protect with auth middleware if needed
router.post("/predict-demand", predictDemand);
router.post("/recommend", recommendItems);
router.post("/club-forecast", clubForecast);

module.exports = router;