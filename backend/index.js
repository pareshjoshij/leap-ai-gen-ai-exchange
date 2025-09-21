const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const firestore = new Firestore();

const systemPrompt = `You are Leap AI...`; // Your full prompt here

exports.handler = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  // **Handle GET requests for fetching history**
  if (req.method === 'GET') {
    try {
      const sessionId = req.query.sessionId;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required.' });
      }

      const messagesRef = firestore.collection('sessions').doc(sessionId).collection('messages');
      const snapshot = await messagesRef.orderBy('timestamp', 'asc').get();
      
      const messages = snapshot.docs.map(doc => doc.data());
      return res.status(200).json({ messages });

    } catch (error) {
      console.error('Error fetching history:', error);
      return res.status(500).json({ error: 'Could not fetch chat history.' });
    }
  }

  // **Handle POST requests for sending messages (your existing logic)**
  if (req.method === 'POST') {
    try {
        const userInput = req.body.message;
        let sessionId = req.body.sessionId || uuidv4();

        // (The rest of your POST logic goes here...)
        const messagesRef = firestore.collection('sessions').doc(sessionId).collection('messages');
        const historySnapshot = await messagesRef.orderBy('timestamp', 'asc').limitToLast(4).get();
        const history = historySnapshot.docs.map(doc => ({
          role: doc.data().role,
          parts: [{ text: doc.data().text }],
        }));
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: systemPrompt });
        const chat = model.startChat({ history: history });
        const result = await chat.sendMessage(userInput);
        const aiResponseText = result.response.text();

        await messagesRef.add({ role: 'user', text: userInput, timestamp: Firestore.FieldValue.serverTimestamp() });
        await messagesRef.add({ role: 'model', text: aiResponseText, timestamp: Firestore.FieldValue.serverTimestamp() });
        
        return res.status(200).json({ reply: aiResponseText, sessionId: sessionId });

    } catch (error) {
      console.error('Error processing POST request:', error);
      return res.status(500).json({ error: 'An internal server error occurred.' });
    }
  }

  // If not GET or POST
  return res.status(405).json({ error: 'Method Not Allowed' });
};
