// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const { registerValidation } = require("../middleware/validators");
router.post("/register", registerValidation, registerUser);
router.post("/login", loginUser);

module.exports = router;