module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@prisma-service/(.*)$': '<rootDir>/src/prisma/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@smartfeed/shared$': '<rootDir>/../../packages/shared/dist/index.js',
  },
};
