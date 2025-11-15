// controllers/aiController.js

const Item = require("../models/Item");
const Club = require("../models/Club");
const User = require("../models/User");
// controllers/aiController.js
// ...
const { GoogleGenAI } = require("@google/genai");

// TEMPORARY DEBUG LINE:
console.log("DEBUG: Key Tail:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(-4) : "Key NOT LOADED");

// Initialize Gemini SDK 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// ...
// ...


// --- 1. Internal Tool Handlers (Functions the AI Model will call) ---

/**
 * Executes a MongoDB query to find items based on status, club, or condition.
 */
const findItemsByQuery = async ({ status, clubId, condition }) => {
    const query = {};
    if (status) query.status = status;
    if (clubId) query.club = clubId;
    if (condition) query.condition = condition;

    const items = await Item.find(query).limit(10).select("name status condition club");

    // Return structured data for the LLM to summarize
    return JSON.stringify(items.map(i => ({
        name: i.name,
        status: i.status,
        condition: i.condition
    })));
};

/**
 * Finds users who have items overdue.
 */
const findOverdueRentals = async () => {
    const overdueItems = await Item.find({
        status: "rented",
        expectedReturn: { $lt: new Date() }
    }).populate("currentHolder", "name email");

    // Return names and emails of holders for the LLM
    return JSON.stringify(overdueItems.map(item => ({
        itemName: item.name,
        holderName: item.currentHolder ? item.currentHolder.name : "Unknown",
        holderEmail: item.currentHolder ? item.currentHolder.email : "N/A",
        expectedReturn: item.expectedReturn
    })));
};

// Map tool names to the actual executable functions
const availableTools = {
    findItemsByQuery,
    findOverdueRentals
};


// --- 2. General Natural Language Query Endpoint ---

/**
 * POST /api/ai/query
 * The general natural language query endpoint using Gemini Tool Calling.
 * body: { userQuery }
 */
exports.generalQuery = async (req, res, next) => {
    try {
        const { userQuery } = req.body;
        if (!userQuery) return res.status(400).json({ msg: "userQuery required" });

        // Define the tool schemas for the LLM
        const toolDeclarations = [
            {
                name: "findItemsByQuery",
                description: "Retrieves inventory items based on their status (available, rented, repair), club ID, or physical condition.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        status: {
                            type: "STRING",
                            description: "The inventory status: 'available', 'rented', or 'repair'."
                        },
                        clubId: {
                            type: "STRING",
                            description: "The ID of the club that owns the item."
                        },
                        condition: {
                            type: "STRING",
                            description: "The physical condition: 'new', 'good', 'fair', or 'damaged'."
                        }
                    }
                }
            },
            {
                name: "findOverdueRentals",
                description: "Finds all items that are currently rented out past their expected return date.",
                parameters: { type: "OBJECT", properties: {} }
            }
        ];

        // 1. Send the user query and tool definitions to the model
        let response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userQuery,
            config: {
                tools: toolDeclarations,
                systemInstruction: "You are an intelligent inventory management assistant. Use the provided tools to fetch required data and provide concise, helpful answers about item status, condition, and rental status. Do not guess. If no tool is appropriate, answer directly based on general knowledge."
            }
        });

        // 2. Check for Tool Calling
        if (response.functionCalls && response.functionCalls.length > 0) {

            const call = response.functionCalls[0];
            const functionToCall = availableTools[call.name];

            if (!functionToCall) {
                return res.status(500).json({ answer: `AI requested unknown function: ${call.name}` });
            }

            // 3. Execute the function
            const toolOutput = await functionToCall(call.args);

            // 4. Send the tool's output back to the model for summarization
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    { role: "user", parts: [{ text: userQuery }] },
                    { role: "model", parts: [{ functionCall: call }] },
                    { role: "tool", parts: [{ functionResponse: { name: call.name, response: JSON.parse(toolOutput) } }] }
                ],
                config: { tools: toolDeclarations }
            });
        }

        // 5. Return the final text answer from the model
        res.json({ answer: response.text });

    } catch (err) {
        console.error("AI Controller Error:", err.message);
        res.status(500).json({ error: "Failed to process AI query. Check API key and network connection." });
    }
};


// --- 3. Existing Heuristic Endpoints ---

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

        const counts = Object.values(countsByMonth);

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