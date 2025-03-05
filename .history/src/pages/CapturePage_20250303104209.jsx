// src/pages/CapturePage.jsx
import { useState, useContext } from 'react';
import { QuestionContext } from '../contexts/QuestionContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ClaudeInput from '../components/capture/ClaudeInput';
import CategorySelector from '../components/common/CategorySelector';
import { PRITE_CATEGORIES } from '../constants/categories';

const CapturePage = () => {
    const [step, setStep] = useState('upload'); // upload, parse, review, complete
    const [ocrText, setOcrText] = useState('');
    const [part, setPart] = useState('1');
    const [category, setCategory] = useState('');
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [alert, setAlert] = useState(null);

    const { parseQuestions, addBulkQuestions, loading } = useContext(QuestionContext);

    // Handle processed result from Claude
    const handleClaudeResult = (data, isParsed) => {
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
                    category: category || q.category || "",
                    part: part,
                    isPublic: false
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
                // Add the selected category to all parsed questions
                const questionsWithCategory = result.questions.map(q => ({
                    ...q,
                    category: category || q.category || ""
                }));

                setParsedQuestions(questionsWithCategory);
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
        // Update any missing part or category values
        const questionsToSave = parsedQuestions.map(q => ({
            ...q,
            part: q.part || part,
            category: q.category || category || ""
        }));

        try {
            const result = await addBulkQuestions(questionsToSave);

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

    // In the 'upload' step render:
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
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

                    <div>
                        <label className="block text-sm font-medium mb-1">PRITE Category</label>
                        <CategorySelector
                            selectedCategory={category}
                            onChange={setCategory}
                            className="mb-4"
                        />
                    </div>
                </div>

                <ClaudeInput
                    onProcessed={handleClaudeResult}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">PRITE Part</label>
                            <select
                                value={part}
                                onChange={(e) => setPart(e.target.value)}
                                className="input"
                            >
                                <option value="1">Part 1</option>
                                <option value="2">Part 2</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">PRITE Category</label>
                            <CategorySelector
                                selectedCategory={category}
                                onChange={setCategory}
                            />
                        </div>
                    </div>

                    <label className="block text-sm font-medium mb-1 mt-4">Extracted Text</label>
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

                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    Part {question.part || part}
                                </span>

                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                    {question.category || category || "Uncategorized"}
                                </span>
                            </div>

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
                                    Category
                                </label>
                                <CategorySelector
                                    selectedCategory={question.category || category}
                                    onChange={(newCategory) => {
                                        const updatedQuestions = [...parsedQuestions];
                                        updatedQuestions[index].category = newCategory;
                                        setParsedQuestions(updatedQuestions);
                                    }}
                                />
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
                    onClick={() => {
                        setStep('upload');
                        setCategory('');
                    }}
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