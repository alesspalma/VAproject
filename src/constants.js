import { dispatch } from 'd3';

const CONSTANTS = {
    ACTIVE_COLOR: '#69b3a2', //'#FA2A55'
    INACTIVE_COLOR: '#b6b6b6',
    PCA_SELECTION_COLOR: 'rgb(230,171,2)',
    TOTAL_EARNINGS: undefined,
    TRANSITION_DURATION: 1000,
    DISPATCHER: dispatch('userSelection'),
    INTEREST_GROUPS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    EDUCATION_LEVEL: ['Low', 'HighSchoolOrCollege', 'Bachelors', 'Graduate'],
    BUILDINGS_COLORS: ['rgb(255,255,153)', 'rgb(56,108,176)', 'rgb(191,91,23)', 'rgb(190,184,242)', 'rgb(253,192,134)'],
    BUILDING_TYPES: ['Residential', 'Commercial', 'Pub', 'Restaurant', 'School'],
    NUMBER_FORMATTER: new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }),
    MAP_TO_COLOR: {
        'Residential': 'rgb(255,255,153)',
        'Commercial': 'rgb(56,108,176)',
        'Pub': 'rgb(191,91,23)',
        'Restaurant': 'rgb(190,184,242)',
        'School': 'rgb(253,192,134)'
    },
};

// Export the constants
export default CONSTANTS;
