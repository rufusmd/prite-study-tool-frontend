// src/components/capture/AnswerKeyProcessor.jsx
import { useState } from 'react';

const AnswerKeyProcessor = () => {
    const [inputText, setInputText] = useState('');
    const [part, setPart] = useState('1');
    const [startNumber, setStartNumber] = useState('1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [processedAnswers, setProcessedAnswers] = useState(null);
    const [questionIds, setQuestionIds] = useState([]);
    const [stage, setStage] = useState('input'); // 'input', 'review', 'complete'

    // Process the answer key
    const processAnswerKey = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/claude', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: inputText,
                    format: 'json',
                    prompt: `Extract PRITE exam answers from this table of answers. The table has columns for Item (question number) and Response (the answer letter). 

For each item, return just the single letter answer (A, B, C, D, or E). If there's a letter in parentheses, use that one as it's the correct answer.

Format your response as a JSON object where the keys are question numbers and the values are the answer letters. Return only valid JSON with no other text.

Example output: {"1":"B","2":"A","3":"C"}

Here is the answer key text:
${inputText}`
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Clean and parse the data
                let cleanJson = data.data;

                // Remove markdown code blocks if present
                if (typeof data.data === 'string') {
                    cleanJson = data.data
                        .replace(/```json\s*/g, '')
                        .replace(/```\s*$/g, '')
                        .trim();
                }

                const answers = typeof cleanJson === 'string'
                    ? JSON.parse(cleanJson)
                    : cleanJson;

                console.log('Processed answers:', answers);
                setProcessedAnswers(answers);
                setStage('review');
            } else {
                setError(data.error || 'Failed to process answer key');
            }
        } catch (error) {
            console.error('Error processing answer key:', error);
            setError('Error processing answer key: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Apply answers to questions
    const applyAnswers = async () => {
        try {
            setLoading(true);
            setError(null);

            // For demonstration - in real implementation this would save to database
            console.log('Applying answers:', processedAnswers);
            console.log('Part:', part);
            console.log('Starting number:', startNumber);

            // Simulate successful API call
            setTimeout(() => {
                setStage('complete');
                setLoading(false);
            }, 1000);

            // When you implement backend storage:
            /*
            const response = await fetch('/api/parser/answers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
              },
              body: JSON.stringify({
                answers: processedAnswers,
                part
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            console.log('Answers applied successfully:', data);
            setStage('complete');
            */
        } catch (error) {
            console.error('Error applying answers:', error);
            setError('Error applying answers: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Input stage
    if (stage === 'input') {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Process Answer Key</h2>

                <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">PRITE Part:</label>
                        <select
                            value={part}
                            onChange={(e) => setPart(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="1">Part 1</option>
                            <option value="2">Part 2</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Starting Question Number:</label>
                        <input
                            type="number"
                            value={startNumber}
                            onChange={(e) => setStartNumber(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            min="1"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Paste Answer Key Text:
                    </label>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        rows="10"
                        placeholder="Paste the answer key text here or upload an image of the answer key..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Include column headers and the table format. If pasting from a PDF, try to preserve the table structure.
                    </p>
                </div>

                <button
                    onClick={processAnswerKey}
                    disabled={loading || !inputText.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md w-full"
                >
                    {loading ? "Processing..." : "Process Answer Key"}
                </button>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // Review stage
    if (stage === 'review') {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Review Extracted Answers</h2>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Processed Answers:</h3>
                        <span className="text-sm text-gray-500">
                            {processedAnswers ? Object.keys(processedAnswers).length : 0} answers found
                        </span>
                    </div>

                    <div className="border rounded-md">
                        <div className="max-h-64 overflow-y-auto p-4">
                            <div className="grid grid-cols-5 gap-2">
                                {processedAnswers && Object.entries(processedAnswers).map(([number, answer]) => (
                                    <div key={number} className="border rounded p-2 text-center flex flex-col">
                                        <span className="text-xs text-gray-500">Item</span>
                                        <span className="font-bold">{number}</span>
                                        <span className="text-xs text-gray-500">Answer</span>
                                        <span className="bg-blue-100 rounded-full px-2 py-1 font-medium">{answer}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setStage('input')}
                        className="px-4 py-2 border rounded-md"
                    >
                        Go Back
                    </button>

                    <button
                        onClick={applyAnswers}
                        disabled={loading}
                        className="px-4 py-2 bg-green-500 text-white rounded-md"
                    >
                        {loading ? "Applying..." : "Apply Answers"}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // Complete stage
    if (stage === 'complete') {
        return (
            <div className="p-4 bg-white rounded-lg shadow text-center">
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>

                <h2 className="text-xl font-bold mb-4">Answers Applied Successfully!</h2>

                <p className="mb-6">The answers have been applied to your questions.</p>

                <button
                    onClick={() => {
                        setInputText('');
                        setPart('1');
                        setStartNumber('1');
                        setProcessedAnswers(null);
                        setStage('input');
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                    Process Another Answer Key
                </button>
            </div>
        );
    }

    return null;
};

export default AnswerKeyProcessor;