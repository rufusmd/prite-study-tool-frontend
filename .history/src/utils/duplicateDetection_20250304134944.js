// src/utils/duplicateDetection.js
import stringSimilarity from 'string-similarity';

/**
 * Utility functions for detecting and managing duplicate questions
 */

/**
 * Calculate similarity score between two questions
 * @param {Object} questionA - First question to compare
 * @param {Object} questionB - Second question to compare
 * @returns {Object} Similarity score and reasons
 */
export const calculateSimilarity = (questionA, questionB) => {
    const results = {
        isSimilar: false,
        isDuplicate: false,
        score: 0,
        reasons: [],
        mergeStrategy: null
    };

    // Check for exact metadata match (same part, year, and number)
    if (
        questionA.part === questionB.part &&
        questionA.year === questionB.year &&
        questionA.number === questionB.number &&
        questionA.number !== '' &&
        questionB.number !== ''
    ) {
        results.isDuplicate = true;
        results.isSimilar = true;
        results.score = 1.0;
        results.reasons.push('Exact metadata match: same part, year, and question number');
        results.mergeStrategy = 'metadata';
        return results;
    }

    // Calculate text similarity score
    const textSimilarity = stringSimilarity.compareTwoStrings(
        questionA.text.toLowerCase().trim(),
        questionB.text.toLowerCase().trim()
    );

    // Check options similarity
    let optionsSimilaritySum = 0;
    let optionCount = 0;

    // Compare each option
    for (const letter of ['A', 'B', 'C', 'D', 'E']) {
        const optionA = questionA.options[letter];
        const optionB = questionB.options[letter];

        if (optionA && optionB) {
            const optionSimilarity = stringSimilarity.compareTwoStrings(
                optionA.toLowerCase().trim(),
                optionB.toLowerCase().trim()
            );
            optionsSimilaritySum += optionSimilarity;
            optionCount++;
        }
    }

    // Calculate average options similarity if options exist
    const optionsSimilarity = optionCount > 0 ? optionsSimilaritySum / optionCount : 0;

    // Calculate overall similarity score (weighted)
    // Text similarity has higher weight (0.6) than options similarity (0.4)
    results.score = textSimilarity * 0.6 + optionsSimilarity * 0.4;

    // Determine if questions are similar or duplicates based on thresholds
    if (results.score > 0.9) {
        results.isDuplicate = true;
        results.isSimilar = true;
        results.reasons.push(`Extremely high text similarity (${(textSimilarity * 100).toFixed(1)}%)`);
        results.reasons.push(`Extremely high options similarity (${(optionsSimilarity * 100).toFixed(1)}%)`);
        results.mergeStrategy = 'newer';
    } else if (results.score > 0.75) {
        results.isSimilar = true;
        results.reasons.push(`High text similarity (${(textSimilarity * 100).toFixed(1)}%)`);
        results.reasons.push(`High options similarity (${(optionsSimilarity * 100).toFixed(1)}%)`);
        results.mergeStrategy = 'manual';
    }

    // Additional checks
    if (
        questionA.part === questionB.part &&
        questionA.year === questionB.year &&
        textSimilarity > 0.5
    ) {
        results.isSimilar = true;
        results.reasons.push('Same part and year with moderate text similarity');
        if (!results.mergeStrategy) {
            results.mergeStrategy = 'manual';
        }
    }

    return results;
};

/**
 * Find potential duplicates in a collection of questions
 * @param {Array} newQuestions - Array of new questions to check
 * @param {Array} existingQuestions - Array of existing questions to check against
 * @param {Object} options - Configuration options
 * @returns {Array} Array of duplicate/similar question results
 */
export const findDuplicates = (newQuestions, existingQuestions, options = {}) => {
    const {
        similarityThreshold = 0.75,
        maxResults = 5,
        checkMetadataOnly = false
    } = options;

    const duplicateResults = [];

    // Check each new question against existing questions
    for (const newQuestion of newQuestions) {
        const questionMatches = [];

        for (const existingQuestion of existingQuestions) {
            // Skip comparing with itself (by id)
            if (newQuestion._id && existingQuestion._id &&
                newQuestion._id === existingQuestion._id) {
                continue;
            }

            // Quick metadata check first (optimization)
            if (
                newQuestion.part === existingQuestion.part &&
                newQuestion.year === existingQuestion.year &&
                newQuestion.number === existingQuestion.number &&
                newQuestion.number !== '' &&
                existingQuestion.number !== ''
            ) {
                questionMatches.push({
                    question: existingQuestion,
                    similarity: calculateSimilarity(newQuestion, existingQuestion)
                });
                continue;
            }

            // Skip full text comparison if only checking metadata
            if (checkMetadataOnly) continue;

            // Do full similarity check
            const similarity = calculateSimilarity(newQuestion, existingQuestion);

            if (similarity.score >= similarityThreshold) {
                questionMatches.push({
                    question: existingQuestion,
                    similarity
                });
            }
        }

        // Sort matches by similarity score (highest first)
        questionMatches.sort((a, b) => b.similarity.score - a.similarity.score);

        // Take top matches up to maxResults
        if (questionMatches.length > 0) {
            duplicateResults.push({
                newQuestion,
                matches: questionMatches.slice(0, maxResults)
            });
        }
    }

    return duplicateResults;
};

