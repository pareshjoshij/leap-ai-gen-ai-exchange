const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Generative AI client with your API key
// NOTE: For a real app, use Secret Manager to store the API key. For the hackathon, we'll set it as an environment variable during deployment.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemPrompt = `
You are Leap AI, an intelligent and empathetic personal career architect for Indian students. Your persona is encouraging and insightful. Your goal is to understand the user's interests through natural conversation and provide an actionable roadmap. Do not sound like a generic chatbot.
`;

/**
 * HTTP Cloud Function.
 *
 * @param {express.Request} req The request object.
 * @param {express.Response} res The response object.
 */
exports.handler = async (req, res) => {
  // Set CORS headers for preflight requests
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  // Ensure the request is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const userInput = req.body.message;

    if (!userInput) {
      return res.status(400).json({ error: 'No message provided in the request body.' });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userInput);
    const response = await result.response;
    const aiResponseText = response.text();

    // Send the AI's response back in the agreed-upon JSON format
    res.status(200).json({ reply: aiResponseText });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
};