const express = require("express");
const router = express.Router();
const { generateQR, scanQR } = require("../controllers/qrController");

// Generate QR for an item
router.post("/generate/:itemId", generateQR);

// Scan QR
router.post("/scan", scanQR);

module.exports = router;