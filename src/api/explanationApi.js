// src/api/explanationApi.js
import api from '../utils/api';

const explanationApi = {
    // Generate explanation for a question
    generateExplanation: async (questionData) => {
        try {
            const response = await api.post('/explanation/generate', questionData);

            return {
                success: true,
                explanation: response.data.explanation
            };
        } catch (error) {
            console.error('Explanation generation error:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to generate explanation'
            };
        }
    }
};

export default explanationApi;