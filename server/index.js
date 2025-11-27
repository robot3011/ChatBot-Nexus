const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// allow frontend to send data
app.use(cors());
app.use(express.json());

// --------------------------
// MONGODB CONNECTION
// --------------------------
mongoose.connect(
    "mongodb+srv://Robot3011:Parthik3011%40@chatbot.jpluhqr.mongodb.net/ChatBotDB?retryWrites=true&w=majority&appName=ChatBot"
)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));

// --------------------------
// MESSAGE SCHEMA
// --------------------------
const messageSchema = new mongoose.Schema({
    user: String,
    bot: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// --------------------------
// API ROUTE: SAVE MESSAGE
// --------------------------
app.post("/save-message", async (req, res) => {
    try {
        const { user, bot } = req.body;

        const newMessage = new Message({ user, bot });
        await newMessage.save();

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error });
    }
});

// --------------------------
// START SERVER
// --------------------------
app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
