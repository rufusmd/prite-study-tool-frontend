// src/contexts/QuestionContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { questionApi } from '../api';
import { AuthContext } from './AuthContext';
import { PRITE_CATEGORIES } from '../constants/categories';

export const QuestionContext = createContext();

export const QuestionProvider = ({ children }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const [questions, setQuestions] = useState([]);
    const [dueQuestions, setDueQuestions] = useState([]);
    const [currentStudySession, setCurrentStudySession] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [categoryStats, setCategoryStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load questions when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadQuestions();
        }
    }, [isAuthenticated]);

    // Calculate category statistics whenever questions change
    useEffect(() => {
        if (questions.length > 0) {
            calculateCategoryStats();
        }
    }, [questions, dueQuestions]);

    // Calculate statistics by category
    const calculateCategoryStats = () => {
        const stats = {};

        // Initialize all predefined categories
        PRITE_CATEGORIES.forEach(cat => {
            stats[cat] = {
                total: 0,
                mastered: 0,
                due: 0,
                accuracy: 0
            };
        });

        // Count questions by category
        questions.forEach(q => {
            const category = q.category || "Uncategorized";

            // Initialize category if it doesn't exist
            if (!stats[category]) {
                stats[category] = {
                    total: 0,
                    mastered: 0,
                    due: 0,
                    accuracy: 0
                };
            }

            // Increment total count
            stats[category].total += 1;

            // Check if mastered
            const userData = q.studyData?.find(data => data.user === q.creator);
            if (userData?.easeFactor > 2.5) {
                stats[category].mastered += 1;
            }
        });

        // Count due questions by category
        dueQuestions.forEach(dueQ => {
            const question = questions.find(q => q._id === dueQ._id);
            if (question) {
                const category = question.category || "Uncategorized";
                if (stats[category]) {
                    stats[category].due += 1;
                }
            }
        });

        // Calculate accuracy percentages
        Object.keys(stats).forEach(cat => {
            const { total, mastered } = stats[cat];
            stats[cat].accuracy = total > 0 ? Math.round((mastered / total) * 100) : 0;
        });

        setCategoryStats(stats);
    };

    // Load all questions
    const loadQuestions = async () => {
        setLoading(true);
        try {
            // Fetch all questions
            const questionsResponse = await questionApi.getQuestions();
            if (questionsResponse.success) {
                setQuestions(questionsResponse.data);
            }

            // Fetch due questions
            const dueResponse = await questionApi.getDueQuestions();
            if (dueResponse.success) {
                setDueQuestions(dueResponse.data);
            }
        } catch (err) {
            setError('Failed to load questions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Start a study session - can optionally filter by category
    const startStudySession = (categoryFilter = null) => {
        // Get due questions, optionally filtered by category
        let filteredQuestions = [...dueQuestions];

        if (categoryFilter) {
            filteredQuestions = dueQuestions.filter(dueQ => {
                const question = questions.find(q => q._id === dueQ._id);
                return question && question.category === categoryFilter;
            });
        }

        if (filteredQuestions.length === 0) {
            setError(categoryFilter
                ? `No questions due for review in the ${categoryFilter} category`
                : 'No questions due for review');
            return false;
        }

        // Create a copy and shuffle the array
        const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
        setCurrentStudySession(shuffled);
        setCurrentQuestionIndex(0);
        return true;
    };

    // Move to next question
    const nextQuestion = () => {
        if (currentQuestionIndex < currentStudySession.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            return true;
        }
        return false;
    };

    // Get questions by category
    const getQuestionsByCategory = (category) => {
        if (!category) return questions;
        return questions.filter(q => q.category === category);
    };

    // Get due questions by category
    const getDueQuestionsByCategory = (category) => {
        if (!category) return dueQuestions;

        return dueQuestions.filter(dueQ => {
            const question = questions.find(q => q._id === dueQ._id);
            return question && question.category === category;
        });
    };

    // Update study data for a question
    const updateStudyData = async (questionId, difficulty) => {
        setLoading(true);
        try {
            const response = await questionApi.updateStudyData(questionId, difficulty);
            if (response.success) {
                // Update the question in our state
                const updatedQuestions = questions.map(q =>
                    q._id === questionId ? response.data : q
                );
                setQuestions(updatedQuestions);
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError('Failed to update study data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Parse questions from OCR text
    const parseQuestions = async (ocrText, part) => {
        setLoading(true);
        const response = await questionApi.parseQuestions(ocrText, part);
        setLoading(false);
        return response;
    };

    // Add bulk questions
    const addBulkQuestions = async (questionsToAdd) => {
        setLoading(true);
        const response = await questionApi.createBulkQuestions(questionsToAdd);

        if (response.success) {
            // Reload questions to get the updated list
            await loadQuestions();
        }

        setLoading(false);
        return response;
    };

    // Get all category names
    const getAllCategories = () => {
        // Combine predefined categories with any custom ones from the data
        const usedCategories = [...new Set(questions
            .filter(q => q.category)
            .map(q => q.category))];

        return [...new Set([...PRITE_CATEGORIES, ...usedCategories])];
    };

    // Clear error state
    const clearError = () => setError(null);

    return (
        <QuestionContext.Provider
            value={{
                questions,
                dueQuestions,
                currentStudySession,
                currentQuestionIndex,
                categoryStats,
                loading,
                error,
                loadQuestions,
                startStudySession,
                nextQuestion,
                updateStudyData,
                parseQuestions,
                addBulkQuestions,
                getQuestionsByCategory,
                getDueQuestionsByCategory,
                getAllCategories,
                clearError
            }}
        >
            {children}
        </QuestionContext.Provider>
    );
};

export default QuestionContext;