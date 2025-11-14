const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    regNo: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },

    // new fields
    role: {
        type: String,
        enum: ["student", "club-member", "admin"],
        default: "student"
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Club",
        default: null
    },

    password: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);