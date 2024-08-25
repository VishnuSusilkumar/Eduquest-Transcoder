import { PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Params } from "../interfaces/custom";
import { ITranscoderRepository } from "../interfaces/iTransRepository";
import { ITranscoderService } from "../interfaces/iTransService";
import { Status, Transcoder } from "../model/transcoder.entities";
import { convertToWav } from "../utils/convert-to-wav";
import { FFmpegTranscoder } from "../utils/ffmpeg";
import { transcriber } from "../utils/whisper-node";
import * as fs from "fs";
import { s3 } from "../config/s3.config";
import { rimraf } from "rimraf";

export class TranscoderService implements ITranscoderService {
  constructor(private repository: ITranscoderRepository) {}

  async deleteData(id: string): Promise<Transcoder | null> {
    return await this.repository.deleteData(id);
  }

  async transcodeMedia(file: File, id: string) {
    try {
      const { filePath, fileName, outputDirectoryPath, directoryPath } =
        await FFmpegTranscoder(file);

      await this.repository.updateStatus(id, Status.subtitle, {
        generatedName: fileName,
      });
      const wavFilePath = await convertToWav(filePath);
      await transcriber(wavFilePath);
      const vttFilePath = `${wavFilePath}.vtt`;
      await this.repository.updateStatus(id, Status.finishing, {});

      const files = fs.readdirSync(outputDirectoryPath);
      for (const file of files) {
        const filePaths = `${outputDirectoryPath}/${file}`;
        const fileStream = fs.createReadStream(filePaths);
        const params: S3Params = {
          Bucket: process.env.S3_BUCKET_NAME || "",
          Key: `media/hls/${fileName}/${file}`,
          Body: fileStream,
          ContentType: file.endsWith(".ts")
            ? "video/mp2t"
            : file.endsWith(".m3u8")
            ? "application/x-mpegURL"
            : null,
        };

        try {
          const command = new PutObjectCommand(params);
          const rslt = await s3.send(command);
          fs.unlinkSync(filePaths);
          console.log(`Uploaded ${file} to S3`);
        } catch (err) {
          throw new Error("s3 error");
        }
      }

      const vttFileBuffer = fs.readFileSync(`${vttFilePath}`);
      const params: S3Params = {
        Bucket: process.env.S3_BUCKET_NAME || "",
        Key: `media/vtt/${fileName}.vtt`,
        Body: vttFileBuffer,
        ContentType: "text/vtt",
      };
      try {
        const command = new PutObjectCommand(params);
        const rslt = await s3.send(command);
        console.log(`Uploaded vtt to S3`);
      } catch (err) {
        throw new Error("error while uploading vtt into s3");
      }

      console.log(`Deleting locally saved files`);
      rimraf.sync(outputDirectoryPath);
      fs.unlinkSync(wavFilePath);
      fs.unlinkSync(vttFilePath);
      fs.unlinkSync(filePath);
      console.log(`Deleted locally saved files`);

      const videoUrl = `https://eduquest-elearning.s3.ap-south-1.amazonaws.com/media/hls/${fileName}/${fileName}_master.m3u8`;
      const subtitleUrl = `https://eduquest-elearning.s3.ap-south-1.amazonaws.com/media/vtt/${fileName}.vtt`;
      await this.repository.updateStatus(id, Status.completed, {
        videoUrl,
        subtitleUrl,
      });
    } catch (e: any) {
      await this.repository.updateStatus(id, Status.error, {});
      console.log(e);
    }
  }

  async getData(id: string): Promise<Transcoder | any> {
    try {
      const response = await this.repository.getData(id);
      return response;
    } catch (e: any) {
      console.log(e);
    }
  }

  async addFileDetails(fileName: string, instructorId: string): Promise<any> {
    try {
      const response = await this.repository.addFile(fileName, instructorId);
      return response;
    } catch (e: any) {
      console.log(e);
    }
  }
}
