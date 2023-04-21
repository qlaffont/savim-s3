/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, expect, it, jest } from '@jest/globals';
import { Savim } from 'savim';
import { Readable } from 'stream';

import { SavimAWSS3Provider, SavimAWSS3ProviderConfig } from '../src';

jest.mock('@aws-sdk/client-s3', () => {
  return {
    DeleteObjectCommand: jest.fn().mockImplementation(() => {
      return {};
    }),
    GetObjectCommand: jest.fn().mockImplementation(() => {
      return {
        Body: {
          transformToString: () => 'test',
        },
      };
    }),
    ListObjectsCommand: jest.fn().mockImplementation(() => {
      if (process.env.ERROR === 'true') {
        throw new Error('test');
      }

      return {};
    }),
    ListObjectsV2Command: jest.fn().mockImplementation(() => {
      if (process.env.ERROR === 'true') {
        throw new Error('test');
      }

      return {};
    }),
    PutObjectCommand: jest.fn().mockImplementation(() => {
      return {};
    }),
    S3Client: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn().mockImplementation(() => {
          return {
            Body: {
              transformToString: () => 'test',
            },
          };
        }),
      };
    }),
  };
});

describe('Savim S3', () => {
  it('should be Defined', () => {
    expect(Savim).toBeDefined();
  });
  it('should be able to define log', () => {
    expect(new Savim('debug')).toBeDefined();
  });
  it('should be able to add provider', async () => {
    const savim = new Savim();
    try {
      process.env.ERROR = 'true';
      await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
        Bucket: 'testbucket',
      });
      // eslint-disable-next-line no-empty
    } catch (error) {
      process.env.ERROR = 'false';
      expect(savim).toBeDefined();
      expect(savim.providers).toBeDefined();
      expect(Object.keys(savim.providers)).toHaveLength(0);
    }

    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
      Bucket: 'testbucket',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
      },
    });
    expect(savim).toBeDefined();
    expect(savim.providers).toBeDefined();
    expect(Object.keys(savim.providers)).toHaveLength(1);
  });
  it('should be able to upload file (string)', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
      Bucket: 'testbucket',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
      },
    });
    const fileName = 'testupload.txt';
    const fileContent = 'test';
    await savim.uploadFile(fileName, fileContent);
  });
  it('should be able to upload file (buffer)', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
      Bucket: 'testbucket',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
      },
    });
    const fileName = 'testuploadbuffer.txt';
    const fileContent = 'test';
    await savim.uploadFile(fileName, Buffer.from(fileContent, 'utf8'));
  });
  it('should be able to upload file (stream)', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
      Bucket: 'testbucket',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
      },
    });
    const fileName = 'testuploadstream.txt';
    const fileContent = 'test';
    const s = new Readable();
    s.push(fileContent);
    s.push(null);
    await savim.uploadFile(fileName, s);
  });
  it('should be able to get file', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
      Bucket: 'testbucket',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
      },
    });
    const fileName = 'testupload.txt';
    const fileContent = 'test';
    expect(await savim.getFile(fileName)).toEqual(fileContent);
  });
  it('should be able to delete file', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
      Bucket: 'testbucket',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
      },
    });
    const fileName = 'testupload.txt';
    await savim.deleteFile(fileName);
  });

  it('should be able to create folder', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
      Bucket: 'testbucket',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
      },
    });
    await savim.createFolder('createfolder');
  });

  it('should be able to delete folder', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
      Bucket: 'testbucket',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
      },
    });
    await savim.deleteFolder('deletefolder');
  });

  it('should be able to list folders', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
      Bucket: 'testbucket',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
      },
    });
    await savim.getFolders('');
  });

  it('should be able to list files', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
      Bucket: 'testbucket',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'testAccessKeyId',
        secretAccessKey: 'testSecretAccessKey',
      },
    });
    await savim.getFiles('');
  });
});
