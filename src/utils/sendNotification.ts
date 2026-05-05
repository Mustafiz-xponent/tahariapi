// import { getOnlineAdminSupportSockets, getSocketId, io } from "@/utils/socket";
// import { NotificationType } from "@/generated/prisma/client";
// import prisma from "@/prisma-client/prismaClient";
// import { Prisma } from "@prisma/client";

// export const sendNotification = async (
//   message: string,
//   type: NotificationType,
//   notify: "CUSTOMER" | "ADMIN_SUPPORT",
//   receiverId?: bigint | null,
//   tx?: Prisma.TransactionClient
// ) => {
//   // pick transaction client if provided, otherwise use prisma
//   const db = tx ?? prisma;
//   const notification = await db.notification.create({
//     data: {
//       message: message.replace(/\s+/g, " ").trim(),
//       receiverId: receiverId ? receiverId : null,
//       type,
//     },
//   });
//   if (notify === "CUSTOMER") {
//     const receiverSocketId = getSocketId(String(receiverId));
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newNotification", notification);
//     }
//   }

//   if (notify === "ADMIN_SUPPORT") {
//     getOnlineAdminSupportSockets().forEach((socketId) => {
//       io.to(socketId).emit("newNotification", notification);
//     });
//   }
// };

// ----------------------------- 222222222222 ------------
import { getOnlineAdminSupportSockets, getSocketId, io } from "@/utils/socket";
import { Prisma } from "@/generated/prisma/client";
import { getErrorMessage } from "@/utils/errorHandler";
import { sendPushNotification } from "@/services/pushNotification.service";
import { NotificationType } from "@/generated/prisma/client";

type ReceiverType =
  | "CUSTOMER"
  | "ADMIN"
  | "SUPER_ADMIN"
  | "ALL_ADMINS"
  | "ADMIN_SUPPORT";

export async function sendNotification(
  message: string,
  type: NotificationType,
  receiverType: ReceiverType,
  receiverId: bigint | null,
  tx: Prisma.TransactionClient,
) {
  try {
    let receiverIds: bigint[] = [];

    // Determine which users should receive the notification
    if (receiverType === "CUSTOMER" && receiverId) {
      receiverIds = [receiverId];
    } else if (receiverType === "ADMIN" || receiverType === "SUPER_ADMIN") {
      if (receiverId) {
        receiverIds = [receiverId];
      }
    } else if (
      receiverType === "ALL_ADMINS" ||
      receiverType === "ADMIN_SUPPORT"
    ) {
      const admins = await tx.user.findMany({
        where: {
          role: { in: ["ADMIN", "SUPER_ADMIN", "SUPPORT"] },
          status: "ACTIVE",
        },
        select: { userId: true },
      });
      receiverIds = admins.map((admin) => admin.userId);
    }

    // Create notifications in database
    const notifications = await Promise.all(
      receiverIds.map((id) =>
        tx.notification.create({
          data: {
            message: message.replace(/\s+/g, " ").trim(),
            type,
            receiverId: id,
            status: "UNREAD",
            isSeen: false,
          },
        }),
      ),
    );

    // ✅ Socket.io real-time notifications (in-app)
    if (receiverType === "CUSTOMER" && receiverId) {
      const receiverSocketId = getSocketId(String(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newNotification", notifications[0]);
      }
    }

    if (receiverType === "ADMIN_SUPPORT" || receiverType === "ALL_ADMINS") {
      getOnlineAdminSupportSockets().forEach((socketId) => {
        io.to(socketId).emit("newNotification", notifications[0]);
      });
    }

    // ✅ Push notifications asynchronously (background/terminated)
    Promise.all(
      receiverIds.map(async (userId) => {
        try {
          const pushTitle = getPushNotificationTitle(type);
          await sendPushNotification({
            userId,
            notification: {
              title: pushTitle,
              body: message,
              data: {
                notificationType: type,
                link: getNotificationLink(type, message),
              },
            },
            notificationType: type,
          });
        } catch (error) {
          console.error(
            `❌ Failed to send push notification to user ${userId}:`,
            getErrorMessage(error),
          );
          // Don't throw - push notification failure shouldn't break the flow
        }
      }),
    ).catch((error) => {
      console.error(
        "❌ Error in push notification batch:",
        getErrorMessage(error),
      );
    });

    return notifications;
  } catch (error) {
    console.error("❌ Error sending notification:", getErrorMessage(error));
    throw new Error(`Failed to send notification: ${getErrorMessage(error)}`);
  }
}

/**
 * Get push notification title based on type
 */
function getPushNotificationTitle(type: NotificationType): string {
  const titles: Record<NotificationType, string> = {
    ORDER: "📦 Order Update",
    PAYMENT: "💳 Payment Notification",
    WALLET: "💰 Wallet Update",
    SUBSCRIPTION: "🔔 Subscription Update",
    INVENTORY: "📊 Inventory Alert",
    PROMOTION: "🎉 Special Offer",
    SYSTEM_ALERT: "🔔 Tohori Foods",
    REFUND: "💸 Refund Processed",
  };
  return titles[type] || "🔔 Tohori Foods";
}

/**
 * Get notification link for deep linking
 */
function getNotificationLink(type: NotificationType, message: string): string {
  // Extract order ID from message if present (e.g., "Order #123")
  const orderIdMatch = message.match(/#(\d+)/);
  const orderId = orderIdMatch ? orderIdMatch[1] : null;

  const links: Record<NotificationType, string> = {
    ORDER: orderId ? `/orders/${orderId}` : "/orders",
    PAYMENT: orderId ? `/orders/${orderId}` : "/wallet",
    WALLET: "/wallet",
    SUBSCRIPTION: "/subscriptions",
    INVENTORY: "/inventory",
    PROMOTION: "/deals",
    SYSTEM_ALERT: "/notifications",
    REFUND: "/wallet",
  };
  return links[type] || "/";
}
