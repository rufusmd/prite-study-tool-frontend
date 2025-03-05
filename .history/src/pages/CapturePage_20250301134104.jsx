// In src/pages/CapturePage.jsx
import TextPasteInput from '../components/capture/TextPasteInput';

// Then update the upload step
if (step === 'upload') {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Capture Questions</h2>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="card mb-4">
                <h3 className="text-lg font-bold mb-2">Recommended Workflow</h3>
                <ol className="list-decimal ml-4 text-gray-700">
                    <li className="mb-2">Scan your PRITE document with Microsoft Lens app</li>
                    <li className="mb-2">Use the "Document" mode for best results</li>
                    <li className="mb-2">Export as text or copy text from the PDF</li>
                    <li className="mb-2">Paste the text below</li>
                </ol>
            </div>

            <TextPasteInput
                onSubmit={handleCapturedText}
                isLoading={loading}
            />
        </div>
    );
}