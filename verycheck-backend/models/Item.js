const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    // Basic details
    name: { type: String, required: true },
    description: { type: String },

    // Which club owns it
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        required: true
    },

    // Physical attributes (AI friendly)
    category: { type: String },              // e.g., "sports", "electronics"
    condition: { type: String, enum: ["new", "good", "fair", "damaged"], default: "good" },
    purchaseDate: { type: Date },
    purchaseCost: { type: Number },

    // Inventory status
    status: { type: String, enum: ["available", "rented", "repair"], default: "available" },

    // QR code for scanning
    qrCode: { type: String, unique: true, default: null },

    // Rental tracking (current)
    currentHolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    rentedAt: { type: Date, default: null },
    expectedReturn: { type: Date, default: null },

    // History (perfect for AI pattern analysis)
    rentalHistory: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rentedAt: Date,
        returnedAt: Date,
        conditionReturned: { type: String, enum: ["good", "damaged"] },
    }],

}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);