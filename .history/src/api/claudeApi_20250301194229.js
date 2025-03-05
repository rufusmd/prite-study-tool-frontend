// src/api/claudeApi.js
import api from '../utils/api';

const claudeApi = {
    // Process text with Claude
    processText: async (text, format = 'json', customPrompt = null) => {
        try {
            console.log("Sending request to Claude API");
            const response = await api.post('/claude', {
                text,
                format,
                prompt: customPrompt
            });

            return {
                success: true,
                data: response.data.data
            };
        } catch (error) {
            console.error('Claude API error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to process text with Claude'
            };
        }
    }
};

export default claudeApi;