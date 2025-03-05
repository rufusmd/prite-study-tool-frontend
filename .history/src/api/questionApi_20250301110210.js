// src/api/questionApi.js
import api from '../utils/api';

const questionApi = {
    // Get all questions
    getQuestions: async () => {
        try {
            const response = await api.get('/questions');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to get questions'
            };
        }
    },

    // Get questions due for review
    getDueQuestions: async () => {
        try {
            const response = await api.get('/questions/due');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to get due questions'
            };
        }
    },

    // Search questions
    searchQuestions: async (params) => {
        try {
            const response = await api.get('/questions/search', { params });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to search questions'
            };
        }
    },

    // Parse OCR text into questions
    parseQuestions: async (ocrText, part) => {
        try {
            const response = await api.post('/parser/questions', { ocrText, part });
            return { success: true, questions: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to parse questions'
            };
        }
    },

    // Create bulk questions
    createBulkQuestions: async (questions) => {
        try {
            const response = await api.post('/questions/bulk', { questions });
            return { success: true, questions: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create questions'
            };
        }
    },

    // Update study data after reviewing
    updateStudyData: async (questionId, difficulty) => {
        try {
            const response = await api.patch(`/questions/${questionId}/study`, { difficulty });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update study data'
            };
        }
    }
};

export default questionApi;