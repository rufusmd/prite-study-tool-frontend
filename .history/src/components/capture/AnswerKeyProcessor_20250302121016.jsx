// src/components/capture/AnswerKeyProcessor.jsx
import { useState } from 'react';

const AnswerKeyProcessor = () => {
    const [inputText, setInputText] = useState('');
    const [part, setPart] = useState('1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [processedAnswers, setProcessedAnswers] = useState(null);
    const [questionIds, setQuestionIds] = useState([]);
    const [stage, setStage] = useState('input'); // 'input', 'select', 'complete'

    // Get questions without answers
    const loadQuestionsWithoutAnswers = async () => {
        try {
            setLoading(true);

            const response = await fetch('http://192.168.1.227:3000/api/questions/search?correctAnswer=', {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            });

            const questions = await response.json();

            // Filter questions by selected part
            const filteredQuestions = questions.filter(q => q.part === part);

            // Default to selecting all questions
            setQuestionIds(filteredQuestions.map(q => q._id));

            return filteredQuestions;
        } catch (error) {
            console.error('Error loading questions:', error);
            setError('Failed to load questions: ' + error.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Process the answer key
    const processAnswerKey = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://192.168.1.227:3000/api/claude', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: inputText,
                    format: 'json',
                    prompt: `Extract PRITE exam answers from this answer key. Format as a JSON object where the keys are question numbers and the values are the answer letters (A, B, C, D, or E). Return only valid JSON with no other text. Example: {"1":"B","2":"A"} 
          
          Here is the answer key text:
          ${inputText}`
                })
            });

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

                // Load questions without answers for selection
                const questions = await loadQuestionsWithoutAnswers();

                if (questions.length > 0) {
                    setStage('select');
                } else {
                    setError('No questions found without answers for part ' + part);
                }
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

    // Apply answers to selected questions
    const applyAnswers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://192.168.1.227:3000/api/parser/answers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify({
                    answerKeyText: JSON.stringify(processedAnswers),
                    part,
                    questionIds
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Answers applied successfully:', data);
                setStage('complete');
            } else {
                throw new Error(data.message || 'Failed to apply answers');
            }
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

                <div className="mb-4">
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

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Paste Answer Key Text:
                    </label>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        rows="10"
                        placeholder="Paste the answer key text here..."
                    />
                </div>

                <button
                    onClick={processAnswerKey}
                    disabled={loading || !inputText.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
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

    // Select questions stage
    if (stage === 'select') {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Apply Answers to Questions</h2>

                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Processed Answers:</h3>
                        <span className="text-sm text-gray-500">
                            {Object.keys(processedAnswers).length} answers found
                        </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-md max-h-40 overflow-y-auto">
                        <pre className="text-xs">{JSON.stringify(processedAnswers, null, 2)}</pre>
                    </div>
                </div>

                <button
                    onClick={applyAnswers}
                    disabled={loading || questionIds.length === 0}
                    className="px-4 py-2 bg-green-500 text-white rounded-md w-full"
                >
                    {loading ? "Applying..." : `Apply Answers to ${questionIds.length} Questions`}
                </button>

                <button
                    onClick={() => setStage('input')}
                    disabled={loading}
                    className="px-4 py-2 border rounded-md w-full mt-2"
                >
                    Go Back
                </button>

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
                        setProcessedAnswers(null);
                        setQuestionIds([]);
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