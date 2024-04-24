/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Config} from 'jest';

const common = {
  modulePathIgnorePatterns: ['/npm'],
};

const config: Config = {
  collectCoverageFrom: ['<rootDir>/packages/**/*.{ts,tsx}'],
  coveragePathIgnorePatterns: ['node_modules', 'dist', '__tests__'],
  coverageReporters: ['lcov', ['text', {skipFull: true}]],
  projects: [
    {
      ...common,
      displayName: 'unit',
      globals: {
        IS_REACT_ACT_ENVIRONMENT: true,
      },
      moduleNameMapper: {
        '^./dist/(.+)': './src/$1',
        '^@webext-pegasus/rpc$': '<rootDir>/packages/rpc/index.ts',
        '^@webext-pegasus/store$': '<rootDir>/packages/store/index.ts',
        '^@webext-pegasus/store-zustand$':
          '<rootDir>/packages/store-zustand/index.ts',
        '^@webext-pegasus/transport$': '<rootDir>/packages/transport/index.ts',
        '^@webext-pegasus/transport/(.+)$': '<rootDir>/packages/transport/$1',
      },
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/test-utils/testPegasus.ts'],
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/unit/**/*.test{.ts,.tsx,.js,.jsx}'],
      transform: {
        '^.+\\.jsx?$': 'babel-jest',
        '^.+\\.tsx$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.test.json',
          },
        ],
      },
    },
  ],
};

export default config;
