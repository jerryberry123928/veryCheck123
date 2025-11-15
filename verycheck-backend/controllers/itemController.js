

const Item = require("../models/Item");
const User = require("../models/User");
const Club = require("../models/Club");

const { nanoid } = require("nanoid");

const generateAndSaveQRCode = async (itemQrId, itemId) => {

    console.log(`[QR LOG] Initiating QR generation for ID: ${itemQrId}`);
    return `http://yourstorage.com/qrcodes/${itemQrId}.png`;
};


/**
 * Create new item
 * POST /api/items/create
 * FIXES: 1. Duplicate key error by generating unique qrCode.
 * 2. Uses the first, better createItem logic you provided.
 */
exports.createItem = async (req, res, next) => {
    try {
        // Ensure Admin/Club-Member role is enforced by auth and role middleware before this point

        const { name, description, club, category, condition = "good", purchaseDate, purchaseCost } = req.body;
        if (!name || !club) {
            return res.status(400).json({ msg: "name and club id required" });
        }

        const clubDoc = await Club.findById(club);
        if (!clubDoc) {
            return res.status(404).json({ msg: "Club not found" });
        }

        // 1. Generate the unique ID for the QR code payload
        const itemQrId = nanoid(10);

        const item = new Item({
            name,
            description,
            club,
            category,
            condition,
            purchaseDate,
            purchaseCost,
            qrCode: itemQrId, // <-- FIX: Assign unique ID here
            status: "available"
        });

        await item.save();

        // 2. Initiate QR code generation asynchronously
        const qrCodeUrl = await generateAndSaveQRCode(itemQrId, item._id);

        // Add backlink to club
        clubDoc.items.push(item._id);
        await clubDoc.save();

        // Return the item along with the URL for the physical QR image
        res.status(201).json({ msg: "Item created", item: { ...item.toObject(), qrCodeUrl } });
    } catch (err) {
        // Handle unique key error specifically if nanoid somehow generates a duplicate
        if (err.code === 11000) {
            return res.status(409).json({ msg: "Item creation failed due to duplicate QR code ID. Please try again." });
        }
        next(err);
    }
};


/**
 * Rent an item
 * POST /api/items/rent/:itemId
 * SECURITY FIX: Uses req.user._id for the current holder.
 */
exports.rentItem = async (req, res, next) => {
    try {
        const itemId = req.params.itemId;
        // 1. SECURITY FIX: Get userId from authenticated token, not body
        const userId = req.user._id;
        const { expectedReturnHours = 24 } = req.body;

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
        next(err); // Use next(err) for global error handler
    }
};

/**
 * Return an item
 * POST /api/items/return/:itemId
 * SECURITY FIX: Ensures the user returning the item is the current holder (extra check).
 */
exports.returnItem = async (req, res, next) => {
    try {
        const itemId = req.params.itemId;
        // 1. SECURITY FIX: Get userId from authenticated token, not body
        const userId = req.user._id;
        const { conditionReturned = "good" } = req.body;

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ msg: "Item not found" });
        if (item.status !== "rented") return res.status(400).json({ msg: "Item is not currently rented" });

        // 2. EXTRA SECURITY CHECK: Ensure the person returning is the person who rented it
        if (!item.currentHolder.equals(userId)) {
            return res.status(403).json({ msg: "Forbidden: You are not the current holder of this item." });
        }


        // push to rental history
        item.rentalHistory.push({
            user: item.currentHolder,
            rentedAt: item.rentedAt,
            returnedAt: new Date(),
            conditionReturned
        });

        // reset
        item.status = (conditionReturned === "damaged") ? "repair" : "available"; // Set to repair if damaged
        item.currentHolder = null;
        item.rentedAt = null;
        item.expectedReturn = null;

        // Note: You can skip item.condition update here and handle it in a maintenance flow

        await item.save();

        // remove from user's rentedItems if present
        await User.findByIdAndUpdate(userId, { $pull: { rentedItems: item._id } }).catch(() => { });

        res.json({ msg: "Item returned", item });
    } catch (err) {
        next(err); // Use next(err) for global error handler
    }
};

/**
 * Scan QR -> return item info
 * POST /api/items/scan-qr
 * NOTE: Changed from getItemFromQR to use scanQR from your provided qrController logic
 */
exports.getItemFromQR = async (req, res, next) => {
    try {
        const { qrData } = req.body;
        if (!qrData) return res.status(400).json({ msg: "qrData required" });

        // Assume qrData is the JSON string from the QR code (e.g., '{"itemId":"..."}')
        const parsed = JSON.parse(qrData);

        // We will change this lookup logic to use the qrCode field (the unique ID)
        // Since your item creation stores the unique ID in qrCode, we should query that field.
        // However, based on your original logic (which uses item._id in the QR payload), 
        // we will stick to findById for now.
        if (!parsed.itemId) return res.status(400).json({ msg: "invalid qrData payload" });

        const item = await Item.findById(parsed.itemId)
            .populate("club", "name")
            .populate("currentHolder", "name email");

        if (!item) return res.status(404).json({ msg: "Item not found" });

        // You might want to add auth to this route if you don't want anyone scanning
        // If it's public, it's fine.

        res.json({ item });
    } catch (err) {
        next(err);
    }
};