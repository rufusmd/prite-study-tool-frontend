// src/utils/duplicateDetection.js
import stringSimilarity from 'string-similarity';

/**
 * Detects potential duplicate questions
 * @param {Object} newQuestion - The new question to check
 * @param {Array} existingQuestions - Array of existing questions to compare against
 * @param {Object} options - Configuration options
 * @returns {Object} Detection result with matches and similarity scores
 */
export const detectDuplicates = (newQuestion, existingQuestions, options = {}) => {
    const defaults = {
        textThreshold: 0.7,    // Text similarity threshold
        optionsThreshold: 0.6, // Options similarity threshold
        minMatches: 2,         // Minimum number of similarities to consider a duplicate
        topMatches: 3,         // Number of top matches to return
        checkAcrossParts: false // Whether to check for duplicates across different parts
    };

    const config = { ...defaults, ...options };
    const matches = [];
    const reasons = [];

    // Validate inputs
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return { isDuplicate: false, matches: [], reasons: [] };
    }

    if (!existingQuestions || !Array.isArray(existingQuestions)) {
        // If no existing questions, not a duplicate
        return { isDuplicate: false, matches: [], reasons: [] };
    }

    // If no valid question text, return early
    if (!newQuestion.text) {
        return { isDuplicate: false, matches: [], reasons: [] };
    }

    // Compare with each existing question
    existingQuestions.forEach(existingQuestion => {
        // Skip comparison with self (by ID if available)
        if (newQuestion._id && existingQuestion._id === newQuestion._id) {
            return;
        }

        // Skip if different parts (unless explicitly checking across parts)
        if (!options.checkAcrossParts &&
            newQuestion.part && existingQuestion.part &&
            newQuestion.part !== existingQuestion.part) {
            return;
        }

        // Check similarities
        const similarities = {
            text: calculateStringSimilarity(newQuestion.text, existingQuestion.text),
            optionA: calculateStringSimilarity(
                newQuestion.options?.A,
                existingQuestion.options?.A
            ),
            optionB: calculateStringSimilarity(
                newQuestion.options?.B,
                existingQuestion.options?.B
            ),
            optionC: calculateStringSimilarity(
                newQuestion.options?.C,
                existingQuestion.options?.C
            ),
            optionD: calculateStringSimilarity(
                newQuestion.options?.D,
                existingQuestion.options?.D
            ),
            optionE: calculateStringSimilarity(
                newQuestion.options?.E,
                existingQuestion.options?.E
            )
        };

        // Calculate similarity score and check if it's a potential duplicate
        const matchReasons = [];
        let matchCount = 0;

        if (similarities.text >= config.textThreshold) {
            matchReasons.push(`Question text is ${Math.round(similarities.text * 100)}% similar`);
            matchCount++;
        }

        // Check option similarities
        const optionSimilarities = [
            similarities.optionA,
            similarities.optionB,
            similarities.optionC,
            similarities.optionD,
            similarities.optionE
        ].filter(s => s >= config.optionsThreshold);

        if (optionSimilarities.length > 0) {
            matchReasons.push(`${optionSimilarities.length} answer options are similar`);
            matchCount += Math.min(2, optionSimilarities.length); // Count max 2 for options
        }

        // Check for exact number match if present
        if (newQuestion.number && existingQuestion.number &&
            newQuestion.number === existingQuestion.number) {
            matchReasons.push(`Same question number (${newQuestion.number})`);
            matchCount++;
        }

        // Check for year/part match if both have it
        if (newQuestion.year && existingQuestion.year &&
            newQuestion.part && existingQuestion.part &&
            newQuestion.year === existingQuestion.year &&
            newQuestion.part === existingQuestion.part) {
            matchReasons.push(`Same PRITE year (${newQuestion.year}) and part (${newQuestion.part})`);
            matchCount++;
        }

        // Calculate overall score based on text and option similarities
        // Weight text similarity higher
        const overallScore = similarities.text * 0.6 +
            (optionSimilarities.reduce((sum, val) => sum + val, 0) /
                Math.max(1, optionSimilarities.length)) * 0.4;

        // Determine if it's a potential duplicate based on match count and score
        if (matchCount >= config.minMatches) {
            matches.push({
                question: existingQuestion,
                similarity: {
                    score: overallScore,
                    details: similarities,
                    reasons: matchReasons,
                    matchCount,
                    // Suggest a merge strategy based on creation dates or properties
                    mergeStrategy:
                        existingQuestion.createdAt && newQuestion.createdAt &&
                            new Date(newQuestion.createdAt) > new Date(existingQuestion.createdAt)
                            ? 'newer'
                            : 'metadata'
                }
            });
        }
    });

    // Sort matches by similarity score (descending)
    matches.sort((a, b) => b.similarity.score - a.similarity.score);

    // Limit to top matches
    const topMatches = matches.slice(0, config.topMatches);

    // Determine if it's a duplicate based on top match score
    const isDuplicate = topMatches.length > 0 &&
        topMatches[0].similarity.score >= 0.8;

    // Compile reasons for flagging as duplicate
    if (isDuplicate) {
        reasons.push(`Matched with question "${topMatches[0].question.text.substring(0, 50)}..."`);
        reasons.push(...topMatches[0].similarity.reasons);
    }

    return {
        isDuplicate,
        matches: topMatches,
        reasons
    };
};

