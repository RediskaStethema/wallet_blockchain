import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',

    extensionsToTreatAsEsm: ['.ts'],

    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },

    transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
    },

    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageProvider: 'v8',
    testMatch: [
        '**/__tests__/**/*.?([mc])[jt]s?(x)',
        '**/?(*.)+(spec|test).?([mc])[jt]s?(x)',
    ],
};

export default config;
