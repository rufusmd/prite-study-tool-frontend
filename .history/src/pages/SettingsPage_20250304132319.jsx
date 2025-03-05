// src/pages/SettingsPage.jsx
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { QuestionContext } from '../contexts/QuestionContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../utils/api';

const SettingsPage = () => {
    const { user, logout, updateUserProfile } = useContext(AuthContext);
    const { clearLocalData } = useContext(QuestionContext);
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        pgyLevel: '',
        displayName: ''
    });
    const [preferences, setPreferences] = useState({
        nightMode: false,
        showExplanations: true,
        questionsPerSession: 20,
        notificationsEnabled: true
    });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const navigate = useNavigate();

    // Load user profile and preferences
    useEffect(() => {
        if (user) {
            setProfile({
                username: user.username || '',
                email: user.email || '',
                pgyLevel: user.pgyLevel || '',
                displayName: user.displayName || ''
            });

            // Load preferences from localStorage
            const savedPreferences = localStorage.getItem('userPreferences');
            if (savedPreferences) {
                try {
                    setPreferences(JSON.parse(savedPreferences));
                } catch (error) {
                    console.error('Error parsing saved preferences:', error);
                }
            }
        }
    }, [user]);

    // Save preferences to localStorage
    const savePreferences = () => {
        try {
            localStorage.setItem('userPreferences', JSON.stringify(preferences));
            return true;
        } catch (error) {
            console.error('Error saving preferences:', error);
            return false;
        }
    };

    // Handle profile update
    const handleProfileUpdate = async () => {
        try {
            setLoading(true);

            // Make an API call to update the user profile
            const response = await api.put('/users/profile', profile);

            if (response.data && response.data.success) {
                setAlert({
                    type: 'success',
                    message: 'Profile updated successfully'
                });

                // Update the user context
                if (updateUserProfile) {
                    updateUserProfile(response.data.user);
                }
            } else {
                throw new Error(response.data?.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to update profile'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle preferences update
    const handlePreferencesUpdate = () => {
        if (savePreferences()) {
            setAlert({
                type: 'success',
                message: 'Preferences saved successfully'
            });
        } else {
            setAlert({
                type: 'error',
                message: 'Failed to save preferences'
            });
        }
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        clearLocalData();
        navigate('/login');
    };

    // Handle profile field changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle preference changes
    const handlePreferenceChange = (name, value) => {
        setPreferences(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="pb-20">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                    className="mb-4"
                />
            )}

            {/* Profile Section */}
            <div className="card mb-6">
                <h3 className="text-lg font-bold mb-4 p-4 border-b">User Profile</h3>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={profile.username}
                            onChange={handleProfileChange}
                            className="w-full p-2 border rounded-md bg-gray-50"
                            disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={profile.email}
                            onChange={handleProfileChange}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Display Name</label>
                        <input
                            type="text"
                            name="displayName"
                            value={profile.displayName}
                            onChange={handleProfileChange}
                            className="w-full p-2 border rounded-md"
                            placeholder="Enter your display name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">PGY Level</label>
                        <select
                            name="pgyLevel"
                            value={profile.pgyLevel}
                            onChange={handleProfileChange}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Select PGY Level</option>
                            <option value="1">PGY-1</option>
                            <option value="2">PGY-2</option>
                            <option value="3">PGY-3</option>
                            <option value="4">PGY-4</option>
                            <option value="5">PGY-5</option>
                            <option value="6+">PGY-6+</option>
                            <option value="Fellow">Fellow</option>
                            <option value="Attending">Attending</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <button
                        onClick={handleProfileUpdate}
                        className="w-full p-2 bg-primary text-white rounded-md flex justify-center items-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="small" className="mr-2" />
                                Saving...
                            </>
                        ) : (
                            'Save Profile'
                        )}
                    </button>
                </div>
            </div>

            {/* App Preferences Section */}
            <div className="card mb-6">
                <h3 className="text-lg font-bold mb-4 p-4 border-b">App Preferences</h3>

                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Dark Mode</label>
                        <div className="relative inline-block w-12 align-middle select-none">
                            <input
                                type="checkbox"
                                name="nightMode"
                                id="nightMode"
                                checked={preferences.nightMode}
                                onChange={(e) => handlePreferenceChange('nightMode', e.target.checked)}
                                className="absolute block w-6 h-6 bg-white border-4 rounded-full appearance-none cursor-pointer"
                                style={{
                                    top: '0',
                                    left: preferences.nightMode ? '50%' : '0',
                                    transition: 'left 0.2s ease-in-out'
                                }}
                            />
                            <label
                                htmlFor="nightMode"
                                className={`block h-6 overflow-hidden rounded-full cursor-pointer ${preferences.nightMode ? 'bg-primary' : 'bg-gray-300'
                                    }`}
                            ></label>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Show Explanations After Answer</label>
                        <div className="relative inline-block w-12 align-middle select-none">
                            <input
                                type="checkbox"
                                name="showExplanations"
                                id="showExplanations"
                                checked={preferences.showExplanations}
                                onChange={(e) => handlePreferenceChange('showExplanations', e.target.checked)}
                                className="absolute block w-6 h-6 bg-white border-4 rounded-full appearance-none cursor-pointer"
                                style={{
                                    top: '0',
                                    left: preferences.showExplanations ? '50%' : '0',
                                    transition: 'left 0.2s ease-in-out'
                                }}
                            />
                            <label
                                htmlFor="showExplanations"
                                className={`block h-6 overflow-hidden rounded-full cursor-pointer ${preferences.showExplanations ? 'bg-primary' : 'bg-gray-300'
                                    }`}
                            ></label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Questions Per Study Session</label>
                        <select
                            value={preferences.questionsPerSession}
                            onChange={(e) => handlePreferenceChange('questionsPerSession', parseInt(e.target.value))}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="10">10 questions</option>
                            <option value="20">20 questions</option>
                            <option value="30">30 questions</option>
                            <option value="50">50 questions</option>
                            <option value="100">100 questions</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Enable Notifications</label>
                        <div className="relative inline-block w-12 align-middle select-none">
                            <input
                                type="checkbox"
                                name="notificationsEnabled"
                                id="notificationsEnabled"
                                checked={preferences.notificationsEnabled}
                                onChange={(e) => handlePreferenceChange('notificationsEnabled', e.target.checked)}
                                className="absolute block w-6 h-6 bg-white border-4 rounded-full appearance-none cursor-pointer"
                                style={{
                                    top: '0',
                                    left: preferences.notificationsEnabled ? '50%' : '0',
                                    transition: 'left 0.2s ease-in-out'
                                }}
                            />
                            <label
                                htmlFor="notificationsEnabled"
                                className={`block h-6 overflow-hidden rounded-full cursor-pointer ${preferences.notificationsEnabled ? 'bg-primary' : 'bg-gray-300'
                                    }`}
                            ></label>
                        </div>
                    </div>

                    <button
                        onClick={handlePreferencesUpdate}
                        className="w-full p-2 bg-primary text-white rounded-md"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>

            {/* Account Actions Section */}
            <div className="card mb-6">
                <h3 className="text-lg font-bold mb-4 p-4 border-b">Account Actions</h3>

                <div className="p-4 space-y-4">
                    <button
                        onClick={handleLogout}
                        className="w-full p-2 bg-red-500 text-white rounded-md"
                    >
                        Log Out
                    </button>

                    <button
                        onClick={() => {
                            const confirmed = window.confirm("This will delete all your local data but keep your account. Are you sure?");
                            if (confirmed) {
                                clearLocalData();
                                setAlert({
                                    type: 'success',
                                    message: 'Local data cleared successfully'
                                });
                            }
                        }}
                        className="w-full p-2 border border-yellow-500 text-yellow-500 rounded-md"
                    >
                        Clear Local Data
                    </button>
                </div>
            </div>

            {/* App Info Section */}
            <div className="card">
                <h3 className="text-lg font-bold mb-4 p-4 border-b">App Information</h3>

                <div className="p-4">
                    <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Version:</span> 1.0.0
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Build:</span> 2024.03.04
                    </p>
                    <p className="text-sm text-gray-600">
                        PRITE Study Tool Mobile is a collaborative flashcard system for PRITE exam preparation.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;