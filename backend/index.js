const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid'); // Library to create unique IDs

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const firestore = new Firestore();

const systemPrompt = `
You are Leap AI, an intelligent and empathetic personal career architect for Indian students. Your persona is encouraging and insightful. Your goal is to understand the user's interests through natural conversation and provide an actionable roadmap. Do not sound like a generic chatbot. Review the provided chat history to understand the context of the conversation.
`;

/**
 * The main cloud function to handle chat requests with session memory.
 * @param {express.Request} req The request object.
 * @param {express.Response} res The response object.
 */
exports.handler = async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const userInput = req.body.message;
    let sessionId = req.body.sessionId;

    if (!userInput) {
      return res.status(400).json({ error: 'No message provided.' });
    }

    // If no session ID is provided, create a new one.
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
    const userMessageDoc = messagesRef.doc();
    await userMessageDoc.set({
      role: 'user',
      text: userInput,
      timestamp: Firestore.FieldValue.serverTimestamp()
    });

    const modelMessageDoc = messagesRef.doc();
    await modelMessageDoc.set({
      role: 'model',
      text: aiResponseText,
      timestamp: Firestore.FieldValue.serverTimestamp()
    });

    // --- Step 4: Send the Response to the User ---
    res.status(200).json({
      reply: aiResponseText,
      sessionId: sessionId // Send the session ID back to the client
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};