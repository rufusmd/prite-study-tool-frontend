// src/api/claudeApi.js
import api from '../utils/api';

const claudeApi = {
    // Process text with Claude
    processText: async (text, format = 'json', customPrompt = null) => {
        try {
            console.log("Sending request to Claude API");
            // Make a direct fetch call to the working endpoint
            const response = await fetch('http://192.168.1.227:3000/api/claude', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    format,
                    prompt: customPrompt
                })
            });

            const data = await response.json();

            return {
                success: data.success,
                data: data.data
            };
        } catch (error) {
            console.error('Claude API error:', error);
            return {
                success: false,
                error: error.message || 'Failed to process text with Claude'
            };
        }
    }
};

export default claudeApi;