const QRCode = require("qrcode");
const Item = require("../models/Item");

// Generate QR Code for an item
exports.generateQR = async (req, res) => {
    try {
        const itemId = req.params.itemId;

        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ msg: "Item not found" });

        const qrData = {
            itemId: item._id,
            name: item.name,
            club: item.club,
        };

        // Convert data to base64 PNG QR
        const qrImage = await QRCode.toDataURL(JSON.stringify(qrData));

        // Save QR to the DB
        item.qrCode = qrImage;
        await item.save();

        res.json({
            msg: "QR code generated",
            qrCode: qrImage
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Scan QR → return item info
exports.scanQR = async (req, res) => {
    try {
        const { qrData } = req.body;

        // qrData should be JSON with itemId
        const parsed = JSON.parse(qrData);

        const item = await Item.findById(parsed.itemId)
            .populate("club", "name")
            .populate("currentHolder", "name email");

        if (!item) return res.status(404).json({ msg: "Item not found" });

        res.json({
            msg: "QR Scan Success",
            item
        });

    } catch (err) {
        res.status(500).json({ error: "Invalid QR or server error" });
    }
};