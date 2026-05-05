import prisma from "@/prisma-client/prismaClient";
import { getErrorMessage } from "@/utils/errorHandler";
import { sendPushNotification } from "@/services/pushNotification.service";

interface RegisterDeviceTokenParams {
  userId: bigint;
  token: string;
  deviceId?: string;
  deviceType?: string;
}

/**
 * Register or update device token
 */
export async function registerDeviceToken({
  userId,
  token,
  deviceId,
  deviceType,
}: RegisterDeviceTokenParams) {
  try {
    // Check if token already exists
    const existingToken = await prisma.deviceToken.findUnique({
      where: { token },
    });

    if (existingToken) {
      // Update existing token
      return await prisma.deviceToken.update({
        where: { token },
        data: {
          userId,
          deviceId,
          deviceType,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    }

    // Create new token
    return await prisma.deviceToken.create({
      data: {
        userId,
        token,
        deviceId,
        deviceType,
        isActive: true,
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to register device token: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Unregister device token
 */
export async function unregisterDeviceToken(userId: bigint, token: string) {
  try {
    await prisma.deviceToken.updateMany({
      where: {
        userId,
        token,
      },
      data: {
        isActive: false,
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to unregister device token: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Get all active tokens for a user
 */
export async function getUserDeviceTokens(userId: bigint) {
  try {
    return await prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        tokenId: true,
        token: true,
        deviceId: true,
        deviceType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to fetch device tokens: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Send test push notification
 */
export async function sendTestPushNotification(userId: bigint) {
  try {
    await sendPushNotification({
      userId,
      notification: {
        title: "Test Notification 🎉",
        body: "This is a test push notification from Tohori Foods!",
        data: {
          type: "SYSTEM_ALERT",
          link: "/",
        },
      },
      notificationType: "SYSTEM_ALERT",
    });
  } catch (error) {
    throw new Error(
      `Failed to send test notification: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Clean up inactive tokens older than 30 days
 */
export async function cleanupInactiveTokens() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.deviceToken.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`🧹 Cleaned up ${result.count} inactive device tokens`);
    return result;
  } catch (error) {
    console.error("❌ Failed to cleanup inactive tokens:", getErrorMessage(error));
  }
}
