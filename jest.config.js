/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

const baseConfig = {
    testPathIgnorePatterns: ['/node_modules/', '/cjs/'],
    preset: 'ts-jest/presets/js-with-ts',
    testEnvironment: 'node',
    transform: {
        '^.+\\.(ts|js|tsx|jsx)$': 'ts-jest',
    },
    modulePathIgnorePatterns: ['<rootDir>/dist'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        '^@starwards/(.+)': '<rootDir>/modules/$1/src',
    },
    globals: {
        'ts-jest': {
            diagnostics: {
                warnOnly: true,
            },
            isolatedModules: true,
        },
    },
};

module.exports = {
    projects: [
        {
            ...baseConfig,
            displayName: 'server',
            testRegex: 'modules/server/.*\\.spec\\.(ts|js|tsx|jsx)$',
        },
        {
            ...baseConfig,
            displayName: 'model',
            testRegex: 'modules/model/.*\\.spec\\.(ts|js|tsx|jsx)$',
        },
    ],
};
