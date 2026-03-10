import { describe, expect, it, mock } from 'bun:test';
import { Savim } from 'savim';
import { Readable } from 'stream';

import { SavimAWSS3Provider, SavimAWSS3ProviderConfig } from '../src';

let mockSendImpl = mock().mockImplementation(() => {
  return {
    Body: {
      transformToByteArray: () => 'test',
    },
  };
});

mock.module('@aws-sdk/client-s3', () => {
  return {
    DeleteObjectCommand: mock().mockImplementation(() => ({})),
    GetObjectCommand: mock().mockImplementation(() => ({
      Body: {
        transformToByteArray: () => 'test',
      },
    })),
    ListObjectsCommand: mock().mockImplementation(() => {
      if (process.env.HEALTH_ERROR === 'true') {
        throw new Error('test');
      }
      return {};
    }),
    ListObjectsV2Command: mock().mockImplementation(() => ({})),
    PutObjectCommand: mock().mockImplementation(() => ({})),
    S3Client: mock().mockImplementation(() => ({
      send: mockSendImpl,
    })),
  };
});

const baseConfig: SavimAWSS3ProviderConfig = {
  Bucket: 'testbucket',
  region: 'eu-west-1',
  credentials: {
    accessKeyId: 'testAccessKeyId',
    secretAccessKey: 'testSecretAccessKey',
  },
};

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
      process.env.HEALTH_ERROR = 'true';
      await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, {
        Bucket: 'testbucket',
      });
    } catch (_error) {
      process.env.HEALTH_ERROR = 'false';
      expect(savim).toBeDefined();
      expect(savim.providers).toBeDefined();
      expect(Object.keys(savim.providers)).toHaveLength(0);
    }

    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    expect(savim).toBeDefined();
    expect(savim.providers).toBeDefined();
    expect(Object.keys(savim.providers)).toHaveLength(1);
  });

  it('isHealthy should return false when send throws', async () => {
    mockSendImpl = mock().mockImplementation(() => {
      throw new Error('connection refused');
    });
    const provider = new SavimAWSS3Provider(baseConfig);
    expect(await provider.isHealthy()).toBe(false);
    mockSendImpl = mock().mockImplementation(() => ({
      Body: { transformToByteArray: () => 'test' },
    }));
  });

  it('should be able to upload file (string)', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    const fileName = 'testupload.txt';
    const fileContent = 'test';
    await savim.uploadFile(fileName, fileContent);
  });
  it('should be able to upload file (buffer)', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    const fileName = 'testuploadbuffer.txt';
    const fileContent = 'test';
    await savim.uploadFile(fileName, Buffer.from(fileContent, 'utf8'));
  });
  it('should be able to upload file (stream)', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    const fileName = 'testuploadstream.txt';
    const fileContent = 'test';
    const s = new Readable();
    s.push(fileContent);
    s.push(null);
    await savim.uploadFile(fileName, s);
  });
  it('should be able to upload file with extra params', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    await savim.uploadFile('test.txt', 'content', { ContentType: 'text/plain' });
  });
  it('should be able to get file', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    const fileName = 'testupload.txt';
    const fileContent = 'test';
    expect(await savim.getFile(fileName)).toEqual(fileContent);
  });
  it('should return undefined when getFile Body is missing', async () => {
    mockSendImpl = mock().mockImplementation(() => ({ Body: undefined }));
    const provider = new SavimAWSS3Provider(baseConfig);
    const result = await provider.getFile('missing.txt');
    expect(result).toBeUndefined();
    mockSendImpl = mock().mockImplementation(() => ({
      Body: { transformToByteArray: () => 'test' },
    }));
  });
  it('should be able to delete file', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    const fileName = 'testupload.txt';
    await savim.deleteFile(fileName);
  });

  it('should be able to create folder', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    await savim.createFolder('createfolder');
  });

  it('should be able to delete folder', async () => {
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    await savim.deleteFolder('deletefolder');
  });

  it('should be able to list folders', async () => {
    mockSendImpl = mock().mockImplementation(() => ({
      Contents: [{ Key: 'folder/' }, { Key: 'file.txt' }],
    }));
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    const result = await savim.getFolders('');
    expect(result).toEqual(['folder/']);
    mockSendImpl = mock().mockImplementation(() => ({
      Body: { transformToByteArray: () => 'test' },
    }));
  });

  it('should return undefined when getFolders Contents is missing', async () => {
    mockSendImpl = mock().mockImplementation(() => ({}));
    const provider = new SavimAWSS3Provider(baseConfig);
    expect(await provider.getFolders('')).toBeUndefined();
    mockSendImpl = mock().mockImplementation(() => ({
      Body: { transformToByteArray: () => 'test' },
    }));
  });

  it('should be able to list files', async () => {
    mockSendImpl = mock().mockImplementation(() => ({
      Contents: [{ Key: 'folder/' }, { Key: 'file.txt' }],
    }));
    const savim = new Savim();
    await savim.addProvider<SavimAWSS3ProviderConfig>(SavimAWSS3Provider, baseConfig);
    const result = await savim.getFiles('');
    expect(result).toEqual(['file.txt']);
    mockSendImpl = mock().mockImplementation(() => ({
      Body: { transformToByteArray: () => 'test' },
    }));
  });

  it('should return undefined when getFiles Contents is missing', async () => {
    mockSendImpl = mock().mockImplementation(() => ({}));
    const provider = new SavimAWSS3Provider(baseConfig);
    expect(await provider.getFiles('')).toBeUndefined();
    mockSendImpl = mock().mockImplementation(() => ({
      Body: { transformToByteArray: () => 'test' },
    }));
  });
});
