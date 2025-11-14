const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },

    // items inside this club (auto-filled)
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    }],
}, { timestamps: true });

module.exports = mongoose.model("Club", clubSchema);