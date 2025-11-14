const express = require("express");
const router = express.Router();
const {
    getUserProfile,
    updateUser,
    getAllUsers,
    getUserRentals
} = require("../controllers/userController");

router.get("/:userId", getUserProfile);
router.put("/:userId", updateUser);
router.get("/", getAllUsers);
router.get("/:userId/rentals", getUserRentals);

module.exports = router;