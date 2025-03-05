// src/pages/CapturePage.jsx (updated version)
import { useState, useContext } from 'react';
import { QuestionContext } from '../contexts/QuestionContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ClaudeInput from '../components/capture/ClaudeInput';
import ImageUploader from '../components/capture/ImageUploader';
import claudeApi from '../api/claudeApi';

const CapturePage = () => {
    // All existing state variables...
    const [step, setStep] = useState('upload');
    const [ocrText, setOcrText] = useState('');
    const [part, setPart] = useState('1');
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [alert, setAlert] = useState(null);

    // New state variables for Claude integration
    const [selectedImage, setSelectedImage] = useState(null);
    const [processingImage, setProcessingImage] = useState(false);
    const [outputFormat, setOutputFormat] = useState('json');

    const { parseQuestions, addBulkQuestions, loading } = useContext(QuestionContext);

    // Handle image upload
    const handleImageUpload = (file) => {
        setSelectedImage(file);
    };

    // Process image with Claude
    const processImageWithClaude = async () => {
        if (!selectedImage) {
            setAlert({
                type: 'error',
                message: 'Please select an image first'
            });
            return;
        }

        setProcessingImage(true);

        // Construct prompt based on format
        const basePrompt = "Here's a photo of PRITE exam questions. Please:";

        const jsonPrompt = `${basePrompt}
1. Extract all questions and answer choices
2. Format as a JSON array where each question has this structure:
{
  "number": "1",
  "text": "Question text here",
  "options": {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text",
    "E": "Option E text"
  }
}
3. Return only valid JSON with no other text`;

        const textPrompt = `${basePrompt}
1. Extract all questions and answer choices
2. Format each question with its number, text, and options A-E
3. Separate each question clearly
4. Preserve the exact wording from the image`;

        const prompt = outputFormat === 'json' ? jsonPrompt : textPrompt;

        try {
            const result = await claudeApi.processImage(selectedImage, prompt);

            if (result.success) {
                if (outputFormat === 'json') {
                    // Try to parse the JSON response
                    try {
                        const parsedData = JSON.parse(result.data);
                        handleClaudeInput(parsedData, true);
                    } catch (error) {
                        console.error('Error parsing JSON from Claude:', error);
                        setOcrText(result.data);
                        setStep('parse');
                    }
                } else {
                    // Handle text format
                    setOcrText(result.data);
                    setStep('parse');
                }
            } else {
                setAlert({
                    type: 'error',
                    message: result.error || 'Failed to process image with Claude'
                });
            }
        } catch (error) {
            console.error('Error processing with Claude:', error);
            setAlert({
                type: 'error',
                message: 'An error occurred while processing with Claude'
            });
        } finally {
            setProcessingImage(false);
        }
    };

    // Handle input from ClaudeInput
    const handleClaudeInput = async (data, isParsed) => {
        if (isParsed) {
            // If we received pre-parsed JSON data
            try {
                // Ensure the data is an array
                const questionsArray = Array.isArray(data) ? data : [data];

                // Validate and format the questions
                const formattedQuestions = questionsArray.map(q => ({
                    number: q.number || "",
                    text: q.text || "",
                    options: q.options || { A: "", B: "", C: "", D: "", E: "" },
                    correctAnswer: q.correctAnswer || "",
                    explanation: q.explanation || "",
                    part: part
                }));

                setParsedQuestions(formattedQuestions);
                setStep('review');
            } catch (error) {
                console.error('Error processing JSON data:', error);
                setAlert({
                    type: 'error',
                    message: 'Error processing the JSON data. Please check the format.'
                });
            }
        } else {
            // If we received plain text, go to the parse step
            setOcrText(data);
            setStep('parse');
        }
    };

    // Handle parsing of OCR text
    const handleParse = async () => {
        if (!ocrText.trim()) {
            setAlert({
                type: 'error',
                message: 'Please enter some text to parse'
            });
            return;
        }

        try {
            const result = await parseQuestions(ocrText, part);

            if (result.success) {
                setParsedQuestions(result.questions);
                setStep('review');
            } else {
                setAlert({
                    type: 'error',
                    message: result.error || 'Failed to parse questions'
                });
            }
        } catch (error) {
            console.error('Parse error:', error);
            setAlert({
                type: 'error',
                message: 'An error occurred while parsing the questions'
            });
        }
    };

    // Handle saving all questions
    const handleSave = async () => {
        // Update any missing part values
        const questionsWithPart = parsedQuestions.map(q => ({
            ...q,
            part: q.part || part
        }));

        try {
            const result = await addBulkQuestions(questionsWithPart);

            if (result.success) {
                setStep('complete');
                setAlert({
                    type: 'success',
                    message: `Successfully saved ${result.questions.length} questions!`
                });
            } else {
                setAlert({
                    type: 'error',
                    message: result.error || 'Failed to save questions'
                });
            }
        } catch (error) {
            console.error('Save error:', error);
            setAlert({
                type: 'error',
                message: 'An error occurred while saving the questions'
            });
        }
    };

    // Render based on current step
    if (step === 'upload') {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">Capture Questions</h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                <div className="card mb-4">
                    <h3 className="text-lg font-bold mb-2">Using Claude for OCR</h3>
                    <ol className="list-decimal ml-4 text-gray-700">
                        <li className="mb-2">Take photos of your PRITE questions</li>
                        <li className="mb-2">Upload the images to Claude in a conversation</li>
                        <li className="mb-2">Use one of the prompt templates below</li>
                        <li className="mb-2">Copy Claude's response and paste it below</li>
                    </ol>

                    <div className="mt-4">
                        <h4 className="font-medium mb-2">Prompt Templates:</h4>

                        <div className="bg-gray-50 p-3 rounded-md mb-3 text-sm">
                            <p className="font-bold mb-1">JSON Format (Recommended):</p>
                            <div className="bg-gray-100 p-2 rounded">
                                Here's a photo of PRITE exam questions. Please:<br />
                                1. Extract all questions and answer choices<br />
                                2. Format as a JSON array where each question has this structure:<br />
                                {`{
  "number": "1",
  "text": "Question text here",
  "options": {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text",
    "E": "Option E text"
  }
}`}<br />
                                3. Return only valid JSON with no other text
                            </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                            <p className="font-bold mb-1">Plain Text Format:</p>
                            <div className="bg-gray-100 p-2 rounded">
                                Here's a photo of PRITE exam questions. Please:<br />
                                1. Extract all questions and answer choices<br />
                                2. Format each question with its number, text, and options A-E<br />
                                3. Separate each question clearly<br />
                                4. Preserve the exact wording from the image
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">PRITE Part</label>
                    <select
                        value={part}
                        onChange={(e) => setPart(e.target.value)}
                        className="input mb-4"
                    >
                        <option value="1">Part 1</option>
                        <option value="2">Part 2</option>
                    </select>
                </div>

                <ClaudeInput
                    onSubmit={handleClaudeInput}
                    isLoading={loading}
                />
            </div>
        );
    }

    if (step === 'parse') {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">Review Text</h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Extracted Text</label>
                    <textarea
                        value={ocrText}
                        onChange={(e) => setOcrText(e.target.value)}
                        className="input h-64 mb-4"
                        placeholder="Edit extracted text if needed..."
                        disabled={loading}
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setStep('upload')}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleParse}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <LoadingSpinner size="small" />
                                <span className="ml-2">Parsing...</span>
                            </div>
                        ) : (
                            'Parse Questions'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'review' && parsedQuestions.length > 0) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">
                    Review Questions ({parsedQuestions.length})
                </h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                <div className="mb-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                    {parsedQuestions.map((question, index) => (
                        <div key={index} className="card mb-4">
                            <p className="font-medium mb-2">
                                Question {question.number || index + 1}
                            </p>
                            <p className="mb-3">{question.text}</p>

                            <div className="mb-4">
                                {Object.entries(question.options).map(([letter, text]) => (
                                    text && (
                                        <div
                                            key={letter}
                                            className={`p-3 border rounded-lg mb-2 ${question.correctAnswer === letter
                                                    ? 'border-success bg-success/10'
                                                    : 'border-gray-300'
                                                }`}
                                            onClick={() => {
                                                // Update the correct answer
                                                const updatedQuestions = [...parsedQuestions];
                                                updatedQuestions[index].correctAnswer = letter;
                                                setParsedQuestions(updatedQuestions);
                                            }}
                                        >
                                            <span className="font-bold">{letter}:</span> {text}
                                        </div>
                                    )
                                ))}
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">
                                    Explanation (optional)
                                </label>
                                <textarea
                                    value={question.explanation || ''}
                                    onChange={(e) => {
                                        const updatedQuestions = [...parsedQuestions];
                                        updatedQuestions[index].explanation = e.target.value;
                                        setParsedQuestions(updatedQuestions);
                                    }}
                                    className="input"
                                    placeholder="Add explanation..."
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sticky bottom-0 bg-white p-4 border-t flex gap-2">
                    <button
                        onClick={() => setStep(parsedQuestions[0].text ? 'upload' : 'parse')}
                        className="btn btn-secondary flex-1"
                        disabled={loading}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary flex-1"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <LoadingSpinner size="small" />
                                <span className="ml-2">Saving...</span>
                            </div>
                        ) : (
                            'Save All'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'complete') {
        return (
            <div className="text-center py-8">
                <svg className="mx-auto h-16 w-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h2 className="text-2xl font-bold my-4">Questions Saved!</h2>
                <p className="mb-6">Your questions have been added to your collection.</p>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                <button
                    onClick={() => setStep('upload')}
                    className="btn btn-primary w-full"
                >
                    Add More Questions
                </button>
            </div>
        );
    }

    // Fallback for empty review
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">No Questions Found</h2>
            <p className="mb-4">No questions were detected in the text.</p>
            <button
                onClick={() => setStep('parse')}
                className="btn btn-primary"
            >
                Try Again
            </button>
        </div>
    );
};

export default CapturePage;