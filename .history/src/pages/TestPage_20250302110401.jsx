import { useState } from 'react';

const TestPage = () => {
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

            // Direct fetch call without going through your API utility
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
                setResult(data.data);
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

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Claude API Test Page</h1>

            <div className="p-4 bg-white rounded-lg shadow mb-8">
                <h2 className="text-xl font-bold mb-4">Claude API Direct Test</h2>

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
                            {typeof result === 'string' ? result : JSON.stringify(JSON.parse(result), null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestPage;