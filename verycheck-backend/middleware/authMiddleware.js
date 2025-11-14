// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "") || req.body.token || req.query.token;
        if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        if (!req.user) return res.status(401).json({ msg: "Token invalid: user not found" });

        next();
    } catch (err) {
        return res.status(401).json({ msg: "Token is not valid", error: err.message });
    }
};

module.exports = auth;