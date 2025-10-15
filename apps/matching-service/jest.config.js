export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/api/(.*)$": "<rootDir>/src/api/$1",
    "^@/workers/(.*)$": "<rootDir>/src/workers/$1",
    "^@/services/(.*)$": "<rootDir>/src/services/$1",
    "^@/observability/(.*)$": "<rootDir>/src/observability/$1",
    "^@/types$": "<rootDir>/src/types",
    "^@/test-utils$": "<rootDir>/src/__tests__/utils/test-helpers",
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/index.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testTimeout: 10000,
};
