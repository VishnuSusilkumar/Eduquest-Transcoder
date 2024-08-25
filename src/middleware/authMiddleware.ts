import { NextFunction, Response } from "express";
import { CustomRequest } from "../interfaces/custom";
import authRabbitMQClient from "../config/rabbitmq/client";
import { statusCode } from "../utils/constants/enums";
import AsyncHandler from "express-async-handler";

export const isValidated = AsyncHandler(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;

    try {
      const response: any = await authRabbitMQClient.produce(
        { token },
        "isAuthenticated"
      );
      const result = JSON.parse(response.content.toString());

      if (!result || !result.userId) {
        res
          .status(statusCode.Unauthorized)
          .json({ success: false, message: "Unauthorized" });
        return;
      }

      req.userId = result.userId;
      req.role = result.role;
      next();
    } catch (err: any) {
      res
        .status(statusCode.Unauthorized)
        .json({ success: false, message: err.message });
    }
  }
);
