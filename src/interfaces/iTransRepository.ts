import { Status, Transcoder } from "../model/transcoder.entities";

export interface ITranscoderRepository {
  addFile(fileData: string, instructorId: string): Promise<Object | null>;
  getData(id: string): Promise<Transcoder | null>;
  updateStatus(
    id: string,
    status: Status,
    { subtitleUrl, videoUrl, generatedName }: Data
  ): Promise<Transcoder | null>;
  deleteData(id: string): Promise<Transcoder | null>;
}

export interface Data {
  generatedName?: string;
  subtitleUrl?: string;
  videoUrl?: string;
}
