// src/pages/CapturePage.jsx
import { useState, useContext } from 'react';
import { QuestionContext } from '../contexts/QuestionContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CameraCapture from '../components/capture/CameraCapture';
import FileUpload from '../components/capture/FileUpload';

const CapturePage = () => {
    const [step, setStep] = useState('upload'); // upload, parse, review, complete
    const [ocrText, setOcrText] = useState('');
    const [part, setPart] = useState('1');
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [alert, setAlert] = useState(null);

    const { parseQuestions, addBulkQuestions, loading } = useContext(QuestionContext);

    // Handle text from camera or file upload
    const handleCapturedText = (text) => {
        setOcrText(text);
        setStep('parse');
    };

    // Handle error from camera or file upload
    const handleCaptureError = (errorMessage) => {
        setAlert({
            type: 'error',
            message: errorMessage
        });
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
    };

    // Handle saving all questions
    const handleSave = async () => {
        // Update any missing part values
        const questionsWithPart = parsedQuestions.map(q => ({
            ...q,
            part: q.part || part
        }));

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
    };

    // Render upload step
    // In src/pages/CapturePage.jsx, update the upload step
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
                    <h3 className="text-lg font-bold mb-2">Recommended Workflow</h3>
                    <ol className="list-decimal ml-4 text-gray-700">
                        <li className="mb-2">Scan your PRITE document with Microsoft Lens app</li>
                        <li className="mb-2">Use the "Document" mode for best results</li>
                        <li className="mb-2">Export/save as PDF</li>
                        <li className="mb-2">Upload the PDF below</li>
                    </ol>
                </div>

                <div className="mb-8">
                    <FileUpload
                        onUpload={handleCapturedText}
                        onError={handleCaptureError}
                    />
                </div>

                <div className="flex items-center mb-8">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-500">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <CameraCapture
                    onCapture={handleCapturedText}
                    onError={handleCaptureError}
                />
            </div>
        );
    }

    // Render parse step
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
                    <label className="block text-sm font-medium mb-1">PRITE Part</label>
                    <select
                        value={part}
                        onChange={(e) => setPart(e.target.value)}
                        className="input mb-4"
                        disabled={loading}
                    >
                        <option value="1">Part 1</option>
                        <option value="2">Part 2</option>
                    </select>
                </div>

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

    // Render review step
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
                        onClick={() => setStep('parse')}
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

    // Render complete step
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