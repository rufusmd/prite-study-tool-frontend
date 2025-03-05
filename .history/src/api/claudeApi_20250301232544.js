// src/api/claudeApi.js
import api from '../utils/api';

const claudeApi = {
    processText: async (text, format = 'json', customPrompt = null) => {
        try {
            console.log("Sending request to Claude API");
            // Use just 'claude' without any /api prefix
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