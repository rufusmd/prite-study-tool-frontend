// src/pages/HomePage.jsx
import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QuestionContext } from '../contexts/QuestionContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PRITE_CATEGORIES } from '../constants/categories';

const HomePage = () => {
    const { dueQuestions, questions, loading } = useContext(QuestionContext);
    const [alert, setAlert] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        due: 0,
        mastered: 0,
        byCategory: {}
    });

    // Calculate stats
    useEffect(() => {
        if (questions.length > 0) {
            const mastered = questions.filter(q => {
                const userData = q.studyData?.find(data => data.user === q.creator);
                return userData?.easeFactor > 2.5;
            }).length;

            // Calculate stats by category
            const categoryStats = {};

            // Initialize all predefined categories
            PRITE_CATEGORIES.forEach(cat => {
                categoryStats[cat] = {
                    total: 0,
                    mastered: 0,
                    due: 0
                };
            });

            // Count questions by category
            questions.forEach(q => {
                const category = q.category || "Uncategorized";

                // Initialize category if it doesn't exist
                if (!categoryStats[category]) {
                    categoryStats[category] = {
                        total: 0,
                        mastered: 0,
                        due: 0
                    };
                }

                // Increment total count
                categoryStats[category].total += 1;

                // Check if mastered
                const userData = q.studyData?.find(data => data.user === q.creator);
                if (userData?.easeFactor > 2.5) {
                    categoryStats[category].mastered += 1;
                }
            });

            // Count due questions by category
            dueQuestions.forEach(dueQ => {
                const question = questions.find(q => q._id === dueQ._id);
                if (question) {
                    const category = question.category || "Uncategorized";
                    if (categoryStats[category]) {
                        categoryStats[category].due += 1;
                    }
                }
            });

            setStats({
                total: questions.length,
                due: dueQuestions.length,
                mastered,
                byCategory: categoryStats
            });
        }
    }, [questions, dueQuestions]);

    // Get top 3 categories with most questions (for display)
    const topCategories = Object.entries(stats.byCategory)
        .filter(([_, data]) => data.total > 0)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 3);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card p-4 flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Total Questions</h3>
                    <p className="text-3xl font-bold text-primary mt-2">{stats.total}</p>
                </div>

                <div className="card p-4 flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Due Today</h3>
                    <p className="text-3xl font-bold text-warning mt-2">{stats.due}</p>
                </div>
            </div>

            <div className="card mb-6">
                <h3 className="text-lg font-bold mb-2">Study Progress</h3>
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                                Mastery
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-primary">
                                {stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div
                            style={{ width: `${stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                        ></div>
                    </div>
                </div>
            </div>

            {/* Category Stats */}
            <div className="card mb-6">
                <h3 className="text-lg font-bold mb-4">Category Progress</h3>

                {topCategories.length > 0 ? (
                    <div className="space-y-4">
                        {topCategories.map(([category, data]) => (
                            <div key={category}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">{category}</span>
                                    <span className="text-xs text-gray-500">
                                        {data.total} questions
                                        {data.due > 0 && ` • ${data.due} due`}
                                    </span>
                                </div>
                                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                                    <div
                                        style={{ width: `${data.total > 0 ? (data.mastered / data.total) * 100 : 0}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-success"
                                    ></div>
                                </div>
                                <div className="text-xs text-gray-500 text-right">
                                    {data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0}% mastered
                                </div>
                            </div>
                        ))}

                        <Link to="/browse" className="text-sm text-primary font-medium block text-center mt-4">
                            View all categories →
                        </Link>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">
                        Add questions to see category statistics
                    </p>
                )}
            </div>

            <div className="card mb-6">
                <h3 className="text-lg font-bold mb-4">Ready to Study?</h3>
                <p className="text-gray-600 mb-4">
                    You have {stats.due} questions due for review today.
                </p>
                <Link
                    to="/study"
                    className="btn btn-primary w-full block text-center"
                >
                    Start Studying
                </Link>
            </div>

            <div className="card">
                <h3 className="text-lg font-bold mb-4">Capture New Questions</h3>
                <p className="text-gray-600 mb-4">
                    Use your camera to capture and add new questions.
                </p>
                <Link
                    to="/capture"
                    className="btn btn-secondary w-full block text-center"
                >
                    Capture Questions
                </Link>
            </div>
        </div>
    );
};

export default HomePage;