import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectRequest,
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { SavimProviderInterface } from "savim";
import { Readable, Stream } from "stream";

export type SavimAWSS3UploadFileParam = Omit<PutObjectRequest, "Body" | "Bucket" | "Key">;

export type SavimAWSS3ProviderConfig = S3ClientConfig & {
  Bucket: string;
};

export class SavimAWSS3Provider implements SavimProviderInterface {
  name = "aws-s3";
  client: S3Client;

  constructor(public config: SavimAWSS3ProviderConfig) {
    this.client = new S3Client(config);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const cmd = new ListObjectsCommand({ Bucket: this.config.Bucket });
      await this.client.send(cmd);
      return true;
      // oxlint-disable-next-line no-unused-vars
    } catch (_err) {
      return false;
    }
  }

  async getFile(filenameWithPath: string): Promise<Uint8Array | undefined> {
    const command = new GetObjectCommand({
      Key: filenameWithPath,
      Bucket: this.config.Bucket,
    });

    const response = await this.client.send(command);
    return await response.Body?.transformToByteArray();
  }

  async uploadFile(
    filenameWithPath: string,
    content: string | Buffer | Stream,
    params?: SavimAWSS3UploadFileParam,
  ): Promise<unknown> {
    let fileStream: string | Readable | Buffer;

    if (Buffer.isBuffer(content)) {
      fileStream = content;
    } else if (content instanceof Readable) {
      fileStream = content;
    } else {
      fileStream = content as string;
    }

    const command = new PutObjectCommand({
      ...(params || {}),
      Bucket: this.config.Bucket,
      Key: filenameWithPath,
      Body: fileStream,
    });

    return this.client.send(command);
  }

  async deleteFile(filenameWithPath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Key: filenameWithPath,
      Bucket: this.config.Bucket,
    });

    await this.client.send(command);
  }

  async createFolder(path: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.config.Bucket,
      Key: `${path}/`,
    });

    await this.client.send(command);
  }

  async deleteFolder(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.Bucket,
      Key: `${path}`,
    });

    await this.client.send(command);
  }

  async getFolders(path: string): Promise<string[] | undefined> {
    const command = new ListObjectsV2Command({
      Bucket: this.config.Bucket,
      Prefix: path,
    });

    const response = await this.client.send(command);

    return response.Contents?.map((v) => v.Key!).filter((v) => v?.at(-1) === "/");
  }

  async getFiles(path: string): Promise<string[] | undefined> {
    const command = new ListObjectsV2Command({
      Bucket: this.config.Bucket,
      Prefix: path,
    });

    const response = await this.client.send(command);

    return response.Contents?.map((v) => v.Key!).filter((v) => v.at(-1) !== "/");
  }
}
