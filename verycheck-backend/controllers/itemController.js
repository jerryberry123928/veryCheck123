// controllers/itemController.js
const Item = require("../models/Item");
const User = require("../models/User");
// inside controllers/itemController.js (replace existing createItem)
const Club = require("../models/Club");

exports.createItem = async (req, res, next) => {
    try {
        const { name, description, club, category, condition = "good", purchaseDate, purchaseCost } = req.body;
        if (!name || !club) return res.status(400).json({ msg: "name and club id required" });

        const clubDoc = await Club.findById(club);
        if (!clubDoc) return res.status(404).json({ msg: "Club not found" });

        const item = new Item({
            name, description, club, category, condition, purchaseDate, purchaseCost, qrCode: null, qrCodeData: null
        });

        await item.save();

        // add backlink to club
        clubDoc.items.push(item._id);
        await clubDoc.save();

        res.status(201).json({ msg: "Item created", item });
    } catch (err) {
        next(err);
    }
};

/**
 * Create new item
 * POST /api/items/create
 * body: item fields (name, description, club (ObjectId), category, etc.)
 */
exports.createItem = async (req, res) => {
    try {
        const itemData = req.body;

        // create item without qr (qr can be generated later via QR route)
        const item = new Item({
            ...itemData,
            // ensure qrCode default is null if you set that in schema
            qrCode: itemData.qrCode || null
        });

        await item.save();

        // Optionally push item to club.items if you want immediate backlink
        // (requires clubController to handle pushing; skip here for now)

        res.json({ msg: "Item created", item });
    } catch (err) {
        // Handle mongoose validation nicely
        if (err.name === "ValidationError") {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
};

/**
 * Rent an item
 * POST /api/items/rent/:itemId
 * body: { userId, expectedReturnHours }
 */
exports.rentItem = async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const { userId, expectedReturnHours = 24 } = req.body;
        if (!userId) return res.status(400).json({ msg: "userId required" });

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ msg: "Item not found" });
        if (item.status !== "available") return res.status(400).json({ msg: "Item not available" });

        item.status = "rented";
        item.currentHolder = userId;
        item.rentedAt = new Date();
        item.expectedReturn = new Date(Date.now() + expectedReturnHours * 60 * 60 * 1000);

        await item.save();

        // best-effort update user rentedItems array
        await User.findByIdAndUpdate(userId, { $addToSet: { rentedItems: item._id } }).catch(() => { });

        res.json({ msg: "Item rented", item });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Return an item
 * POST /api/items/return/:itemId
 * body: { userId, conditionReturned }
 */
exports.returnItem = async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const { userId, conditionReturned = "good" } = req.body;
        if (!userId) return res.status(400).json({ msg: "userId required" });

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ msg: "Item not found" });
        if (item.status !== "rented") return res.status(400).json({ msg: "Item is not currently rented" });

        // push to rental history
        item.rentalHistory.push({
            user: item.currentHolder,
            rentedAt: item.rentedAt,
            returnedAt: new Date(),
            conditionReturned
        });

        // reset
        item.status = "available";
        item.currentHolder = null;
        item.rentedAt = null;
        item.expectedReturn = null;

        if (conditionReturned === "damaged") item.condition = "damaged";

        await item.save();

        // remove from user's rentedItems if present
        await User.findByIdAndUpdate(userId, { $pull: { rentedItems: item._id } }).catch(() => { });

        res.json({ msg: "Item returned", item });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/items/scan-qr
 * body: { qrData }  // JSON string scanned from QR code
 */
exports.getItemFromQR = async (req, res) => {
    try {
        const { qrData } = req.body;
        if (!qrData) return res.status(400).json({ msg: "qrData required" });

        const parsed = JSON.parse(qrData);
        if (!parsed.itemId) return res.status(400).json({ msg: "invalid qrData" });

        const item = await Item.findById(parsed.itemId).populate("club", "name").populate("currentHolder", "name email");
        if (!item) return res.status(404).json({ msg: "Item not found" });

        res.json({ item });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};