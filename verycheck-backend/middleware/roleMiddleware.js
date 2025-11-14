// middleware/roleMiddleware.js
const role = (roles) => {
    return (req, res, next) => {
        // req.user is set by authMiddleware.js
        if (!req.user || !req.user.role) {
            return res.status(403).json({ msg: "Access denied. Role information missing." });
        }

        // Check if the user's role is included in the allowed roles array
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: "Access denied. You do not have the required role." });
        }

        next();
    };
};

module.exports = role;