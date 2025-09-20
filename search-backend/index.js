const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const firestore = new Firestore();

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// --- CORS Middleware ---
// This allows your frontend to call the backend from any domain.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// The system prompt for the AI model
const systemPrompt = `
You are Leap AI, an intelligent and empathetic personal career architect for Indian students. Your persona is encouraging and insightful. Your goal is to understand the user's interests through natural conversation and provide an actionable roadmap. Do not sound like a generic chatbot. Review the provided chat history to understand the context of the conversation.
`;

/**
 * The main logic, now inside an Express route handler.
 * This handles the chat request and response.
 */
const handleChatRequest = async (req, res) => {
    try {
        const userInput = req.body.message;
        let sessionId = req.body.sessionId;

        if (!userInput) {
            return res.status(400).json({ error: 'No message provided.' });
        }

        if (!sessionId) {
            sessionId = uuidv4();
        }

        // --- Step 1: Retrieve Chat History from Firestore ---
        const messagesRef = firestore.collection('sessions').doc(sessionId).collection('messages');
        const historySnapshot = await messagesRef.orderBy('timestamp', 'asc').limitToLast(4).get();
        const history = historySnapshot.docs.map(doc => ({
            role: doc.data().role,
            parts: [{ text: doc.data().text }],
        }));

        // --- Step 2: Call the Gemini API with History ---
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt,
        });
        
        const chat = model.startChat({ history: history });
        const result = await chat.sendMessage(userInput);
        const response = await result.response;
        const aiResponseText = response.text();

        // --- Step 3: Save New Messages to Firestore ---
        await messagesRef.add({
            role: 'user',
            text: userInput,
            timestamp: Firestore.FieldValue.serverTimestamp()
        });

        await messagesRef.add({
            role: 'model',
            text: aiResponseText,
            timestamp: Firestore.FieldValue.serverTimestamp()
        });

        // --- Step 4: Send the Response to the User ---
        res.status(200).json({
            reply: aiResponseText,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

// Define the main route for your chat application
app.post('/', handleChatRequest);

// --- START THE SERVER ---
// Cloud Run provides the PORT environment variable.
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Leap AI backend listening on port ${port}`);
});
