// Create a test component somewhere in your app
const TestClaudeApi = () => {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const testApi = async () => {
        try {
            const testText = "Sample question 1. What is psychiatry? A) Science of mind B) Medical specialty";
            const result = await claudeApi.processText(testText, "json");
            console.log("Claude API result:", result);
            setResult(result);
        } catch (err) {
            console.error("Test failed:", err);
            setError(err.message);
        }
    };

    return (
        <div>
            <h2>Claude API Test</h2>
            <button onClick={testApi}>Test Claude API</button>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
        </div>
    );
};