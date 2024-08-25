import compression from "compression";
import cors from "cors";
import express from "express";
import { Application } from "express";
import helmet from "helmet";
import logger from "morgan";
import TranscoderRoute from "./route/route";
import cookieParse from "cookie-parser";
import { connectDB } from "./config/mongodb.config";

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.applyMiddleware();
    this.routes();
    connectDB();
  }

  private applyMiddleware(): void {
    this.app.use(express.json());
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      })
    );
    this.app.use(compression());
    this.app.use(helmet());
    this.app.use(logger("dev"));
    this.app.use(cookieParse());
  }

  private routes(): void {
    this.app.use("/api/transcode", TranscoderRoute);
  }

  public startServer(port: number): void {
    this.app.listen(port, () => {
      console.log(`Transcoder service started on ${port}`);
    });
  }
}

export default App;
