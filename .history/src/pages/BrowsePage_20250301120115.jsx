// src/pages/BrowsePage.jsx
import { useState, useEffect, useContext } from 'react';
import { QuestionContext } from '../contexts/QuestionContext';
import { questionApi } from '../api';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BrowsePage = () => {
    const { questions, dueQuestions, loading } = useContext(QuestionContext);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        part: '',
        category: '',
        visibility: 'all'
    });
    const [alert, setAlert] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    // Set filtered questions on component mount
    useEffect(() => {
        setFilteredQuestions(questions);
    }, [questions]);

    // Get unique categories from questions
    const categories = [...new Set(questions.filter(q => q.category).map(q => q.category))];

    // Handle search
    const handleSearch = async () => {
        setIsSearching(true);

        try {
            const params = {
                text: searchQuery,
                ...filters
            };

            const response = await questionApi.searchQuestions(params);

            if (response.success) {
                setFilteredQuestions(response.data);
            } else {
                setAlert({
                    type: 'error',
                    message: response.error || 'Search failed'
                });
            }
        } catch (error) {
            setAlert({
                type: 'error',
                message: 'An error occurred while searching'
            });
        } finally {
            setIsSearching(false);
        }
    };

    // Update filter
    const updateFilter = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading && !isSearching) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Browse Questions</h2>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="card mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Search</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions..."
                        className="input"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Part</label>
                        <select
                            value={filters.part}
                            onChange={(e) => updateFilter('part', e.target.value)}
                            className="input"
                        >
                            <option value="">All Parts</option>
                            <option value="1">Part 1</option>
                            <option value="2">Part 2</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => updateFilter('category', e.target.value)}
                            className="input"
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleSearch}
                    className="btn btn-primary w-full flex justify-center items-center"
                    disabled={isSearching}
                >
                    {isSearching ? <LoadingSpinner size="small" /> : 'Search'}
                </button>
            </div>

            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Results ({filteredQuestions.length})</h3>
            </div>

            <div className="space-y-4 pb-16">
                {filteredQuestions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No questions found</p>
                ) : (
                    filteredQuestions.map((question) => {
                        const isDue = dueQuestions.some(q => q._id === question._id);

                        return (
                            <div
                                key={question._id}
                                className={`card ${isDue ? 'border-l-4 border-l-warning' : ''}`}
                            >
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        Part {question.part}
                                    </span>

                                    {question.category && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                            {question.category}
                                        </span>
                                    )}

                                    {question.isPublic && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                                            Public
                                        </span>
                                    )}

                                    {isDue && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger">
                                            Due
                                        </span>
                                    )}
                                </div>

                                <p className="mb-3">{question.text}</p>

                                <div className="space-y-1 mb-2">
                                    {Object.entries(question.options).map(([letter, text]) => (
                                        text && (
                                            <div
                                                key={letter}
                                                className={`text-sm py-1 ${letter === question.correctAnswer
                                                        ? 'text-success font-medium'
                                                        : 'text-gray-700'
                                                    }`}
                                            >
                                                <span className="font-bold">{letter}:</span> {text}
                                            </div>
                                        )
                                    ))}
                                </div>

                                {question.explanation && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        <div className="font-medium">Explanation:</div>
                                        <p>{question.explanation}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default BrowsePage;