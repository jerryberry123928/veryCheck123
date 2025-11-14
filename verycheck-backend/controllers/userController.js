const User = require("../models/User");
const Item = require("../models/Item");

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate("club", "name description");

        if (!user) return res.status(404).json({ msg: "User not found" });

        res.json(user);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update user details
exports.updateUser = async (req, res) => {
    try {
        const updates = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.userId,
            updates,
            { new: true }
        );

        res.json({ msg: "User updated", user: updatedUser });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin: Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().populate("club", "name");
        res.json(users);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// User rental history
exports.getUserRentals = async (req, res) => {
    try {
        const userId = req.params.userId;

        const items = await Item.find({
            "rentalHistory.user": userId
        }).select("name rentalHistory");

        res.json(items);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};