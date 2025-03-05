// src/pages/SettingsPage.jsx
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { QuestionContext } from '../contexts/QuestionContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PriteScoreHistory from '../components/stats/PriteScoreHistory';
import api from '../utils/api';

const SettingsPage = () => {
    const { user, logout, updateUserProfile } = useContext(AuthContext);
    const { clearLocalData } = useContext(QuestionContext);
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        pgyLevel: '',
        specialty: '',
        institution: '',
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
                specialty: user.specialty || '',
                institution: user.institution || '',
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

            {/* Settings Tabs */}
            <div className="mb-6 border-b">
                <div className="flex overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 font-medium ${activeTab === 'profile'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Profile
                    </button>

                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={`px-4 py-2 font-medium ${activeTab === 'preferences'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Preferences
                    </button>

                    <button
                        onClick={() => setActiveTab('prite-scores')}
                        className={`px-4 py-2 font-medium ${activeTab === 'prite-scores'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        PRITE Scores
                    </button>

                    <button
                        onClick={() => setActiveTab('account')}
                        className={`px-4 py-2 font-medium ${activeTab === 'account'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Account
                    </button>
                </div>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="card p-4">
                    <h3 className="text-lg font-bold mb-4">User Profile</h3>

                    <div className="space-y-4">
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

                        <div>
                            <label className="block text-sm font-medium mb-1">Specialty</label>
                            <select
                                name="specialty"
                                value={profile.specialty}
                                onChange={handleProfileChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="">Select Specialty</option>
                                <option value="Psychiatry">Psychiatry</option>
                                <option value="Psychiatry/Neurology">Psychiatry/Neurology</option>
                                <option value="Child Psychiatry">Child Psychiatry</option>
                                <option value="Addiction Psychiatry">Addiction Psychiatry</option>
                                <option value="Forensic Psychiatry">Forensic Psychiatry</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Institution</label>
                            <input
                                type="text"
                                name="institution"
                                value={profile.institution}
                                onChange={handleProfileChange}
                                className="w-full p-2 border rounded-md"
                                placeholder="Your training institution"
                            />
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
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
                <div className="card p-4">
                    <h3 className="text-lg font-bold mb-4">App Preferences</h3>

                    <div className="space-y-4">
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

                        <div>
                            <label className="block text-sm font-medium mb-1">Questions Per Study Session</label>
                            <select
                                value={preferences.questionsPerSession}
                                onChange={(e) => handlePreferenceChange('questionsPerSession', parseInt(e.target.value))}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value={10}>10 questions</option>
                                <option value={20}>20 questions</option>
                                <option value={30}>30 questions</option>
                                <option value={50}>50 questions</option>
                                <option value={100}>100 questions</option>
                            </select>
                        </div>

                        <button
                            onClick={handlePreferencesUpdate}
                            className="w-full p-2 bg-primary text-white rounded-md"
                        >
                            Save Preferences
                        </button>
                    </div>
                </div>
            )}

            {/* PRITE Scores Tab */}
            {activeTab === 'prite-scores' && (
                <div className="card p-4">
                    <PriteScoreHistory />
                </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
                <div className="card p-4">
                    <h3 className="text-lg font-bold mb-4">Account Settings</h3>

                    <div className="space-y-6">
                        <div>
                            <h4 className="font-medium mb-2">Data Management</h4>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-4">
                                    Manage your study data and question contributions.
                                </p>

                                <div className="space-y-2">
                                    <button className="w-full p-2 border border-gray-300 rounded-md text-left flex items-center hover:bg-gray-100">
                                        <svg className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
                                        </svg>
                                        Export Study Data
                                    </button>

                                    <button className="w-full p-2 border border-gray-300 rounded-md text-left flex items-center hover:bg-gray-100">
                                        <svg className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" />
                                        </svg>
                                        Export My Questions
                                    </button>

                                    <button className="w-full p-2 border border-gray-300 rounded-md text-left flex items-center hover:bg-gray-100">
                                        <svg className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Reset Study Progress
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Privacy</h4>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="font-medium">Share Anonymous Usage Data</p>
                                        <p className="text-xs text-gray-500">
                                            Help improve the app by sharing anonymous usage statistics
                                        </p>
                                    </div>
                                    <div className="relative inline-block w-12 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            id="shareData"
                                            checked={true}
                                            className="absolute block w-6 h-6 bg-white border-4 rounded-full appearance-none cursor-pointer"
                                            style={{
                                                top: '0',
                                                left: '50%',
                                                transition: 'left 0.2s ease-in-out'
                                            }}
                                        />
                                        <label
                                            htmlFor="shareData"
                                            className="block h-6 overflow-hidden rounded-full cursor-pointer bg-primary"
                                        ></label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Public Profile</p>
                                        <p className="text-xs text-gray-500">
                                            Make your contributions visible to other users
                                        </p>
                                    </div>
                                    <div className="relative inline-block w-12 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            id="publicProfile"
                                            checked={false}
                                            className="absolute block w-6 h-6 bg-white border-4 rounded-full appearance-none cursor-pointer"
                                            style={{
                                                top: '0',
                                                left: '0',
                                                transition: 'left 0.2s ease-in-out'
                                            }}
                                        />
                                        <label
                                            htmlFor="publicProfile"
                                            className="block h-6 overflow-hidden rounded-full cursor-pointer bg-gray-300"
                                        ></label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Account Actions</h4>
                            <div className="space-y-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full p-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 flex items-center justify-center"
                                >
                                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Log Out
                                </button>

                                <button className="w-full p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-md flex items-center justify-center">
                                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;