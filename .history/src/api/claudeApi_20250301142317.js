// src/api/claudeApi.js
import axios from 'axios';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

const claudeApi = {
    processImage: async (imageFile, prompt) => {
        try {
            // Convert image to base64
            const base64Image = await fileToBase64(imageFile);

            // Prepare the request payload
            const payload = {
                model: "claude-3-haiku-20240307",
                max_tokens: 4000,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image",
                                source: {
                                    type: "base64",
                                    media_type: imageFile.type,
                                    data: base64Image.split(',')[1] // Remove data URL prefix
                                }
                            }
                        ]
                    }
                ]
            };

            // Send request to Claude API
            const response = await axios.post(CLAUDE_API_URL, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                }
            });

            return {
                success: true,
                data: response.data.content[0].text
            };
        } catch (error) {
            console.error('Claude API error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || 'Failed to process image with Claude'
            };
        }
    }
};

// Helper function to convert File to base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

export default claudeApi;