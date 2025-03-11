import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import explanationService from '../../services/explanationService';

const ExplanationGenerator = ({ question, onSave, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [alert, setAlert] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const TIMEOUT_DURATION = 30000; // 30 seconds

    // Check local storage for cached explanation on component mount
    useEffect(() => {
        if (question?._id) {
            try {
                const cachedExplanation = localStorage.getItem(`explanation_${question._id}`);
                if (cachedExplanation && !explanation) {
                    setExplanation(cachedExplanation);
                }
            } catch (error) {
                // Ignore localStorage errors
                console.error('Error reading from localStorage:', error);
            }
        }
    }, [question, explanation]);

    // Generate explanation using the dedicated explanation service
    const generateExplanation = async () => {
        if (!question) return;

        try {
            setLoading(true);
            setAlert(null);

            // Set timeout for long-running requests
            const timeoutId = setTimeout(() => {
                if (loading) {
                    setLoading(false);
                    setAlert({
                        type: 'warning',
                        message: 'Explanation generation is taking longer than expected. Please try again.'
                    });
                }
            }, TIMEOUT_DURATION);

            // Call the dedicated explanation service
            const response = await explanationService.generateExplanation(question);

            // Clear timeout as response received
            clearTimeout(timeoutId);

            if (response.success) {
                setExplanation(response.data);
                setIsEditing(true);

                // Save to localStorage as backup
                try {
                    localStorage.setItem(`explanation_${question._id}`, response.data);
                } catch (storageError) {
                    // Ignore localStorage errors
                    console.error('Error saving to localStorage:', storageError);
                }
            } else {
                throw new Error(response.error || 'Failed to generate explanation');
            }
        } catch (error) {
            console.error('Error generating explanation:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to generate explanation'
            });
        } finally {
            setLoading(false);
        }
    };

    // Save explanation to the database
    const saveExplanation = async () => {
        try {
            setLoading(true);

            // Use explanation service to save the explanation
            const response = await explanationService.saveExplanation(question._id, explanation);

            if (response.success) {
                setAlert({
                    type: 'success',
                    message: 'Explanation saved successfully!'
                });

                // Update localStorage with saved version
                try {
                    localStorage.setItem(`explanation_${question._id}`, explanation);
                } catch (storageError) {
                    // Ignore localStorage errors
                    console.error('Error updating localStorage:', storageError);
                }

                // Notify parent component
                if (onSave) {
                    onSave({
                        ...question,
                        explanation
                    });
                }
            } else {
                throw new Error(response.error || 'Failed to save explanation');
            }
        } catch (error) {
            console.error('Error saving explanation:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to save explanation'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Explanation Generator</h2>

                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                    className="mb-4"
                />
            )}

            {/* Question preview */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{question?.text}</p>

                <div className="mt-2 space-y-1">
                    {question?.options && Object.entries(question.options).map(([letter, text]) => (
                        <div
                            key={letter}
                            className={`${letter === question.correctAnswer ? 'font-medium text-green-600' : ''}`}
                        >
                            <span className="font-bold">{letter}:</span> {text}
                        </div>
                    ))}
                </div>
            </div>

            {/* Explanation area */}
            {isEditing ? (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Explanation:</label>
                    <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        rows="12"
                        placeholder="Edit the generated explanation here..."
                    />
                </div>
            ) : explanation ? (
                <div className="mb-4 mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-600 whitespace-pre-wrap">
                    {explanation}
                </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex justify-end space-x-2">
                {!explanation && !isEditing && (
                    <button
                        onClick={generateExplanation}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="small" />
                                <span className="ml-2">Generating...</span>
                            </>
                        ) : (
                            'Generate Explanation'
                        )}
                    </button>
                )}

                {explanation && !isEditing && (
                    <>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn btn-secondary"
                        >
                            Edit
                        </button>

                        <button
                            onClick={saveExplanation}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    <span className="ml-2">Saving...</span>
                                </>
                            ) : (
                                'Save Explanation'
                            )}
                        </button>
                    </>
                )}

                {isEditing && (
                    <>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="btn btn-secondary"
                        >
                            Cancel Editing
                        </button>

                        <button
                            onClick={saveExplanation}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    <span className="ml-2">Saving...</span>
                                </>
                            ) : (
                                'Save Explanation'
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ExplanationGenerator;