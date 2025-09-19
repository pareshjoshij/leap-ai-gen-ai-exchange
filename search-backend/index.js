const { GoogleAuth } = require('google-auth-library');
const { DiscussServiceClient } = require("@google-ai/generativelanguage");
const { Firestore } = require('@google-cloud/firestore');
const { v4: uuidv4 } = require('uuid');

// --- CONFIGURATION ---
// IMPORTANT: Replace these placeholders with your actual Project and Data Store IDs.
const PROJECT_ID = 'leapaitest'; // The ID of your Google Cloud project (e.g., 'leapaitest')
const DATA_STORE_ID ='career-articles_1758301775526'; // The ID of your Vertex AI Search Data Store

// Initialize clients
const firestore = new Firestore();
const generativeClient = new DiscussServiceClient({
    authClient: new GoogleAuth().fromJSON({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    }),
});

const systemPrompt = `
You are Leap AI, an intelligent and empathetic personal career architect for Indian students.
Your primary goal is to provide a fact-based, data-driven career roadmap.
You MUST use the provided search results as the primary source for your answer.
Do not mention the search results directly (e.g., "According to the search results..."). Instead, synthesize the information into a natural, conversational response.
If the search results do not contain relevant information to answer the user's question, you must state that you couldn't find specific information in the knowledge base and then answer based on your general knowledge.
`;

/**
 * The main cloud function to handle advanced search and chat requests.
 * @param {express.Request} req The request object.
 * @param {express.Response} res The response object.
 */
exports.handler = async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-control-allow-headers', 'Content-Type');
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

        if (!sessionId) {
            sessionId = uuidv4();
        }

        // --- Step 1: Search the Knowledge Base with Vertex AI Search ---
        console.log(`Searching for: "${userInput}"`);
        const searchResponse = await searchDataStore(userInput);
        const searchResultsText = searchResponse.map(result => `Title: ${result.title}\nSnippet: ${result.snippet}`).join('\n\n');
        console.log('Search Results Context:', searchResultsText);

        // --- Step 2: Retrieve Chat History from Firestore ---
        const messagesRef = firestore.collection('sessions_advanced').doc(sessionId).collection('messages');
        const historySnapshot = await messagesRef.orderBy('timestamp', 'asc').limitToLast(4).get();
        const history = historySnapshot.docs.map(doc => ({
            author: doc.data().role === 'user' ? 'user' : 'model',
            content: doc.data().text,
        }));

        // --- Step 3: Call Gemini with Grounded Context ---
        const groundedPrompt = [
            {
                author: 'user',
                content: `Search Results Context:\n${searchResultsText}\n\nUser's Question: ${userInput}`
            }
        ];

        const [geminiResponse] = await generativeClient.generateMessage({
            model: `models/chat-bison`,
            prompt: {
                context: systemPrompt,
                examples: [],
                messages: [...history, ...groundedPrompt],
            },
        });

        const aiResponseText = geminiResponse.candidates[0].content;
        console.log('AI Response:', aiResponseText);

        // --- Step 4: Save New Messages to Firestore ---
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

        // --- Step 5: Send the Response to the User ---
        res.status(200).json({
            reply: aiResponseText,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

/**
 * Searches the Vertex AI Data Store.
 * @param {string} query The user's search query.
 * @returns {Promise<Array<{title: string, snippet: string}>>} A promise that resolves to an array of search results.
 */
async function searchDataStore(query) {
    const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    const accessToken = await auth.getAccessToken();

    const location = 'global'; // Or your specific location
    const url = `https://discoveryengine.googleapis.com/v1alpha/projects/${PROJECT_ID}/locations/${location}/collections/default_collection/dataStores/${DATA_STORE_ID}/servingConfigs/default_serving_config:search`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: query,
            pageSize: 3 // Get the top 3 most relevant results
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Vertex AI Search failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return (data.results || []).map(result => ({
        title: result.document.derivedStructData.title,
        snippet: result.document.derivedStructData.snippets[0].snippet
    }));
}

