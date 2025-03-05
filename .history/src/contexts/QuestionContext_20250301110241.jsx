// src/contexts/QuestionContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { questionApi } from '../api';
import { AuthContext } from './AuthContext';

export const QuestionContext = createContext();

export const QuestionProvider = ({ children }) => {
    const { isAuthenticated } = useContext(AuthContext);
    const [questions, setQuestions] = useState([]);
    const [dueQuestions, setDueQuestions] = useState([]);
    const [currentStudySession, setCurrentStudySession] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load questions when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadQuestions();
        }
    }, [isAuthenticated]);

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

    // Start a study session
    const startStudySession = () => {
        if (dueQuestions.length === 0) {
            setError('No questions due for review');
            return false;
        }

        // Create a copy and shuffle the array
        const shuffled = [...dueQuestions].sort(() => Math.random() - 0.5);
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

    // Clear error state
    const clearError = () => setError(null);

    return (
        <QuestionContext.Provider
            value={{
                questions,
                dueQuestions,
                currentStudySession,
                currentQuestionIndex,
                loading,
                error,
                loadQuestions,
                startStudySession,
                nextQuestion,
                updateStudyData,
                parseQuestions,
                addBulkQuestions,
                clearError
            }}
        >
            {children}
        </QuestionContext.Provider>
    );
};