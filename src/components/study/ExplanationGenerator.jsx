// src/components/study/ExplanationGenerator.jsx
import { useState } from 'react';
import { explanationApi } from '../../api';
import LoadingSpinner from '../common/LoadingSpinner';

const ExplanationGenerator = ({ question, isVisible = false }) => {
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generated, setGenerated] = useState(false);

    // Generate explanation using Claude API
    const generateExplanation = async () => {
        try {
            setLoading(true);
            setError(null);

            // Extract needed question data
            const questionData = {
                question: question.text,
                options: question.options,
                correctAnswer: question.correctAnswer
            };

            const response = await explanationApi.generateExplanation(questionData);

            if (response.success) {
                setExplanation(response.explanation);
                setGenerated(true);
            } else {
                throw new Error(response.error || 'Failed to generate explanation');
            }
        } catch (error) {
            console.error('Error generating explanation:', error);
            setError(error.message || 'Failed to generate explanation');
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="mt-6 border-t pt-4">
            {!generated && !loading && (
                <button
                    onClick={generateExplanation}
                    className="btn btn-secondary"
                    disabled={loading}
                >
                    Generate Detailed Explanation
                </button>
            )}

            {loading && (
                <div className="flex items-center justify-center py-6">
                    <LoadingSpinner size="medium" />
                    <span className="ml-3 text-gray-600">Generating detailed explanation...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md my-4">
                    <p className="font-bold">Error generating explanation:</p>
                    <p>{error}</p>
                    <button
                        onClick={generateExplanation}
                        className="mt-2 text-sm underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {generated && explanation && (
                <div className="mt-4">
                    <h3 className="font-bold text-lg mb-4">Detailed Explanation</h3>

                    <div className="prose max-w-none">
                        {explanation.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="mb-4">{paragraph}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExplanationGenerator;