// src/pages/TestPage.jsx
import { useState } from 'react';
import QuestionReview from '../components/capture/QuestionReview';
import AnswerKeyProcessor from '../components/capture/AnswerKeyProcessor';

const TestPage = () => {
    const [activeTab, setActiveTab] = useState('questions'); // 'questions' or 'answers'
    const [inputText, setInputText] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [stage, setStage] = useState('input'); // 'input', 'review', 'complete'

    const handleTest = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            console.log("Testing Claude API with text:", inputText);

            const response = await fetch('http://192.168.1.227:3000/api/claude', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: inputText,
                    format: 'json'
                })
            });

            const data = await response.json();
            console.log("Claude API response:", data);

            if (data.success) {
                const jsonData = data.data;
                setResult(jsonData);

                // Parse the JSON result, cleaning markdown formatting if needed
                try {
                    let cleanJson = jsonData;

                    // Remove markdown code blocks if present (```json and ```)
                    if (typeof jsonData === 'string') {
                        cleanJson = jsonData
                            .replace(/```json\s*/g, '')  // Remove opening ```json
                            .replace(/```\s*$/g, '')     // Remove closing ```
                            .trim();                     // Trim any extra whitespace
                    }

                    const questions = typeof cleanJson === 'string'
                        ? JSON.parse(cleanJson)
                        : cleanJson;

                    setParsedQuestions(questions);
                    setStage('review');
                } catch (jsonError) {
                    console.error("JSON parsing error:", jsonError);
                    console.error("Raw data:", jsonData);
                    setError(`Failed to parse questions from response: ${jsonError.message}`);
                }
            } else {
                setError(data.error || "Unknown error");
            }
        } catch (err) {
            console.error("Test failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveQuestions = async (questions) => {
        try {
            setLoading(true);

            // Add part field if missing
            const questionsToSave = questions.map(q => ({
                ...q,
                part: q.part || "1" // Default to part 1 if not specified
            }));

            console.log("Saving questions:", questionsToSave);

            // Make the actual API call to save questions
            const response = await fetch('http://192.168.1.227:3000/api/questions/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify({ questions: questionsToSave })
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Questions saved successfully:", data);
                setStage('complete');
            } else {
                throw new Error(data.message || 'Failed to save questions');
            }
        } catch (err) {
            console.error("Save failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Main component render
    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">PRITE Study Tool</h1>

            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 ${activeTab === 'questions' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('questions')}
                >
                    Parse Questions
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'answers' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('answers')}
                >
                    Process Answer Key
                </button>
            </div>

            {activeTab === 'questions' ? (
                // Question parsing content
                <>
                    {stage === 'input' && (
                        <div className="p-4 bg-white rounded-lg shadow mb-8">
                            <h2 className="text-xl font-bold mb-4">Parse PRITE Questions</h2>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Paste PRITE Questions:</label>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    rows="12"
                                    placeholder="Paste your PRITE questions here..."
                                />
                            </div>

                            <button
                                onClick={handleTest}
                                disabled={loading || !inputText.trim()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                            >
                                {loading ? "Processing..." : "Parse Questions"}
                            </button>

                            {error && (
                                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                                    Error: {error}
                                </div>
                            )}
                        </div>
                    )}

                    {stage === 'review' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Review PRITE Questions</h2>

                            <QuestionReview
                                questions={parsedQuestions}
                                onSave={handleSaveQuestions}
                                onCancel={() => setStage('input')}
                            />

                            {error && (
                                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                                    Error: {error}
                                </div>
                            )}
                        </div>
                    )}

                    {stage === 'complete' && (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-6">Questions Saved!</h2>

                            <div className="p-8 bg-white rounded-lg shadow mb-8">
                                <svg className="w-20 h-20 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>

                                <p className="text-lg mb-6">Your questions have been saved successfully!</p>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => {
                                            setInputText('');
                                            setParsedQuestions([]);
                                            setResult(null);
                                            setStage('input');
                                        }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                                    >
                                        Add More Questions
                                    </button>

                                    <button
                                        onClick={() => {
                                            // This would typically navigate to your study page
                                            alert('This would navigate to your study page');
                                        }}
                                        className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md"
                                    >
                                        Start Studying
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                // Answer key processing tab
                <AnswerKeyProcessor />
            )}
        </div>
    );
};

export default TestPage;