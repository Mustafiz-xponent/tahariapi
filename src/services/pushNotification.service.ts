import admin from "@/services/firebaseAdmin";
import prisma from "@/prisma-client/prismaClient";
import { getErrorMessage } from "@/utils/errorHandler";
import { NotificationType } from "@/generated/prisma/client";

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface SendPushNotificationParams {
  userId: bigint;
  notification: PushNotificationPayload;
  notificationType?: NotificationType;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification({
  userId,
  notification,
  notificationType,
}: SendPushNotificationParams): Promise<void> {
  try {
    // Get user's FCM tokens from database
    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        userId: BigInt(userId),
        isActive: true,
      },
      select: {
        token: true,
        deviceId: true,
      },
    });

    if (deviceTokens.length === 0) {
      console.log(`📱 No active device tokens found for user ${userId}`);
      return;
    }

    const tokens = deviceTokens.map((dt) => dt.token);

    // Prepare the message
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      data: {
        type: notificationType || "SYSTEM_ALERT",
        userId: userId.toString(),
        timestamp: new Date().toISOString(),
        ...notification.data,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "high_importance_channel",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
            alert: {
              title: notification.title,
              body: notification.body,
            },
          },
        },
        headers: {
          "apns-priority": "10",
        },
      },
    };

    // Send the message
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(
      `✅ Push notification sent: ${response.successCount} successful, ${response.failureCount} failed`
    );

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error(
            `❌ Failed to send to token ${tokens[idx]}:`,
            resp.error?.message
          );
        }
      });

      // Remove invalid tokens from database
      await prisma.deviceToken.updateMany({
        where: {
          token: { in: failedTokens },
          userId: BigInt(userId),
        },
        data: {
          isActive: false,
        },
      });
    }
  } catch (error) {
    console.error("❌ Error sending push notification:", getErrorMessage(error));
    // Don't throw - push notification failure shouldn't break the flow
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendBulkPushNotification({
  userIds,
  notification,
  notificationType,
}: {
  userIds: bigint[];
  notification: PushNotificationPayload;
  notificationType?: NotificationType;
}): Promise<void> {
  try {
    const promises = userIds.map((userId) =>
      sendPushNotification({ userId, notification, notificationType })
    );

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("❌ Error sending bulk push notifications:", getErrorMessage(error));
  }
}

/**
 * Send topic-based push notification
 */
export async function sendTopicPushNotification({
  topic,
  notification,
  notificationType,
}: {
  topic: string;
  notification: PushNotificationPayload;
  notificationType?: NotificationType;
}): Promise<void> {
  try {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
      },
      data: {
        type: notificationType || "SYSTEM_ALERT",
        timestamp: new Date().toISOString(),
        ...notification.data,
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "high_importance_channel",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Topic notification sent successfully:", response);
  } catch (error) {
    console.error("❌ Error sending topic notification:", getErrorMessage(error));
  }
}

/**
 * Subscribe user to a topic
 */
export async function subscribeToTopic(
  tokens: string[],
  topic: string
): Promise<void> {
  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    console.log(`✅ Successfully subscribed to topic ${topic}:`, response);
  } catch (error) {
    console.error("❌ Error subscribing to topic:", getErrorMessage(error));
  }
}

/**
 * Unsubscribe user from a topic
 */
export async function unsubscribeFromTopic(
  tokens: string[],
  topic: string
): Promise<void> {
  try {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    console.log(`✅ Successfully unsubscribed from topic ${topic}:`, response);
  } catch (error) {
    console.error("❌ Error unsubscribing from topic:", getErrorMessage(error));
  }
}
