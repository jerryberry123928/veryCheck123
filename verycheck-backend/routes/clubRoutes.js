const express = require("express");
const router = express.Router();
const {
    createClub,
    getAllClubs,
    getClubById,
    addItemToClub
} = require("../controllers/clubController");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Public: list
router.get("/", getAllClubs);
router.get("/:clubId", getClubById);

// Admin only: create club
router.post("/create", auth, role("admin"), createClub);

// Add item to club: admin or club-member
router.post("/:clubId/addItem", auth, role(["admin", "club-member"]), addItemToClub);

module.exports = router;