import { Transcoder } from "../model/transcoder.entities";

export interface ITranscoderService {
  addFileDetails(
    fileName: string,
    instructorId: string
  ): Promise<Transcoder | null>;
  getData(id: string): Promise<Transcoder | null>;
  transcodeMedia(file: File, id: String): any;
  deleteData(id: string): Promise<Transcoder | null>;
}
