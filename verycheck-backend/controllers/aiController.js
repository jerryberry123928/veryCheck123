// controllers/aiController.js
// Simple, swap-friendly AI endpoints (heuristics). Replace with real ML/LLM later.

const Item = require("../models/Item");
const Club = require("../models/Club");
const User = require("../models/User");

/**
 * POST /api/ai/predict-demand
 * body: { itemId, window }
 */
exports.predictDemand = async (req, res) => {
    try {
        const { itemId, window = 3 } = req.body;
        if (!itemId) return res.status(400).json({ msg: "itemId required" });

        const item = await Item.findById(itemId).select("rentalHistory");
        if (!item) return res.status(404).json({ msg: "Item not found" });

        // monthly counts
        const countsByMonth = {};
        item.rentalHistory.forEach(h => {
            const d = h.rentedAt || h.returnedAt;
            if (!d) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            countsByMonth[key] = (countsByMonth[key] || 0) + 1;
        });

        const months = Object.keys(countsByMonth).sort();
        const counts = months.map(m => countsByMonth[m]);

        let predicted = 0;
        if (counts.length === 0) predicted = 0;
        else {
            const slice = counts.slice(-window);
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
            predicted = Number(avg.toFixed(2));
        }

        res.json({ itemId, predictedNextMonthRent: predicted, countsByMonth });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/ai/recommend
 * body: { mode: 'byClub'|'coRent', clubId?, itemId?, limit? }
 */
exports.recommendItems = async (req, res) => {
    try {
        const { itemId, clubId, mode = "byClub", limit = 5 } = req.body;

        if (mode === "byClub") {
            if (!clubId) return res.status(400).json({ msg: "clubId required for byClub mode" });
            const items = await Item.find({ club: clubId }).select("name rentalHistory status");
            const ranked = items
                .map(it => ({ id: it._id, name: it.name, rentals: it.rentalHistory.length, status: it.status }))
                .sort((a, b) => b.rentals - a.rentals)
                .slice(0, limit);
            return res.json({ mode, recommendations: ranked });
        }

        if (!itemId) return res.status(400).json({ msg: "itemId required for coRent mode" });

        const item = await Item.findById(itemId).select("rentalHistory");
        if (!item) return res.status(404).json({ msg: "Item not found" });

        const userSet = new Set(item.rentalHistory.map(h => h.user && h.user.toString()).filter(Boolean));
        const userIds = [...userSet];
        if (userIds.length === 0) return res.json({ recommendations: [] });

        const candidateItems = await Item.find({
            "rentalHistory.user": { $in: userIds },
            _id: { $ne: itemId }
        }).select("name rentalHistory club status");

        const scores = {};
        candidateItems.forEach(ci => {
            const renters = new Set(ci.rentalHistory.map(r => r.user && r.user.toString()).filter(Boolean));
            let score = 0;
            userIds.forEach(uid => { if (renters.has(uid)) score++; });
            scores[ci._id] = { id: ci._id, name: ci.name, score, club: ci.club, status: ci.status };
        });

        const ranked = Object.values(scores).sort((a, b) => b.score - a.score).slice(0, limit);
        res.json({ mode, recommendations: ranked });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/ai/club-forecast
 * body: { clubId, threshold }
 */
exports.clubForecast = async (req, res) => {
    try {
        const { clubId, threshold = 1 } = req.body;
        if (!clubId) return res.status(400).json({ msg: "clubId required" });

        const items = await Item.find({ club: clubId }).select("name status rentalHistory");

        const since = new Date();
        since.setMonth(since.getMonth() - 1);

        const highDemand = items.filter(it => {
            const recent = it.rentalHistory.filter(h => (h.rentedAt && h.rentedAt >= since)).length;
            return recent >= threshold;
        }).map(it => ({ id: it._id, name: it.name, recentRentals: it.rentalHistory.filter(h => h.rentedAt && h.rentedAt >= since).length, status: it.status }));

        res.json({ clubId, highDemand, checkedItems: items.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};