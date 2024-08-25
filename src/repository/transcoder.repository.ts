import { Data, ITranscoderRepository } from "../interfaces/iTransRepository";
import TranscoderModel from "../model/schema/transcoder.schema";
import { Status, Transcoder } from "../model/transcoder.entities";

export class TranscoderRepository implements ITranscoderRepository {
  async deleteData(id: string): Promise<Transcoder | null> {
    try {
      const response = await TranscoderModel.findByIdAndDelete(id);
      return response;
    } catch (e: any) {
      throw new Error("DB Error");
    }
  }

  async updateStatus(
    id: string,
    status: Status,
    data: Data
  ): Promise<Transcoder | null> {
    try {
      const videoData = await TranscoderModel.findByIdAndUpdate(id, {
        status,
        ...data,
      });
      return videoData;
    } catch (e: any) {
      throw new Error("DB Error");
    }
  }

  async getData(id: string): Promise<Transcoder | null | any> {
    try {
      const response = await TranscoderModel.find({ instructorId: id });
      return response;
    } catch (e: any) {
      throw new Error("DB Error");
    }
  }

  async addFile(
    fileName: string,
    instructorId: string
  ): Promise<Transcoder | any> {
    try {
      const response = await TranscoderModel.create({
        fileName,
        status: Status.transcoding,
        instructorId,
      });
      return response;
    } catch (e: any) {
      throw new Error("DB Error");
    }
  }
}
