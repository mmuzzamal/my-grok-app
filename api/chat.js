// api/chat.js - Vercel Serverless Function for Groq API
/**
 * This file handles chat requests and forwards them to Groq API
 * Environment variable required: GROQ_API_KEY
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed. Use POST.'
        });
    }

    try {
        // Validate request body
        const { message, max_tokens = 150 } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Message is required and must be a string'
            });
        }

        if (message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message cannot be empty'
            });
        }

        if (message.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Message too long (max 1000 characters)'
            });
        }

        // Get API key from environment variables
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('GROQ_API_KEY environment variable not set');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
        }

        // Prepare the request to Groq API
        const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        
        const groqRequest = {
            model: 'llama-3.3-70b-versatile', // Using a stable Groq model
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant. Be concise and friendly in your responses.'
                },
                {
                    role: 'user',
                    content: message.trim()
                }
            ],
            max_tokens: Math.min(parseInt(max_tokens) || 150, 300),
            temperature: 0.7,
            stream: false
        };

        // Make request to Groq API
        console.log('Making request to Groq API...');
        
        const groqResponse = await fetch(groqApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(groqRequest)
        });

        // Handle API response
        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error(`Groq API error: ${groqResponse.status} - ${errorText}`);
            
            if (groqResponse.status === 401) {
                return res.status(500).json({
                    success: false,
                    error: 'API authentication failed'
                });
            } else if (groqResponse.status === 429) {
                return res.status(429).json({
                    success: false,
                    error: 'API rate limit exceeded. Please try again later.'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to get response from AI service'
                });
            }
        }

        const groqData = await groqResponse.json();
        console.log('Received response from Groq API');

        // Extract the response message
        if (groqData.choices && groqData.choices.length > 0) {
            const assistantMessage = groqData.choices[0].message.content;
            
            return res.status(200).json({
                success: true,
                response: assistantMessage,
                error: null
            });
        } else {
            console.error('Unexpected API response format:', groqData);
            return res.status(500).json({
                success: false,
                error: 'Unexpected response format from AI service'
            });
        }

    } catch (error) {
        console.error('Server error:', error);
        
        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return res.status(500).json({
                success: false,
                error: 'Network error connecting to AI service'
            });
        }
        
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}
