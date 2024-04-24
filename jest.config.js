/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const common = {
  modulePathIgnorePatterns: ['/npm'],
};

module.exports = {
  projects: [
    {
      ...common,
      displayName: 'unit',
      globals: {
        IS_REACT_ACT_ENVIRONMENT: true,
      },
      moduleNameMapper: {
        '^./dist/(.+)': './src/$1',
        '^@webext-pegasus/rpc$': '<rootDir>/packages/rpc/src/index.ts',
        '^@webext-pegasus/store$': '<rootDir>/packages/store/src/index.ts',
        '^@webext-pegasus/store-zustand$':
          '<rootDir>/packages/store-zustand/src/index.ts',
        '^@webext-pegasus/transport$':
          '<rootDir>/packages/transport/src/index.ts',
        '^@webext-pegasus/transport/(.+)$':
          '<rootDir>/packages/transport/src/$1',
      },
      preset: 'ts-jest',
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
