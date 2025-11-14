const Club = require("../models/Club");
const Item = require("../models/Item");

// Create a new club
exports.createClub = async (req, res) => {
    try {
        const { name, description } = req.body;

        const existing = await Club.findOne({ name });
        if (existing) {
            return res.status(400).json({ msg: "Club already exists" });
        }

        const club = await Club.create({ name, description });
        res.json({ msg: "Club created", club });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all clubs
exports.getAllClubs = async (req, res) => {
    try {
        const clubs = await Club.find().populate("items");
        res.json(clubs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get single club with items
exports.getClubById = async (req, res) => {
    try {
        const club = await Club.findById(req.params.clubId).populate("items");
        if (!club) return res.status(404).json({ msg: "Club not found" });

        res.json(club);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add an item to a club
exports.addItemToClub = async (req, res) => {
    try {
        const { clubId } = req.params;
        const {
            name,
            description,
            category,
            condition,
            qrCode
        } = req.body;

        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ msg: "Club not found" });

        // Create the item
        const newItem = await Item.create({
            name,
            description,
            club: clubId,
            category,
            condition,
            qrCode,
            status: "available"
        });

        // Add item to club list
        club.items.push(newItem._id);
        await club.save();

        res.json({ msg: "Item added to club", item: newItem });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
