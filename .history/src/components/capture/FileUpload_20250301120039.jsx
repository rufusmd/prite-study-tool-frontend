// src/components/capture/FileUpload.jsx
import { useRef, useState } from 'react';
import { processImageFile } from '../../utils/ocr';

const FileUpload = ({ onUpload, onError }) => {
    const fileInputRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type
        if (!file.type.startsWith('image/')) {
            onError('Please select an image file');
            return;
        }

        // Process file
        setIsProcessing(true);

        try {
            const result = await processImageFile(file);

            if (result.success) {
                onUpload(result.text);
            } else {
                onError(result.error || 'Failed to process file');
            }
        } catch (error) {
            console.error('File processing error:', error);
            onError(error.message || 'An error occurred while processing the file');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
                Upload a photo of your PRITE questions
            </p>
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={handleClick}
                className="mt-4 btn btn-primary w-full flex items-center justify-center"
                disabled={isProcessing}
            >
                {isProcessing ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                    </>
                ) : (
                    'Select File'
                )}
            </button>
        </div>
    );
};

export default FileUpload;