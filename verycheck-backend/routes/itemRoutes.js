const express = require("express");
const router = express.Router();
const {
    createItem,
    rentItem,
    returnItem,
    getItemFromQR
} = require("../controllers/itemController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// item creation: admin or club-member
router.post("/create", auth, role(["admin", "club-member"]), createItem);

// rent/return require auth (student or club-member)
router.post("/rent/:itemId", auth, rentItem);
router.post("/return/:itemId", auth, returnItem);

// QR scan route (public)
router.post("/scan-qr", getItemFromQR);

module.exports = router;