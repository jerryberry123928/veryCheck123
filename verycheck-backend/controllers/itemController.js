// controllers/itemController.js
const Item = require("../models/Item");
const Club = require("../models/Club");
const QRCode = require("qrcode");

/**
 * POST /api/items/create
 * Create a new item
 * Requires: auth, role: ["admin", "club-member"]
 */
exports.createItem = async (req, res, next) => {
    try {
        const { name, description, category, condition, purchaseCost, purchaseDate, club } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ msg: "Item name is required" });
        }

        // Determine which club to use
        let clubId = club;

        // If no club provided in body, use user's club
        if (!clubId && req.user.club) {
            clubId = req.user.club;
        }

        // Validate club exists
        if (!clubId) {
            return res.status(400).json({
                msg: "Club information is required. Please contact admin to assign you to a club."
            });
        }

        // Verify club exists in database
        const clubExists = await Club.findById(clubId);
        if (!clubExists) {
            return res.status(404).json({ msg: "Club not found" });
        }

        // Create item
        const item = await Item.create({
            name,
            description: description || "",
            category: category || "",
            condition: condition || "good",
            purchaseCost: purchaseCost || 0,
            purchaseDate: purchaseDate || new Date(),
            club: clubId,
            status: "available",
        });

        // Add item to club's items array
        await Club.findByIdAndUpdate(clubId, {
            $push: { items: item._id }
        });

        res.status(201).json({
            msg: "Item created successfully",
            item: {
                id: item._id,
                name: item.name,
                description: item.description,
                category: item.category,
                condition: item.condition,
                status: item.status,
                club: item.club,
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/items/rent/:itemId
 * Rent an item
 * Requires: auth
 */
exports.rentItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { expectedReturn } = req.body;

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ msg: "Item not found" });
        }

        if (item.status !== "available") {
            return res.status(400).json({
                msg: `Item is currently ${item.status}. Cannot rent at this time.`
            });
        }

        // Calculate expected return (default 7 days from now)
        const returnDate = expectedReturn
            ? new Date(expectedReturn)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Update item status
        item.status = "rented";
        item.currentHolder = req.user._id;
        item.rentedAt = new Date();
        item.expectedReturn = returnDate;

        // Add to rental history
        item.rentalHistory.push({
            user: req.user._id,
            rentedAt: new Date(),
        });

        await item.save();

        res.json({
            msg: "Item rented successfully",
            item: {
                id: item._id,
                name: item.name,
                status: item.status,
                rentedAt: item.rentedAt,
                expectedReturn: item.expectedReturn,
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/items/return/:itemId
 * Return a rented item
 * Requires: auth
 */
exports.returnItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { conditionReturned } = req.body;

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ msg: "Item not found" });
        }

        if (item.status !== "rented") {
            return res.status(400).json({ msg: "Item is not currently rented" });
        }

        // Verify the person returning is the current holder
        if (item.currentHolder.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                msg: "Only the current holder can return this item"
            });
        }

        // Update the last rental history entry
        const lastRental = item.rentalHistory[item.rentalHistory.length - 1];
        if (lastRental) {
            lastRental.returnedAt = new Date();
            lastRental.conditionReturned = conditionReturned || "good";
        }

        // Update item status
        item.status = "available";
        item.currentHolder = null;
        item.rentedAt = null;
        item.expectedReturn = null;

        // Update item condition if it was damaged
        if (conditionReturned && conditionReturned === "damaged") {
            item.condition = "damaged";
            item.status = "repair";
        }

        await item.save();

        res.json({
            msg: "Item returned successfully",
            item: {
                id: item._id,
                name: item.name,
                status: item.status,
                condition: item.condition,
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/items/scan-qr
 * Get item details from QR code
 * Public route
 */
exports.getItemFromQR = async (req, res, next) => {
    try {
        const { qrCode } = req.body;

        if (!qrCode) {
            return res.status(400).json({ msg: "QR code data is required" });
        }

        const item = await Item.findOne({ qrCode })
            .populate("club", "name description")
            .populate("currentHolder", "name email regNo");

        if (!item) {
            return res.status(404).json({ msg: "Item not found for this QR code" });
        }

        res.json({
            msg: "Item found",
            item: {
                id: item._id,
                name: item.name,
                description: item.description,
                category: item.category,
                condition: item.condition,
                status: item.status,
                club: item.club,
                currentHolder: item.currentHolder,
                rentedAt: item.rentedAt,
                expectedReturn: item.expectedReturn,
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/items
 * Get all items (optional: filter by club, status)
 * Requires: auth
 */
exports.getAllItems = async (req, res, next) => {
    try {
        const { club, status } = req.query;

        const filter = {};
        if (club) filter.club = club;
        if (status) filter.status = status;

        const items = await Item.find(filter)
            .populate("club", "name")
            .populate("currentHolder", "name email");

        res.json({
            count: items.length,
            items
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/items/:itemId
 * Get single item details
 * Requires: auth
 */
exports.getItemById = async (req, res, next) => {
    try {
        const { itemId } = req.params;

        const item = await Item.findById(itemId)
            .populate("club", "name description")
            .populate("currentHolder", "name email regNo")
            .populate("rentalHistory.user", "name email");

        if (!item) {
            return res.status(404).json({ msg: "Item not found" });
        }

        res.json({ item });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/items/:itemId
 * Update item details
 * Requires: auth, role: ["admin", "club-member"]
 */
exports.updateItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { name, description, category, condition, status } = req.body;

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ msg: "Item not found" });
        }

        // If club-member, verify they belong to the item's club
        if (req.user.role === "club-member") {
            if (item.club.toString() !== req.user.club.toString()) {
                return res.status(403).json({
                    msg: "You can only update items from your club"
                });
            }
        }

        // Update fields
        if (name) item.name = name;
        if (description) item.description = description;
        if (category) item.category = category;
        if (condition) item.condition = condition;
        if (status) item.status = status;

        await item.save();

        res.json({
            msg: "Item updated successfully",
            item
        });
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/items/:itemId
 * Delete an item
 * Requires: auth, role: ["admin"]
 */
exports.deleteItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({ msg: "Item not found" });
        }

        // Remove item from club's items array
        await Club.findByIdAndUpdate(item.club, {
            $pull: { items: item._id }
        });

        await Item.findByIdAndDelete(itemId);

        res.json({ msg: "Item deleted successfully" });
    } catch (err) {
        next(err);
    }
};