// src/utils/priteScoreUtils.js

/**
 * Constants for PRITE categories
 */
export const PRITE_CATEGORIES = [
    'Neuroscience',
    'Development',
    'Behavioral Science',
    'Psychopathology',
    'Psychotherapy',
    'Somatic Treatments',
    'Consultation & Emergency',
    'Forensics',
    'Ethics',
    'Research & Statistics'
];

/**
 * Maps PRITE category from raw text to standardized category
 * @param {string} categoryText - Raw category text from score report
 * @returns {string} Standardized category name
 */
export const mapPriteCategory = (categoryText) => {
    const text = categoryText.toLowerCase().trim();

    if (text.includes('neuro')) return 'Neuroscience';
    if (text.includes('develop')) return 'Development';
    if (text.includes('behav')) return 'Behavioral Science';
    if (text.includes('psychopath')) return 'Psychopathology';
    if (text.includes('psychother')) return 'Psychotherapy';
    if (text.includes('somat') || text.includes('treatment')) return 'Somatic Treatments';
    if (text.includes('consult') || text.includes('emerg')) return 'Consultation & Emergency';
    if (text.includes('forensic')) return 'Forensics';
    if (text.includes('ethic')) return 'Ethics';
    if (text.includes('research') || text.includes('stat')) return 'Research & Statistics';

    // Return original if no match
    return categoryText;
};

/**
 * Calculates the expected progress based on PGY level and time in program
 * @param {string} pgyLevel - PGY level (1-5, Fellow, etc.)
 * @param {number} monthsInProgram - Months in program (optional)
 * @returns {Object} Expected percentiles by category
 */
export const calculateExpectedPercentiles = (pgyLevel, monthsInProgram = null) => {
    // Base expected percentiles by PGY level
    const baseExpectations = {
        '1': {
            overall: 35,
            neuroscience: 30,
            psychopathology: 40,
            somaticTreatments: 30,
            development: 35,
        },
        '2': {
            overall: 50,
            neuroscience: 45,
            psychopathology: 55,
            somaticTreatments: 50,
            development: 50,
        },
        '3': {
            overall: 65,
            neuroscience: 60,
            psychopathology: 70,
            somaticTreatments: 65,
            development: 60,
        },
        '4': {
            overall: 75,
            neuroscience: 70,
            psychopathology: 80,
            somaticTreatments: 75,
            development: 70,
        },
        '5': {
            overall: 85,
            neuroscience: 80,
            psychopathology: 85,
            somaticTreatments: 85,
            development: 80,
        },
        'Fellow': {
            overall: 90,
            neuroscience: 85,
            psychopathology: 90,
            somaticTreatments: 90,
            development: 85,
        },
        'Attending': {
            overall: 95,
            neuroscience: 90,
            psychopathology: 95,
            somaticTreatments: 95,
            development: 90,
        }
    };

    // Handle invalid PGY level
    if (!baseExpectations[pgyLevel]) {
        return baseExpectations['3']; // Default to PGY-3
    }

    // Adjust for months in program if provided
    const expectations = { ...baseExpectations[pgyLevel] };

    if (monthsInProgram !== null) {
        // Each year has 12 months, adjust expectations accordingly
        const adjustmentFactor = (monthsInProgram % 12) / 12;
        const nextPgyLevelKey = String(Number(pgyLevel) + 1);

        // Only adjust if there is a next PGY level defined
        if (baseExpectations[nextPgyLevelKey]) {
            const nextExpectations = baseExpectations[nextPgyLevelKey];

            // Interpolate between current and next PGY level
            Object.keys(expectations).forEach(key => {
                if (nextExpectations[key]) {
                    const diff = nextExpectations[key] - expectations[key];
                    expectations[key] = Math.round(expectations[key] + (diff * adjustmentFactor));
                }
            });
        }
    }

    return expectations;
};

/**
 * Compares user's PRITE scores with national averages
 * @param {Object} scores - User's PRITE scores
 * @returns {Object} Comparison metrics and analysis
 */
