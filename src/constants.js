import { dispatch } from 'd3';

const CONSTANTS = {
    ACTIVE_COLOR: '#386cb0', //'#69b3a2',
    INACTIVE_COLOR: '#b6b6b6',
    PCA_SELECTION_COLOR: 'rgb(230,171,2)',
    TOTAL_EARNINGS: undefined,
    TRANSITION_DURATION: 1000,
    DISPATCHER: dispatch('userSelection'),
    INTEREST_GROUPS: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    EDUCATION_LEVEL: ['Low', 'HighSchoolOrCollege', 'Bachelors', 'Graduate'],
    BUILDING_TYPES: ['Residential', 'Commercial', 'School'],
    BUILDINGS_COLORS: ['rgb(255,255,153)', 'rgb(190,174,212)', 'rgb(253,192,134)'],
    NUMBER_FORMATTER: new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }),
    MAP_TO_COLOR: {
        'Residential': 'rgb(255,255,153)',
        'Commercial': 'rgb(190,174,212)',
        'School': 'rgb(253,192,134)',
        'Pub': 'rgb(240,2,127)',
        'Restaurant': 'rgb(127,201,127)'
    },
};

// Export the constants
export default CONSTANTS;
