// src/pages/SettingsPage.jsx
import { useState, useContext, useEffect } from 'react';
import { QuestionContext } from '../contexts/QuestionContext';
import { AuthContext } from '../contexts/AuthContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PRITE_CATEGORIES } from '../constants/categories';

const SettingsPage = () => {
    const { user } = useContext(AuthContext);
    const { categoryStats, loading } = useContext(QuestionContext);
    const [alert, setAlert] = useState(null);
    const [priorityCategories, setPriorityCategories] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Load user preferences (this would come from your API in a full implementation)
    useEffect(() => {
        // For now, just a mock implementation
        // In a real app, you'd fetch these from your backend
        setPriorityCategories(
            localStorage.getItem('priorityCategories')
                ? JSON.parse(localStorage.getItem('priorityCategories'))
                : []
        );
    }, [user]);

    const handleToggleCategory = (category) => {
        setPriorityCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(cat => cat !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleSavePreferences = () => {
        setIsSaving(true);

        try {
            // Save to localStorage for now
            // In a real app, you'd send this to your backend
            localStorage.setItem('priorityCategories', JSON.stringify(priorityCategories));

            setAlert({
                type: 'success',
                message: 'Your preferences have been saved'
            });
        } catch (error) {
            setAlert({
                type: 'error',
                message: 'Failed to save preferences'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Settings</h2>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="card mb-6">
                <h3 className="text-lg font-bold mb-4">PRITE Category Preferences</h3>
                <p className="text-gray-600 mb-4">
                    Select categories you want to prioritize in your study sessions.
                    Your performance in each category is shown to help you decide.
                </p>

                <div className="space-y-4 mb-6">
                    {PRITE_CATEGORIES.map(category => {
                        const stats = categoryStats[category] || { total: 0, mastered: 0, accuracy: 0 };
                        const isSelected = priorityCategories.includes(category);

                        return (
                            <div
                                key={category}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                                    }`}
                                onClick={() => handleToggleCategory(category)}
                            >
                                <div className="flex items-start">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => { }}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-grow">
                                        <div className="font-medium">{category}</div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {stats.total} questions • {stats.accuracy}% mastery
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={handleSavePreferences}
                    className="btn btn-primary w-full flex justify-center items-center"
                    disabled={isSaving}
                >
                    {isSaving ? <LoadingSpinner size="small" /> : 'Save Preferences'}
                </button>
            </div>

            <div className="card">
                <h3 className="text-lg font-bold mb-4">Account Information</h3>

                <div className="space-y-2">
                    <div>
                        <span className="text-gray-500">Username:</span>
                        <span className="ml-2">{user?.username}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2">{user?.email}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;