/**
 * Merges two questions based on the specified strategy
 * @param {Object} existingQuestion - The existing question 
 * @param {Object} newQuestion - The new question
 * @param {String} strategy - Merge strategy ('newer', 'metadata', 'manual', etc.)
 * @param {Object} manualSelections - Fields to use from the new question (for manual strategy)
 * @returns {Object} Merged question
 */
export const mergeQuestions = (existingQuestion, newQuestion, strategy = 'metadata', manualSelections = {}) => {
    // Create a copy of the existing question to modify
    const mergedQuestion = { ...existingQuestion };

    switch (strategy) {
        case 'newer':
            // Replace with the new question but keep the existing ID
            return {
                ...newQuestion,
                _id: existingQuestion._id,
                createdAt: existingQuestion.createdAt,
                creator: existingQuestion.creator,
                studyData: existingQuestion.studyData || [],
                isPublic: existingQuestion.isPublic
            };

        case 'metadata':
            // Keep existing question but update metadata from new question
            return {
                ...existingQuestion,
                part: newQuestion.part || existingQuestion.part,
                year: newQuestion.year || existingQuestion.year,
                number: newQuestion.number || existingQuestion.number,
                category: newQuestion.category || existingQuestion.category
            };

        case 'manual':
            // Selectively merge fields based on manualSelections
            if (!manualSelections) return existingQuestion;

            // For each possible field, check if it should be used from the new question
            if (manualSelections.text) {
                mergedQuestion.text = newQuestion.text;
            }

            if (manualSelections.category) {
                mergedQuestion.category = newQuestion.category;
            }

            if (manualSelections.part) {
                mergedQuestion.part = newQuestion.part;
            }

            if (manualSelections.year) {
                mergedQuestion.year = newQuestion.year;
            }

            if (manualSelections.number) {
                mergedQuestion.number = newQuestion.number;
            }

            if (manualSelections.correctAnswer) {
                mergedQuestion.correctAnswer = newQuestion.correctAnswer;
            }

            if (manualSelections.explanation) {
                mergedQuestion.explanation = newQuestion.explanation;
            }

            // Handle options separately
            ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
                if (manualSelections[`option${letter}`]) {
                    mergedQuestion.options[letter] = newQuestion.options[letter];
                }
            });

            return mergedQuestion;

        case 'keepBoth':
            // Don't merge, return the new question as-is
            return newQuestion;

        default:
            // Default to keeping the existing question
            return existingQuestion;
    }
};

/**
 * Compares strings and calculates similarity score
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} Similarity score between 0 and 1
 */
export const calculateStringSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;

    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Calculate simple string similarity
    try {
        // Use string-similarity library if available
        return stringSimilarity.compareTwoStrings(s1, s2);
    } catch (error) {
        // Fallback to basic comparison
        return s1 === s2 ? 1 : 0;
    }
};

/**
 * Calculates similarity score between two questions
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
    const textSimilarity = calculateStringSimilarity(
        questionA.text,
        questionB.text
    );

    // Check options similarity
    let optionsSimilaritySum = 0;
    let optionCount = 0;

    // Compare each option
    for (const letter of ['A', 'B', 'C', 'D', 'E']) {
        const optionA = questionA.options[letter];
        const optionB = questionB.options[letter];

        if (optionA && optionB) {
            const optionSimilarity = calculateStringSimilarity(optionA, optionB);
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