/**
 * Merge two questions based on a strategy
 * @param {Object} primary - Primary question (source of truth)
 * @param {Object} secondary - Secondary question (to merge from)
 * @param {String} strategy - Merge strategy (newer, metadata, manual, keepBoth)
 * @param {Object} manualSelections - For manual strategy, field-level selections
 * @returns {Object} Merged question
 */
export const mergeQuestions = (primary, secondary, strategy = 'newer', manualSelections = {}) => {
    // Make copies to avoid modifying originals
    const primaryCopy = { ...primary };
    const secondaryCopy = { ...secondary };

    switch (strategy) {
        case 'newer':
            // Use the newer question (by createdAt) as the primary source
            const primaryDate = new Date(primary.createdAt || 0);
            const secondaryDate = new Date(secondary.createdAt || 0);

            if (secondaryDate > primaryDate) {
                // Swap if secondary is newer
                return {
                    ...secondaryCopy,
                    _id: primaryCopy._id, // Keep primary ID
                    creator: primaryCopy.creator, // Keep primary creator
                    studyData: [...(primaryCopy.studyData || []), ...(secondaryCopy.studyData || [])]
                };
            } else {
                return {
                    ...primaryCopy,
                    studyData: [...(primaryCopy.studyData || []), ...(secondaryCopy.studyData || [])]
                };
            }

        case 'metadata':
            // Use primary question but ensure metadata is consistent
            return {
                ...primaryCopy,
                part: primaryCopy.part || secondaryCopy.part,
                year: primaryCopy.year || secondaryCopy.year,
                number: primaryCopy.number || secondaryCopy.number,
                category: primaryCopy.category || secondaryCopy.category,
                studyData: [...(primaryCopy.studyData || []), ...(secondaryCopy.studyData || [])]
            };

        case 'manual':
            // Use field-by-field selections as specified
            const merged = { ...primaryCopy };

            for (const [field, useSecondary] of Object.entries(manualSelections)) {
                if (useSecondary && field !== '_id' && field !== 'creator') {
                    if (field === 'options') {
                        merged.options = { ...primaryCopy.options };

                        // For options, we need to check each option individually
                        for (const letter of ['A', 'B', 'C', 'D', 'E']) {
                            if (manualSelections[`option${letter}`]) {
                                merged.options[letter] = secondaryCopy.options[letter];
                            }
                        }
                    } else if (field === 'studyData') {
                        // Merge study data from both
                        merged.studyData = [...(primaryCopy.studyData || []), ...(secondaryCopy.studyData || [])];
                    } else {
                        merged[field] = secondaryCopy[field];
                    }
                }
            }

            return merged;

        case 'keepBoth':
        default:
            // No merge, return primary unchanged
            return primaryCopy;
    }
};

/**
 * Process a batch of questions, detecting and handling duplicates
 * @param {Array} newQuestions - New questions to process
 * @param {Array} existingQuestions - Existing questions to check against
 * @param {Function} onDuplicatesFound - Callback when duplicates are found
 * @param {String} defaultStrategy - Default strategy for handling duplicates
 * @returns {Object} Processing results
 */
export const processBatchWithDuplicateDetection = async (
    newQuestions,
    existingQuestions,
    onDuplicatesFound,
    defaultStrategy = 'newer'
) => {
    const duplicates = findDuplicates(newQuestions, existingQuestions);

    // If no duplicates, return all questions as clean
    if (duplicates.length === 0) {
        return {
            clean: newQuestions,
            duplicates: [],
            merged: []
        };
    }

    // Get list of questions with duplicates
    const duplicateQuestions = duplicates.map(d => d.newQuestion);

    // Get clean questions (those without duplicates)
    const cleanQuestions = newQuestions.filter(
        q => !duplicateQuestions.some(dq => dq._id === q._id)
    );

    // If a callback is provided, call it with duplicates
    if (onDuplicatesFound && typeof onDuplicatesFound === 'function') {
        await onDuplicatesFound(duplicates);

        // Return early as the callback will handle the duplicates
        return {
            clean: cleanQuestions,
            duplicates,
            merged: []
        };
    }

    // Otherwise, auto-process with the default strategy
    const mergedQuestions = [];

    for (const duplicate of duplicates) {
        const { newQuestion, matches } = duplicate;

        // Get best match (highest similarity)
        const bestMatch = matches[0];

        // Merge using default strategy
        const merged = mergeQuestions(
            bestMatch.question,
            newQuestion,
            bestMatch.similarity.mergeStrategy || defaultStrategy
        );

        mergedQuestions.push(merged);
    }

    return {
        clean: cleanQuestions,
        duplicates,
        merged: mergedQuestions
    };
};