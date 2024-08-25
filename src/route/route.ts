import express, { Application } from "express";
import { isValidated } from "../middleware/authMiddleware";
import multer from "multer";
import { TranscoderRepository } from "../repository/transcoder.repository";
import { TranscoderService } from "../services/transcoder.service";
import TranscoderController from "../controller/transcoderController";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const repository = new TranscoderRepository();
const service = new TranscoderService(repository);
const controller = new TranscoderController(service);

const TranscoderRoute: Application = express();

TranscoderRoute.post(
  "/",
  isValidated,
  upload.single("file"),
  controller.transcodeData.bind(controller)
);

TranscoderRoute.get(
  "/getData",
  isValidated,
  controller.getData.bind(controller)
);
TranscoderRoute.delete(
  "/deleteData/:id",
  isValidated,
  controller.deleteData.bind(controller)
);

export default TranscoderRoute;
