// src/components/test/ClaudeApiTest.jsx
import { useState } from 'react';
import claudeApi from '../../api/claudeApi';

const ClaudeApiTest = () => {
    const [inputText, setInputText] = useState("Test question 1. What is psychiatry? A) Science of mind B) Medical specialty");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleTest = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            console.log("Testing Claude API with text:", inputText);
            const response = await claudeApi.processText(inputText, 'json');
            console.log("Claude API response:", response);

            if (response.success) {
                setResult(response.data);
            } else {
                setError(response.error || "Unknown error");
            }
        } catch (err) {
            console.error("Test failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Claude API Test</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Input Text:</label>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows="5"
                />
            </div>

            <button
                onClick={handleTest}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
                {loading ? "Processing..." : "Test Claude API"}
            </button>

            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                    Error: {error}
                </div>
            )}

            {result && (
                <div className="mt-4">
                    <h3 className="font-medium mb-2">Result:</h3>
                    <pre className="p-3 bg-gray-100 rounded-md overflow-auto text-sm">
                        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ClaudeApiTest;