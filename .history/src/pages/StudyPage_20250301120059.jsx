// src/pages/StudyPage.jsx
import { useState, useEffect, useContext } from 'react';
import { QuestionContext } from '../contexts/QuestionContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StudyPage = () => {
    const {
        dueQuestions,
        questions,
        currentStudySession,
        currentQuestionIndex,
        startStudySession,
        nextQuestion,
        updateStudyData,
        loading,
        error,
        clearError
    } = useContext(QuestionContext);

    const [alert, setAlert] = useState(null);
    const [showingAnswer, setShowingAnswer] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);

    // Set error alert
    useEffect(() => {
        if (error) {
            setAlert({
                type: 'error',
                message: error
            });
            clearError();
        }
    }, [error, clearError]);

    const handleStartSession = () => {
        if (dueQuestions.length === 0) {
            setAlert({
                type: 'info',
                message: 'No questions due for review! Add some questions or check back later.'
            });
            return;
        }

        const started = startStudySession();
        if (started) {
            setShowingAnswer(false);
            setSelectedOption(null);
        }
    };

    const handleShowAnswer = () => {
        setShowingAnswer(true);
    };

    const handleNextQuestion = () => {
        const hasNext = nextQuestion();
        if (hasNext) {
            setShowingAnswer(false);
            setSelectedOption(null);
        }
    };

    const handleDifficulty = async (difficulty) => {
        if (currentStudySession.length === 0) return;

        const questionId = currentStudySession[currentQuestionIndex]._id;
        await updateStudyData(questionId, difficulty);
        handleNextQuestion();
    };

    const handleSelectOption = (option) => {
        if (showingAnswer) return;
        setSelectedOption(option);
    };

    // Get current question
    const getCurrentQuestion = () => {
        if (currentStudySession.length === 0 || currentQuestionIndex >= currentStudySession.length) {
            return null;
        }

        return currentStudySession[currentQuestionIndex];
    };

    const currentQuestion = getCurrentQuestion();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    // Display placeholder if no session or at the end of session
    if (!currentQuestion) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <h2 className="text-2xl font-bold mb-6">Study Session</h2>

                {alert && (
                    <div className="w-full max-w-md mb-6">
                        <Alert
                            type={alert.type}
                            message={alert.message}
                            onClose={() => setAlert(null)}
                        />
                    </div>
                )}

                <div className="text-center">
                    {currentStudySession.length > 0 && currentQuestionIndex >= currentStudySession.length ? (
                        <div>
                            <svg className="mx-auto h-16 w-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <h3 className="text-xl mb-4">Session Complete!</h3>
                            <p className="mb-6">You've completed all the due questions in this session.</p>
                        </div>
                    ) : (
                        <div>
                            <svg className="mx-auto h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <p className="my-6">Start a study session to review questions due for review.</p>
                        </div>
                    )}

                    <button
                        onClick={handleStartSession}
                        className="btn btn-primary w-full"
                    >
                        {currentStudySession.length > 0 ? 'Restart Session' : 'Start Studying'}
                    </button>
                </div>
            </div>
        );
    }

    // Determine option class
    const getOptionClass = (letter) => {
        const baseClass = "p-3 border rounded-md cursor-pointer mb-2 transition-colors";

        if (!showingAnswer && selectedOption === letter) {
            return `${baseClass} border-primary bg-primary/10`;
        }

        if (showingAnswer) {
            if (letter === currentQuestion.correctAnswer) {
                return `${baseClass} border-success bg-success/10`;
            }
            if (selectedOption === letter && letter !== currentQuestion.correctAnswer) {
                return `${baseClass} border-danger bg-danger/10`;
            }
        }

        return `${baseClass} border-gray-300 hover:bg-gray-50`;
    };

    return (
        <div className="pb-20">
            <h2 className="text-2xl font-bold mb-6">Study Session</h2>

            {alert && (
                <div className="mb-6">
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                </div>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white">
                    Part {currentQuestion.part}
                </span>

                {currentQuestion.category && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success text-white">
                        {currentQuestion.category}
                    </span>
                )}
            </div>

            <div className="card">
                <p className="text-lg font-medium mb-6">{currentQuestion.text}</p>

                <div className="space-y-2 mb-6">
                    {Object.entries(currentQuestion.options).map(([letter, text]) => (
                        text && (
                            <div
                                key={letter}
                                className={getOptionClass(letter)}
                                onClick={() => handleSelectOption(letter)}
                            >
                                <span className="font-bold">{letter}:</span> {text}
                            </div>
                        )
                    ))}
                </div>

                {showingAnswer && currentQuestion.explanation && (
                    <div className="bg-gray-50 border-l-4 border-primary p-4 my-4">
                        <h4 className="font-bold mb-1">Explanation:</h4>
                        <p>{currentQuestion.explanation}</p>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-between">
                <button
                    onClick={handleStartSession}
                    className="btn btn-secondary"
                >
                    Restart
                </button>

                {!showingAnswer ? (
                    <button
                        onClick={handleShowAnswer}
                        className="btn btn-primary"
                    >
                        Show Answer
                    </button>
                ) : (
                    <button
                        onClick={handleNextQuestion}
                        disabled={currentQuestionIndex >= currentStudySession.length - 1}
                        className="btn btn-primary"
                    >
                        Next Question
                    </button>
                )}
            </div>

            {showingAnswer && (
                <div className="flex justify-between gap-2 mt-6">
                    <button
                        onClick={() => handleDifficulty(0)}
                        className="btn bg-danger text-white hover:bg-danger/90 flex-1"
                    >
                        Hard
                    </button>
                    <button
                        onClick={() => handleDifficulty(1)}
                        className="btn bg-warning text-white hover:bg-warning/90 flex-1"
                    >
                        Medium
                    </button>
                    <button
                        onClick={() => handleDifficulty(2)}
                        className="btn bg-success text-white hover:bg-success/90 flex-1"
                    >
                        Easy
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudyPage;