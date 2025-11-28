// server/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ----------------------
// Middleware
// ----------------------
app.use(cors());
app.use(express.json());

// ----------------------
// MongoDB connection
// ----------------------
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGO_URI environment variable!");
} 
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ----------------------
// Schema & Model
// ----------------------
const messageSchema = new mongoose.Schema({
  user: { type: String, default: "" },      // user message text
  bot: { type: String, default: "" },       // assistant reply text
  metadata: { type: Object, default: {} },  // optional (attachments, user id, etc)
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// ----------------------
// Health
// ----------------------
app.get("/", (req, res) => {
  res.send("Chatbot Nexus backend is running.");
});

// ----------------------
// Save both user + bot message
// frontend should POST { user: "...", bot: "...", metadata?: {...} }
// ----------------------
app.post("/save-chat", async (req, res) => {
  try {
    const { user, bot, metadata } = req.body;

    if (!user || !bot) {
      return res.status(400).json({ error: "Both user and bot fields are required" });
    }

    const entry = new Message({ user, bot, metadata });
    await entry.save();

    return res.status(200).json({ success: true, id: entry._id });
  } catch (err) {
    console.error("POST /save-chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------------
// (Optional) Save a single message record
// Accepts { role: "user"|"assistant", content: "...", metadata?: {} }
// Helpful for compatibility with previous frontend formats.
// ----------------------
app.post("/messages", async (req, res) => {
  try {
    const { role, content, metadata } = req.body;
    if (!role || !content) return res.status(400).json({ error: "role and content required" });

    const doc =
      role === "assistant"
        ? { user: "", bot: content, metadata }
        : { user: content, bot: "", metadata };

    const entry = new Message(doc);
    await entry.save();
    return res.status(201).json(entry);
  } catch (err) {
    console.error("POST /messages error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ----------------------
// Get history (latest first or full list)
// GET /history?limit=100
// ----------------------
app.get("/history", async (req, res) => {
  try {
    const limit = Math.min(1000, Number(req.query.limit || 100));
    const history = await Message.find().sort({ timestamp: 1 }).limit(limit).lean();
    return res.status(200).json(history);
  } catch (err) {
    console.error("GET /history error:", err);
    return res.status(500).json({ error: "Could not load history" });
  }
});

// ----------------------
// Clear history (dangerous — for demo/reset only)
// DELETE /history
// ----------------------
app.delete("/history", async (req, res) => {
  try {
    await Message.deleteMany({});
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("DELETE /history error:", err);
    return res.status(500).json({ error: "Failed to clear history" });
  }
});

// ----------------------
// Start server
// ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