export const analyzePriteScores = (scores) => {
    if (!scores || !Array.isArray(scores) || scores.length === 0) {
        return {
            trendData: [],
            improvementAreas: [],
            strengthAreas: [],
            hasImprovement: false
        };
    }

    // Sort scores by year (oldest first)
    const sortedScores = [...scores].sort((a, b) => parseInt(a.year) - parseInt(b.year));

    // Calculate trends
    const trendData = [];
    const categories = ['overall', 'psychiatry', 'neuroscience', 'somatic', 'growth'];

    sortedScores.forEach(score => {
        const yearData = { year: score.year };

        categories.forEach(category => {
            const percentileKey = `${category}Percentile`;
            if (score[percentileKey] !== undefined && score[percentileKey] !== null) {
                yearData[category] = score[percentileKey];
            }
        });

        // Get section data (if any)
        if (score.sections && score.sections.length > 0) {
            score.sections.forEach(section => {
                const safeName = section.name.toLowerCase().replace(/\W+/g, '_');
                yearData[safeName] = section.percentile;
            });
        }

        trendData.push(yearData);
    });

    // Calculate improvement areas
    let improvementAreas = [];
    let strengthAreas = [];
    let hasImprovement = false;

    // Only calculate improvement if we have at least 2 score years
    if (sortedScores.length >= 2) {
        const firstScore = sortedScores[0];
        const latestScore = sortedScores[sortedScores.length - 1];

        // Check each main category for improvement
        categories.forEach(category => {
            const percentileKey = `${category}Percentile`;
            const firstValue = firstScore[percentileKey];
            const latestValue = latestScore[percentileKey];

            if (firstValue !== undefined && latestValue !== undefined) {
                const improvement = latestValue - firstValue;

                if (improvement > 10) {
                    hasImprovement = true;
                    improvementAreas.push({
                        category: category.charAt(0).toUpperCase() + category.slice(1),
                        improvement,
                        current: latestValue
                    });
                } else if (latestValue >= 75) {
                    // If score is high, consider it a strength
                    strengthAreas.push({
                        category: category.charAt(0).toUpperCase() + category.slice(1),
                        score: latestValue
                    });
                } else if (improvement < -5) {
                    // Regression area
                    improvementAreas.push({
                        category: category.charAt(0).toUpperCase() + category.slice(1),
                        improvement,
                        current: latestValue,
                        isRegression: true
                    });
                }
            }
        });

        // Sort improvement areas by improvement amount (descending)
        improvementAreas.sort((a, b) => {
            if (a.isRegression && !b.isRegression) return 1;
            if (!a.isRegression && b.isRegression) return -1;
            return Math.abs(b.improvement) - Math.abs(a.improvement);
        });

        // Sort strength areas by score (descending)
        strengthAreas.sort((a, b) => b.score - a.score);
    }

    return {
        trendData,
        improvementAreas,
        strengthAreas,
        hasImprovement
    };
};

/**
 * Generates recommendations based on PRITE scores
 * @param {Object} scoreAnalysis - Analysis from analyzePriteScores
 * @param {string} pgyLevel - User's PGY level
 * @returns {Object} Study recommendations
 */
export const generateRecommendations = (scoreAnalysis, pgyLevel) => {
    const { improvementAreas, strengthAreas } = scoreAnalysis;
    const recommendations = [];

    // Generate recommendations for areas needing improvement
    improvementAreas.forEach(area => {
        const categoryName = area.category.toLowerCase();

        // Skip overall category for specific recommendations
        if (categoryName === 'overall') return;

        if (area.isRegression) {
            recommendations.push({
                category: area.category,
                priority: 'high',
                message: `Focus on ${area.category} as your score has decreased by ${Math.abs(area.improvement)} percentile points.`,
                suggestedResources: getSuggestedResources(categoryName, pgyLevel)
            });
        } else {
            recommendations.push({
                category: area.category,
                priority: area.current < 50 ? 'high' : 'medium',
                message: `Continue improving in ${area.category} where you've made good progress.`,
                suggestedResources: getSuggestedResources(categoryName, pgyLevel)
            });
        }
    });

    // Check for low scores not in improvement list
    const lowScoreCategories = ['psychiatry', 'neuroscience', 'somatic', 'growth']
        .filter(cat => {
            // Only include if not already in improvement areas
            return !improvementAreas.some(area => area.category.toLowerCase() === cat);
        });

    lowScoreCategories.forEach(category => {
        recommendations.push({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            priority: 'medium',
            message: `Consider focusing on ${category} content in your studies.`,
            suggestedResources: getSuggestedResources(category, pgyLevel)
        });
    });

    // Sort recommendations by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
};

/**
 * Get suggested resources for a particular category
 * @param {string} category - PRITE category
 * @param {string} pgyLevel - User's PGY level
 * @returns {Array} List of suggested resources
 */
function getSuggestedResources(category, pgyLevel) {
    // Maps categories to recommended resources
    const resourceMap = {
        neuroscience: [
            'Neuroanatomy through Clinical Cases (Blumenfeld)',
            'Stahl's Essential Psychopharmacology',
      'The Neuroscience of Clinical Psychiatry'
        ],
        psychiatry: [
            'Kaplan & Sadock's Synopsis of Psychiatry',
      'Massachusetts General Hospital Comprehensive Clinical Psychiatry',
            'The American Psychiatric Publishing Textbook of Psychiatry'
        ],
        psychopathology: [
            'DSM-5 Clinical Cases',
            'Fish's Clinical Psychopathology',
      'Psychopathology: Foundations for a Contemporary Understanding'
        ],
        somatic: [
            'The Evidence-Based Guide to Antipsychotic Medications',
            'Handbook of Clinical Psychopharmacology for Therapists',
            'Manual of Clinical Psychopharmacology'
        ],
        growth: [
            'Developmental Psychopathology',
            'Child Psychopathology',
            'Dulcan's Textbook of Child and Adolescent Psychiatry'
        ]
    };

    // Return default resources if category not found
    return resourceMap[category] || [
        'Kaplan & Sadock's Synopsis of Psychiatry',
    'Massachusetts General Hospital Psychiatry Update & Board Preparation',
        'First Aid for the Psychiatry Clerkship'
    ];
}