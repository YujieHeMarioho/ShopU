export default {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    transform: {},
    moduleFileExtensions: ['js', 'mjs'],
    setupFilesAfterEnv: ['./jest.setup.js'],
    reporters: [
      "default",
      ["jest-junit", { outputDirectory: ".", outputName: "junit.xml" }]
    ]
  };