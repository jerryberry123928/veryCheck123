// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res, next) => {
    try {
        const { name, email, password, regNo, role = "student", club = null } = req.body;
        if (!name || !email || !password || !regNo) return res.status(400).json({ msg: "name, email, regNo, password required" });

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        user = await User.create({ name, email, password: hashed, regNo, role, club: club || null });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ msg: "User registered", token, user: { id: user._id, name: user.name, email: user.email, role: user.role, club: user.club } });
    } catch (err) {
        next(err);
    }
};

exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ msg: "email and password required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ msg: "Login success", token, user: { id: user._id, name: user.name, email: user.email, role: user.role, club: user.club } });
    } catch (err) {
        next(err);
    }
};