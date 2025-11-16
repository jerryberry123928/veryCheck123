const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({

    name: { type: String, required: true },
    description: { type: String },


    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        required: true
    },


    category: { type: String },
    condition: { type: String, enum: ["new", "good", "fair", "damaged"], default: "good" },
    purchaseDate: { type: Date },
    purchaseCost: { type: Number },


    status: { type: String, enum: ["available", "rented", "repair"], default: "available" },


    qrCode: { type: String, unique: true, default: null },


    currentHolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    rentedAt: { type: Date, default: null },
    expectedReturn: { type: Date, default: null },


    rentalHistory: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rentedAt: Date,
        returnedAt: Date,
        conditionReturned: { type: String, enum: ["good", "damaged"] },
    }],

}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);