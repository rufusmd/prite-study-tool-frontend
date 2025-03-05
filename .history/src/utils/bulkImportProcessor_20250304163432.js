// src/utils/bulkImportProcessor.js
import { detectDuplicates, mergeQuestions } from './duplicateDetection';

/**
 * Processes a batch of questions for import, detecting duplicates
 * @param {Array} questions - Array of questions to import
 * @param {Array} existingQuestions - Existing questions to check against
 * @param {Object} options - Configuration options
 * @returns {Object} Processing results with duplicates and non-duplicates
 */
export const processBulkImport = async (questions, existingQuestions, options = {}) => {
    const defaults = {
        batchSize: 20,         // Number of questions to process in each batch
        dupThreshold: 0.7,     // Similarity threshold for duplicates
        checkAcrossParts: false, // Whether to check for duplicates across different parts
        onProgress: null       // Progress callback function
    };

    const config = { ...defaults, ...options };
    const duplicates = [];
    const nonDuplicates = [];

    // Validate inputs
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return { duplicates, nonDuplicates };
    }

    if (!existingQuestions || !Array.isArray(existingQuestions)) {
        // If no existing questions, all are non-duplicates
        return { duplicates, nonDuplicates: [...questions] };
    }

    // Process in batches to prevent UI freezing
    const totalQuestions = questions.length;
    let processedCount = 0;

    // Process batches
    for (let i = 0; i < totalQuestions; i += config.batchSize) {
        const batch = questions.slice(i, i + config.batchSize);

        // Find duplicates in the current batch
        const duplicateResults = findDuplicates(batch, existingQuestions, {
            similarityThreshold: config.dupThreshold,
            checkMetadataOnly: !config.checkAcrossParts
        });

        // Separate duplicates from non-duplicates
        const batchDuplicateIds = duplicateResults.map(d => d.newQuestion._id);

        // Add duplicates to the duplicates array
        duplicates.push(...duplicateResults);

        // Add non-duplicates to the non-duplicates array
        const batchNonDuplicates = batch.filter(q =>
            !batchDuplicateIds.includes(q._id)
        );
        nonDuplicates.push(...batchNonDuplicates);

        processedCount += batch.length;

        // Update progress if callback provided
        if (config.onProgress && typeof config.onProgress === 'function') {
            const progress = Math.round((processedCount / totalQuestions) * 100);
            config.onProgress(progress);
        }

        // Allow UI to update by yielding execution
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    return { duplicates, nonDuplicates };
};

/**
 * Resolves duplicates according to the provided strategies
 * @param {Array} duplicates - Array of duplicate question objects
 * @param {Array} existingQuestions - Array of existing questions
 * @param {Object} resolutions - Resolution strategies for each duplicate
 * @returns {Array} Processed and merged questions
 */
export const resolveDuplicates = (duplicates, existingQuestions, resolutions) => {
    if (!duplicates || !Array.isArray(duplicates) || duplicates.length === 0) {
        return [];
    }

    const processedQuestions = [];

    duplicates.forEach((duplicate, index) => {
        const resolution = resolutions[index];

        if (!resolution) {
            // If no resolution specified, skip this duplicate
            return;
        }

        // Find the matching existing question
        const existingQuestion = duplicate.matches[0]?.question;

        if (!existingQuestion) {
            // If no match found (shouldn't happen), add as new
            processedQuestions.push(duplicate.newQuestion);
            return;
        }

        // Process according to resolution strategy
        switch (resolution.strategy) {
            case 'newer':
            case 'metadata':
            case 'manual':
                const mergedQuestion = mergeQuestions(
                    existingQuestion,
                    duplicate.newQuestion,
                    resolution.strategy,
                    resolution.manualSelections
                );

                // Add the merged question
                processedQuestions.push(mergedQuestion);
                break;

            case 'keepBoth':
                // Just add the new question as-is
                processedQuestions.push(duplicate.newQuestion);
                break;

            case 'skip':
                // Skip this question entirely
                break;

            default:
                // Default to keeping both
                processedQuestions.push(duplicate.newQuestion);
        }
    });

    return processedQuestions;
};

/**
 * Checks for duplicate questions in a new batch against existing questions
 * @param {Array} newQuestions - New questions to check
 * @param {Array} existingQuestions - Existing questions database
 * @returns {Object} Object with duplicateCount and duplicateQuestions
 */
export const checkDuplicates = (newQuestions, existingQuestions) => {
    if (!newQuestions || !Array.isArray(newQuestions) || newQuestions.length === 0) {
        return { duplicateCount: 0, duplicateQuestions: [] };
    }

    if (!existingQuestions || !Array.isArray(existingQuestions) || existingQuestions.length === 0) {
        return { duplicateCount: 0, duplicateQuestions: [] };
    }

    const duplicateResults = findDuplicates(newQuestions, existingQuestions);

    return {
        duplicateCount: duplicateResults.length,
        duplicateQuestions: duplicateResults
    };
};

/**
 * Apply a single resolution strategy to all duplicates
 * @param {Array} duplicates - Array of duplicate question objects
 * @param {String} strategy - Resolution strategy ('newer', 'metadata', 'keepBoth', 'skip')
 * @returns {Array} Array of resolutions to apply
 */
export const generateBulkResolution = (duplicates, strategy) => {
    if (!duplicates || !Array.isArray(duplicates)) {
        return [];
    }

    return duplicates.map(() => ({
        strategy,
        manualSelections: {} // Empty since we're not doing manual merges
    }));
};