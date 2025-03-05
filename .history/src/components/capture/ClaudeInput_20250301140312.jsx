import { useState } from 'react';

const ClaudeInput = ({ onSubmit, isLoading }) => {
    const [text, setText] = useState('');
    const [format, setFormat] = useState('json'); // 'json' or 'text'

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        try {
            if (format === 'json') {
                // Try to parse as JSON
                try {
                    const parsedData = JSON.parse(text);
                    onSubmit(parsedData, true); // Second param indicates pre-parsed data
                } catch (error) {
                    // If not valid JSON, alert the user
                    alert('Invalid JSON format. Please check the format or switch to text mode.');
                }
            } else {
                // Submit as raw text
                onSubmit(text, false);
            }
        } catch (error) {
            console.error('Error processing input:', error);
            alert('An error occurred while processing the input.');
        }
    };

    return (
        <div className="card">
            <h3 className="text-lg font-bold mb-4">Paste Formatted Questions from Claude</h3>

            <div className="mb-4">
                <div className="flex gap-2 mb-2">
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio"
                            name="format"
                            value="json"
                            checked={format === 'json'}
                            onChange={() => setFormat('json')}
                        />
                        <span className="ml-2">JSON Format</span>
                    </label>
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio"
                            name="format"
                            value="text"
                            checked={format === 'text'}
                            onChange={() => setFormat('text')}
                        />
                        <span className="ml-2">Plain Text</span>
                    </label>
                </div>

                {format === 'json' ? (
                    <div className="text-xs text-gray-600 mb-2">
                        Paste the JSON output from Claude, which should be an array of question objects.
                    </div>
                ) : (
                    <div className="text-xs text-gray-600 mb-2">
                        Paste the plain text output from Claude with extracted questions and options.
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Question Data from Claude
                    </label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="input h-64"
                        placeholder={format === 'json'
                            ? '[\n  {\n    "number": "1",\n    "text": "Question text...",\n    "options": {...}\n  },\n  ...\n]'
                            : 'Paste the text output from Claude here...'}
                        required
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : 'Process Questions'}
                </button>
            </form>
        </div>
    );
};

export default ClaudeInput;