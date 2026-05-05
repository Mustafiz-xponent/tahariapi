import { z } from "zod";
import { Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "@/utils/sendResponse";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import {
  getUserDeviceTokens,
  registerDeviceToken,
  sendTestPushNotification,
  unregisterDeviceToken,
} from "./deviceTokens.service";

const registerTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  deviceId: z.string().optional(),
  deviceType: z.enum(["android", "ios"]).optional(),
});

const unregisterTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

/**
 * Register FCM token for push notifications
 */
export const registerToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = BigInt(req.user?.userId!);
    const data = registerTokenSchema.parse(req.body);

    await registerDeviceToken({
      userId,
      token: data.token,
      deviceId: data.deviceId,
      deviceType: data.deviceType,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Device token registered successfully",
    });
  } catch (error) {
    handleErrorResponse(error, res, "register device token");
  }
};

/**
 * Unregister FCM token
 */
export const unregisterToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = BigInt(req.user?.userId!);
    const data = unregisterTokenSchema.parse(req.body);

    await unregisterDeviceToken(userId, data.token);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Device token unregistered successfully",
    });
  } catch (error) {
    handleErrorResponse(error, res, "unregister device token");
  }
};

/**
 * Get all registered tokens for current user
 */
export const getMyTokens = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = BigInt(req.user?.userId!);
    const tokens = await getUserDeviceTokens(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Device tokens retrieved successfully",
      data: tokens,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch device tokens");
  }
};

/**
 * Send test push notification
 */
export const sendTestNotification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = BigInt(req.user?.userId!);

    await sendTestPushNotification(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Test notification sent successfully",
    });
  } catch (error) {
    handleErrorResponse(error, res, "send test notification");
  }
};
