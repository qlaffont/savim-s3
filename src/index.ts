import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectRequest,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { SavimProviderInterface } from 'savim';
import { Readable, Stream } from 'stream';

export type SavimAWSS3UploadFileParam = Omit<
  PutObjectRequest,
  'Body' | 'Bucket' | 'Key'
>;

export type SavimAWSS3ProviderConfig = S3ClientConfig & {
  Bucket: string;
};

function streamToString(stream: Readable) {
  const chunks: readonly Uint8Array[] | Buffer[] = [];
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () =>
      resolve(Buffer.concat(chunks).toString('utf8') as string),
    );
  });
}

export class SavimAWSS3Provider implements SavimProviderInterface {
  name = 'aws-s3';
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  client;

  constructor(public config: SavimAWSS3ProviderConfig) {
    this.client = new S3Client(config);
  }

  async isHealthy() {
    try {
      const cmd = new ListObjectsCommand({ Bucket: this.config.Bucket });
      await this.client.send(cmd);
      return true;
    } catch (err) {
      return false;
    }
  }

  async getFile(filenameWithPath: string) {
    const command = new GetObjectCommand({
      Key: filenameWithPath,
      Bucket: this.config.Bucket,
    });

    const response = await this.client.send(command);
    return response.Body!.transformToString();
  }

  async uploadFile(
    filenameWithPath: string,
    content: string | Buffer | Stream,
    params?: SavimAWSS3UploadFileParam,
  ) {
    let fileStream: string;

    if (Buffer.isBuffer(content)) {
      fileStream = (content as Buffer).toString();
    }

    if (content instanceof Readable) {
      fileStream = (await streamToString(content)) as string;
    }

    if (typeof content === 'string') {
      fileStream = content;
    }

    const command = new PutObjectCommand({
      ...(params || {}),
      Bucket: this.config.Bucket,
      Key: filenameWithPath,
      Body: fileStream!,
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.client.send(command);
  }

  async deleteFile(filenameWithPath: string) {
    const command = new DeleteObjectCommand({
      Key: filenameWithPath,
      Bucket: this.config.Bucket,
    });

    await this.client.send(command);
  }

  async createFolder(path: string) {
    const command = new PutObjectCommand({
      Bucket: this.config.Bucket,
      Key: `${path}/`,
    });

    await this.client.send(command);
  }

  async deleteFolder(path: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.config.Bucket,
      Key: `${path}`,
    });

    await this.client.send(command);
  }

  async getFolders(path: string) {
    const command = new ListObjectsV2Command({
      Bucket: this.config.Bucket,
      Prefix: path,
    });

    const response = await this.client.send(command);

    return response.Contents?.map((v) => v.Key!).filter(
      (v) => v?.at(-1) === '/',
    );
  }

  async getFiles(path: string) {
    const command = new ListObjectsV2Command({
      Bucket: this.config.Bucket,
      Prefix: path,
    });

    const response = await this.client.send(command);

    return response.Contents?.map((v) => v.Key!).filter(
      (v) => v.at(-1) !== '/',
    );
  }
}
