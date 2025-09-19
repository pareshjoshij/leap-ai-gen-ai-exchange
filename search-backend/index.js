const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');
const { SearchServiceClient } = require('@google-cloud/discoveryengine').v1;

// --- CONFIGURATION ---
// Ensure this project ID matches the one you are deploying to.
const PROJECT_ID = 'leapaitest'; 
// Replace this with the Data Store ID you copied from the Vertex AI Search console.
const DATA_STORE_ID = 'career-articles_1758301775526'; 
const LOCATION = 'global'; // The location of your Data Store

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const firestore = new Firestore();
const discoveryClient = new SearchServiceClient();

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// --- CORS Middleware ---
// This is crucial for allowing your frontend to call this backend.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// The main logic, now inside an Express route handler
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

        // --- Step 1: Search for Grounded Context ---
        const searchRequest = {
            servingConfig: `projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection/dataStores/${DATA_STORE_ID}/servingConfigs/default_serving_config`,
            query: userInput,
            pageSize: 3,
            queryExpansionSpec: {
                condition: 'AUTO',
            },
            spellCorrectionSpec: {
                mode: 'AUTO',
            },
        };
        const [searchResponse] = await discoveryClient.search(searchRequest);
        const context = searchResponse.results
            .map(result => result.document.derivedStructData.snippets[0].snippet)
            .join('\n\n');

        // --- Step 2: Retrieve Chat History ---
        const messagesRef = firestore.collection('sessions').doc(sessionId).collection('messages');
        const historySnapshot = await messagesRef.orderBy('timestamp', 'asc').limitToLast(4).get();
        const history = historySnapshot.docs.map(doc => ({
            role: doc.data().role,
            parts: [{ text: doc.data().text }],
        }));

        // --- Step 3: Call Gemini with Grounded Prompt ---
        const systemPrompt = `You are Leap AI, an expert career architect. Based ONLY on the following context from our knowledge base, answer the user's question. If the context doesn't have the answer, say that you don't have enough information on that topic. Context: "${context}"`;
        
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt,
        });

        const chat = model.startChat({ history: history });
        const result = await chat.sendMessage(userInput);
        const response = await result.response;
        const aiResponseText = response.text();

        // --- Step 4: Save to Firestore ---
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

        // --- Step 5: Send Response ---
        res.status(200).json({
            reply: aiResponseText,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

// Define the route
app.post('/', handleChatRequest);

// --- START THE SERVER ---
// Cloud Run provides the PORT environment variable.
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Leap AI Search Backend listening on port ${port}`);
});

