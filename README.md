[![Test Coverage](https://api.codeclimate.com/v1/badges/1ceadff5f5ef77b2e8b6/test_coverage)](https://codeclimate.com/github/flexper/savim-s3/test_coverage) [![Maintainability](https://api.codeclimate.com/v1/badges/1ceadff5f5ef77b2e8b6/maintainability)](https://codeclimate.com/github/flexper/savim-s3/maintainability) ![npm](https://img.shields.io/npm/v/savim-s3) ![npm](https://img.shields.io/npm/dm/savim-s3) ![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/savim-s3) ![NPM](https://img.shields.io/npm/l/savim-s3)

# savim-s3

A simple library to save file with Savim to a AWS S3.

## Usage

```typescript
import { Savim } from 'savim';
import { SavimAWSS3ProviderConfig, SavimAWSS3Provider } from 'savim-s3';

const savim = new Savim();

await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
  Bucket: 'testbucket',
  region: 'eu-west-1',
  credentials: {
    accessKeyId: 'testAccessKeyId',
    secretAccessKey: 'testSecretAccessKey',
  },
});

await savim.uploadFile('test.txt', 'thisisatest');
```

## Tests

To execute jest tests (all errors, type integrity test)

```
pnpm test
```

## Maintain

This package use [TSdx](https://github.com/jaredpalmer/tsdx). Please check documentation to update this package.
