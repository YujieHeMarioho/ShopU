module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  reporters: [
    "default",
    ["jest-junit", { outputDirectory: ".", outputName: "junit.xml" }]
  ],
};
