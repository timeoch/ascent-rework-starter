export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'esbuild-jest'
  },
  extensionsToTreatAsEsm: ['.jsx'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};

