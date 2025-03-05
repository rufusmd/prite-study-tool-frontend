// src/components/capture/QuestionReview.jsx
import { useState } from 'react';

const QuestionReview = ({ questions, onSave, onCancel }) => {
    const [reviewQuestions, setReviewQuestions] = useState(questions.map(q => ({
        ...q,
        correctAnswer: '', // No correct answer selected initially
        explanation: ''    // Empty explanation initially
    })));

    // Handle selecting a correct answer for a question
    const handleSelectAnswer = (questionIndex, option) => {
        const updatedQuestions = [...reviewQuestions];
        updatedQuestions[questionIndex].correctAnswer = option;
        setReviewQuestions(updatedQuestions);
    };

    // Handle updating explanation
    const handleExplanationChange = (questionIndex, explanation) => {
        const updatedQuestions = [...reviewQuestions];
        updatedQuestions[questionIndex].explanation = explanation;
        setReviewQuestions(updatedQuestions);
    };

    // Calculate how many questions have selected answers
    const answeredCount = reviewQuestions.filter(q => q.correctAnswer).length;

    return (
        <div className="question-review">
            <h2 className="text-xl font-bold mb-4">
                Review Questions ({answeredCount}/{reviewQuestions.length} answered)
            </h2>

            <div className="max-h-[70vh] overflow-y-auto pr-2">
                {reviewQuestions.map((question, qIndex) => (
                    <div key={qIndex} className="card mb-4 p-4">
                        <div className="mb-2 font-medium">Question {question.number}</div>
                        <div className="mb-4">{question.text}</div>

                        <div className="mb-4">
                            {Object.entries(question.options).map(([letter, text]) => (
                                text && (
                                    <div
                                        key={letter}
                                        className={`p-3 border rounded-md mb-2 cursor-pointer ${letter === question.correctAnswer
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        onClick={() => handleSelectAnswer(qIndex, letter)}
                                    >
                                        <span className="font-bold">{letter}:</span> {text}
                                    </div>
                                )
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Explanation (optional):
                            </label>
                            <textarea
                                value={question.explanation}
                                onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                                className="w-full p-2 border rounded-md"
                                placeholder="Add an explanation for this question..."
                                rows="3"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between mt-6">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border rounded-md"
                >
                    Back
                </button>
                <button
                    onClick={() => onSave(reviewQuestions)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    disabled={answeredCount === 0}
                >
                    {answeredCount === 0
                        ? 'Select at least one answer'
                        : `Save ${answeredCount} Questions`}
                </button>
            </div>
        </div>
    );
};

export default QuestionReview;