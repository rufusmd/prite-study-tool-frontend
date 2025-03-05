// src/pages/ImportPage.jsx
import { useState } from 'react';
import BulkImport from '../components/import/BulkImport';

const ImportPage = () => {
    const [activeTab, setActiveTab] = useState('bulk'); // 'bulk', 'anki', 'expert'

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Import Questions</h2>

            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 ${activeTab === 'bulk' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('bulk')}
                >
                    Bulk Import
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'anki' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('anki')}
                >
                    Anki Import
                </button>
            </div>

            {activeTab === 'bulk' && <BulkImport />}

            {activeTab === 'anki' && (
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">Anki Import</h3>
                    <p className="text-gray-600 mb-4">
                        This feature is coming soon. You will be able to import questions from Anki deck files (.apkg).
                    </p>
                    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <p className="mt-2 text-gray-500">Anki Import Feature Coming Soon</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportPage;