// src/pages/StudyPage.jsx
import { useState, useEffect, useContext } from 'react';
import { QuestionContext } from '../contexts/QuestionContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StudyStats from '../components/study/StudyStats';
import SessionReview from '../components/study/SessionReview';
import ComparativeScoring from '../components/stats/ComparativeScoring';
import ExplanationGenerator from '../components/study/ExplanationGenerator';

const StudyPage = () => {
    const {
        dueQuestions,
        questions,
        currentStudySession,
        currentQuestionIndex,
        startStudySession,
        nextQuestion,
        updateStudyData,
        sessionStats,
        userStats,
        loading,
        error,
        clearError
    } = useContext(QuestionContext);

    const [alert, setAlert] = useState(null);
    const [showingAnswer, setShowingAnswer] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [answeredCorrectly, setAnsweredCorrectly] = useState(null);
    const [showStats, setShowStats] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [timeStarted, setTimeStarted] = useState(null);
    const [completedQuestions, setCompletedQuestions] = useState([]);

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

    // Start timer when showing a new question
    useEffect(() => {
        if (currentStudySession.length > 0 && !showingAnswer && !sessionComplete) {
            setTimeStarted(new Date());
        }
    }, [currentQuestionIndex, currentStudySession, showingAnswer, sessionComplete]);

    const handleStartSession = () => {
        if (dueQuestions.length === 0) {
            setAlert({
                type: 'info',
                message: 'No questions due for review! Add some questions or check back later.'
            });
            return;
        }

        setSessionComplete(false);
        setShowStats(false);
        setShowReview(false);
        setCompletedQuestions([]);
        const started = startStudySession();
        if (started) {
            setShowingAnswer(false);
            setSelectedOption(null);
            setAnsweredCorrectly(null);
            setTimeStarted(new Date());
        }
    };

    const handleShowAnswer = () => {
        if (!selectedOption) return;

        // Calculate time spent on question
        const timeSpent = new Date() - timeStarted;

        // Check if answer is correct
        const currentQuestion = getCurrentQuestion();
        if (currentQuestion && selectedOption) {
            const isCorrect = selectedOption === currentQuestion.correctAnswer;
            setAnsweredCorrectly(isCorrect);

            // Add to completed questions list for review
            setCompletedQuestions(prev => [
                ...prev,
                currentQuestion
            ]);
        }

        setShowingAnswer(true);
    };

    const handleNextQuestion = () => {
        const hasNext = nextQuestion();
        if (hasNext) {
            setShowingAnswer(false);
            setSelectedOption(null);
            setAnsweredCorrectly(null);
            setTimeStarted(new Date());
        } else {
            setSessionComplete(true);
            setShowStats(true);
        }
    };

    const handleDifficulty = async (difficulty) => {
        if (currentStudySession.length === 0) return;

        const questionId = currentStudySession[currentQuestionIndex]._id;
        await updateStudyData(questionId, difficulty, selectedOption);
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

    // Display review if needed
    if (sessionComplete && showReview) {
        return (
            <SessionReview
                sessionQuestions={completedQuestions}
                onStartNewSession={handleStartSession}
            />
        );
    }

    // Display stats if session is complete
    if (sessionComplete && showStats) {
        return (
            <div className="pb-20">
                <h2 className="text-2xl font-bold mb-6">Session Complete!</h2>

                <div className="card p-4 mb-6">
                    <div className="flex justify-center mb-4">
                        <svg className="h-16 w-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h3 className="text-xl font-bold text-center mb-4">Great job!</h3>
                    <p className="text-center text-gray-600 mb-6">
                        You've completed your study session. Here's how you did:
                    </p>

                    <StudyStats />
                </div>

                {/* Comparative Scoring */}
                <div className="card p-4 mb-6">
                    <ComparativeScoring />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleStartSession}
                        className="btn btn-primary"
                    >
                        Start New Session
                    </button>

                    <button
                        onClick={() => {
                            setShowStats(false);
                            setShowReview(true);
                        }}
                        className="btn btn-secondary"
                    >
                        Review Session
                    </button>
                </div>
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

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowStats(true)}
                                    className="btn btn-primary w-full"
                                >
                                    View Session Stats
                                </button>

                                <button
                                    onClick={() => {
                                        setShowReview(true);
                                        setShowStats(false);
                                    }}
                                    className="btn btn-secondary w-full"
                                >
                                    Review Questions
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <svg className="mx-auto h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <p className="my-6">Start a study session to review questions due for review.</p>
                        </div>
                    )}

                    {currentStudySession.length === 0 && (
                        <button
                            onClick={handleStartSession}
                            className="btn btn-primary w-full"
                        >
                            {currentStudySession.length > 0 ? 'Restart Session' : 'Start Studying'}
                        </button>
                    )}

                    {/* Quick stats overview */}
                    {dueQuestions.length > 0 && (
                        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-bold text-sm text-gray-700 mb-2">Today's Study Overview</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">{dueQuestions.length}</div>
                                    <div className="text-xs text-gray-600">Questions Due</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-success">{sessionStats.questionsAnswered}</div>
                                    <div className="text-xs text-gray-600">Answered Today</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Study streak */}
                    {userStats.streakDays > 0 && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center gap-3">
                                <div className="flex space-x-1">
                                    {[...Array(Math.min(userStats.streakDays, 5))].map((_, i) => (
                                        <div key={i} className="w-2 h-8 bg-primary rounded"></div>
                                    ))}
                                </div>
                                <div className="text-primary font-medium">
                                    {userStats.streakDays} day streak!
                                </div>
                            </div>
                        </div>
                    )}
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
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Study Session</h2>

                {/* Progress indicator */}
                <div className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1}/{currentStudySession.length}
                </div>
            </div>

            {alert && (
                <div className="mb-6">
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                </div>
            )}

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{
                        width: `${((currentQuestionIndex) / currentStudySession.length) * 100}%`
                    }}
                ></div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white">
                    Part {currentQuestion.part}
                </span>

                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success text-white">
                    {currentQuestion.category || "Uncategorized"}
                </span>

                {currentQuestion.year && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                        PRITE {currentQuestion.year}
                    </span>
                )}

                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500 text-white">
                    Question {currentQuestion.number || currentQuestionIndex + 1}
                </span>
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

                {showingAnswer && (
                    <div className={`p-4 my-4 rounded-lg ${answeredCorrectly
                            ? "bg-green-50 border-l-4 border-green-500"
                            : "bg-red-50 border-l-4 border-red-500"
                        }`}>
                        <h4 className="font-bold mb-1">
                            {answeredCorrectly
                                ? "Correct! Well done."
                                : "Not quite right."
                            }
                        </h4>

                        <p className="mb-2">
                            The correct answer is <span className="font-bold">{currentQuestion.correctAnswer}</span>: {currentQuestion.options[currentQuestion.correctAnswer]}
                        </p>

                        {currentQuestion.explanation && (
                            <div className="mt-2">
                                <h4 className="font-bold mb-1">Explanation:</h4>
                                <p>{currentQuestion.explanation}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Add the ExplanationGenerator component right after the existing explanation */}
                {showingAnswer && (
                    <ExplanationGenerator
                        question={currentQuestion}
                        isVisible={showingAnswer}
                    />
                )}

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
                        disabled={!selectedOption}
                    >
                        {!selectedOption ? 'Select an Answer' : 'Check Answer'}
                    </button>
                ) : (
                    <button
                        onClick={handleNextQuestion}
                        className="btn btn-primary"
                    >
                        {currentQuestionIndex >= currentStudySession.length - 1 ? 'Finish' : 'Next Question'}
                    </button>
                )}
            </div>

            {showingAnswer && (
                <div className="flex flex-col space-y-2 mt-6">
                    <p className="text-center text-sm text-gray-600 mb-2">How difficult was this for you?</p>
                    <div className="flex justify-between gap-2">
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
                </div>
            )}

            {/* Mini session stats */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-sm text-gray-700 mb-2">Session Progress</h4>
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                        <div className="text-lg font-bold text-primary">{sessionStats.questionsAnswered}</div>
                        <div className="text-xs text-gray-600">Answered</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-success">{sessionStats.correctAnswers}</div>
                        <div className="text-xs text-gray-600">Correct</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-primary">{sessionStats.accuracy}%</div>
                        <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                </div>

                {/* Recent performance indicator */}
                {userStats.recentPerformance && userStats.recentPerformance.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">Recent Performance:</div>
                        <div className="flex space-x-1">
                            {userStats.recentPerformance.map((item, index) => (
                                <div
                                    key={index}
                                    className={`flex-grow h-2 ${item.isCorrect ? 'bg-success' : 'bg-danger'} rounded`}
                                ></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyPage;