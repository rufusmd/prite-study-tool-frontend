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