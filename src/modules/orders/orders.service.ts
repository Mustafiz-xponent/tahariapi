// orders.service.ts

import prisma from "@/prisma-client/prismaClient";
import { getErrorMessage } from "@/utils/errorHandler";
import { sendNotification } from "@/utils/sendNotification";
import { getOrderStatusMessage } from "@/utils/getOrderStatusMessage";
import { getBatchAccessibleImageUrls } from "@/utils/fileUpload/s3Aws";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { Order, OrderStatus, Prisma } from "@/generated/prisma/client";
import { CreateOrderDto, UpdateOrderDto } from "@/modules/orders/orders.dto";
import {
  hasInsufficientWalletBalance,
  upcomingDelivery,
} from "@/utils/processSubscription";

// =============================================================================
// Types
// =============================================================================

interface CustomerOrdersResult {
  orders: Order[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface GetAllOrdersQueryParams {
  filters: {
    status?: OrderStatus;
    customerId?: bigint;
    orderId?: bigint;
    search?: string;
    startDate?: string;
    endDate?: string;
  };
  pagination: {
    page: number;
    limit: number;
    skip: number;
    sort: string;
  };
}

// =============================================================================
// Shared: OrderItem select clause
// =============================================================================

const orderItemSelect = {
  orderItemId: true,
  quantity: true,
  unitPrice: true,
  subtotal: true,
  packageSize: true,
  unitType: true,
  product: true,
} as const;

// =============================================================================
// Shared: Process order items with image URLs
// =============================================================================

async function processOrderItems(
  orderItems: Awaited<
    ReturnType<
      typeof prisma.orderItem.findMany<{ select: typeof orderItemSelect }>
    >
  >,
) {
  return Promise.all(
    orderItems.map(async (item) => {
      const accessibleUrls =
        item.product.imageUrls.length > 0
          ? await getBatchAccessibleImageUrls(
              item.product.imageUrls,
              item.product.isPrivateImages,
              300,
            )
          : [];

      return {
        ...item.product,
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        packageSize: item.packageSize,
        unitType: item.unitType,
        price: item.unitPrice,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        accessibleImageUrls: accessibleUrls,
      };
    }),
  );
}

// =============================================================================
// Create Order
// =============================================================================

export async function createOrder(data: CreateOrderDto): Promise<Order> {
  try {
    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { customerId: data.customerId },
      });
      if (!customer) {
        throw new Error("Customer not found");
      }

      const order = await tx.order.create({
        data: {
          status: data.status,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          shippingAddress: data.shippingAddress,
          customerId: data.customerId,
          isSubscription: data.isSubscription ?? false,
          isPreorder: data.isPreorder ?? false,
          preorderDeliveryDate: data.preorderDeliveryDate
            ? new Date(data.preorderDeliveryDate)
            : undefined,
        },
      });

      await tx.orderTracking.create({
        data: {
          orderId: Number(order.orderId),
          status: "PENDING",
          description: "Order created pending",
        },
      });

      return order;
    });
  } catch (error) {
    throw new Error(`Failed to create order: ${getErrorMessage(error)}`);
  }
}

// =============================================================================
// Get All Orders
// =============================================================================

export async function getAllOrders(
  queryParams: GetAllOrdersQueryParams,
): Promise<{
  orders: Order[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}> {
  try {
    const { filters, pagination } = queryParams;
    const { status, customerId, orderId, search, startDate, endDate } = filters;
    const { page, limit, skip, sort } = pagination;

    const whereClause: Prisma.OrderWhereInput = {};

    if (status && Object.values(OrderStatus).includes(status)) {
      whereClause.status = status as OrderStatus;
    }

    if (customerId) whereClause.customerId = customerId;
    if (orderId) whereClause.orderId = orderId;

    // Search support
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchAsNumber = Number(searchTerm);

      whereClause.OR = [
        ...(Number.isInteger(searchAsNumber) && searchAsNumber > 0
          ? [{ orderId: BigInt(searchAsNumber) }]
          : []),
        {
          customer: {
            user: {
              name: {
                contains: searchTerm,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
          },
        },
        {
          customer: {
            user: {
              email: {
                contains: searchTerm,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
          },
        },
        {
          shippingAddress: {
            contains: searchTerm,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
        {
          paymentMethod: {
            contains: searchTerm,
            mode: "insensitive" as Prisma.QueryMode,
          },
        },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        whereClause.createdAt.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          select: orderItemSelect,
        },
        customer: {
          select: {
            user: true,
            customerId: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
    });

    const processedOrders = await Promise.all(
      orders.map(async (order) => {
        const updatedOrderItems = await processOrderItems(order.orderItems);
        return {
          ...order,
          totalAmount: order.totalAmount,
          orderItems: updatedOrderItems,
        };
      }),
    );

    const totalOrders = await prisma.order.count({
      where: whereClause,
    });

    return {
      orders: processedOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalCount: totalOrders,
    };
  } catch (error) {
    throw new Error(`Failed to fetch orders: ${getErrorMessage(error)}`);
  }
}

// =============================================================================
// Get Order By ID
// =============================================================================

export async function getOrderById(orderId: BigInt) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderId: BigInt(orderId.toString()) },
      include: {
        orderItems: {
          select: orderItemSelect,
        },
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const updatedOrderItems = await processOrderItems(order.orderItems);

    return { ...order, orderItems: updatedOrderItems };
  } catch (error) {
    throw new Error(`Failed to fetch order: ${getErrorMessage(error)}`);
  }
}

// =============================================================================
// Update Order
// =============================================================================

// export async function updateOrder(
//   orderId: bigint,
//   data: UpdateOrderDto,
// ): Promise<Order> {
//   try {
//     const currentOrder = await prisma.order.findUnique({
//       where: { orderId },
//       include: {
//         customer: { include: { wallet: true } },
//         orderItems: true,
//       },
//     });
//     if (!currentOrder) throw new Error("Order not found");
//     if (currentOrder.status === "DELIVERED" && data.status) {
//       throw new Error("Cannot update status after it has been delivered.");
//     }

//     // Validate payment status updates
//     if (data.paymentStatus) {
//       // Don't allow changing from COMPLETED to other statuses
//       if (
//         currentOrder.paymentStatus === "COMPLETED" &&
//         data.paymentStatus !== "COMPLETED"
//       ) {
//         throw new Error("Cannot change payment status from COMPLETED");
//       }

//       // Don't allow REFUNDED unless current status is COMPLETED
//       if (
//         data.paymentStatus === "REFUNDED" &&
//         currentOrder.paymentStatus !== "COMPLETED"
//       ) {
//         throw new Error("Can only refund orders with COMPLETED payment status");
//       }

//       // Validate payment status changes for COD orders
//       if (currentOrder.paymentMethod === "COD") {
//         const allowedCODStatuses = ["PENDING", "COMPLETED", "FAILED"];
//         if (!allowedCODStatuses.includes(data.paymentStatus)) {
//           throw new Error(
//             `Invalid payment status for COD orders. Allowed: ${allowedCODStatuses.join(", ")}`,
//           );
//         }
//       }
//     }

//     return await prisma.$transaction(async (tx) => {
//       const isDelivered = data.status === "DELIVERED";
//       const updatedOrder = await tx.order.update({
//         where: { orderId },
//         data: {
//           status: data.status,
//           paymentStatus:
//             data.paymentStatus ??
//             (isDelivered && currentOrder.paymentMethod === "COD"
//               ? "COMPLETED"
//               : currentOrder.paymentStatus),
//           shippingAddress: data.shippingAddress,
//           preorderDeliveryDate: currentOrder.isPreorder
//             ? data.preorderDeliveryDate
//             : currentOrder.preorderDeliveryDate,
//         },
//       });

//       // Handle status tracking
//       if (data.status) {
//         const orderStatusFlow: OrderStatus[] = [
//           "PENDING",
//           "CONFIRMED",
//           "PROCESSING",
//           "SHIPPED",
//           "DELIVERED",
//         ];
//         const currentStatusIndex = orderStatusFlow.indexOf(currentOrder.status);
//         const newStatusIndex = orderStatusFlow.indexOf(data.status);

//         if (data.status === currentOrder.status) {
//           throw new Error(`Order is already ${currentOrder.status}`);
//         }
//         if (newStatusIndex > currentStatusIndex + 1) {
//           throw new Error(
//             `Invalid status transition: Cannot skip status levels from ${currentOrder.status} to ${data.status}`,
//           );
//         }
//         if (newStatusIndex < currentStatusIndex) {
//           await tx.orderTracking.deleteMany({
//             where: {
//               orderId,
//               status: {
//                 in: orderStatusFlow.filter(
//                   (status) => orderStatusFlow.indexOf(status) > newStatusIndex,
//                 ),
//               },
//             },
//           });
//         }
//       }

//       if (data.status && data.status !== currentOrder.status) {
//         const alreadyTracked = await tx.orderTracking.findFirst({
//           where: {
//             orderId,
//             status: data.status,
//           },
//         });
//         if (!alreadyTracked) {
//           await tx.orderTracking.create({
//             data: {
//               orderId,
//               status: data.status,
//               description: `Status updated to ${data.status}`,
//             },
//           });
//         }
//         const message = getOrderStatusMessage(data.status, orderId);
//         await sendNotification(
//           message,
//           "ORDER",
//           "CUSTOMER",
//           currentOrder.customer.userId,
//           tx,
//         );
//       }

//       // Send notification for payment status changes
//       if (
//         data.paymentStatus &&
//         data.paymentStatus !== currentOrder.paymentStatus
//       ) {
//         let paymentMessage = "";
//         switch (data.paymentStatus) {
//           case "COMPLETED":
//             paymentMessage = `Payment for Order #${orderId} has been marked as completed.`;
//             break;
//           case "FAILED":
//             paymentMessage = `Payment for Order #${orderId} has failed. Please contact support.`;
//             break;
//           case "REFUNDED":
//             paymentMessage = `Payment for Order #${orderId} has been refunded.`;
//             break;
//         }

//         if (paymentMessage) {
//           await sendNotification(
//             paymentMessage,
//             "PAYMENT",
//             "CUSTOMER",
//             currentOrder.customer.userId,
//             tx,
//           );
//         }
//       }

//       // Handle delivery for COD orders
//       if (data.status === "DELIVERED" && currentOrder.paymentMethod === "COD") {
//         await Promise.all(
//           currentOrder.orderItems.map(async (item) => {
//             await tx.product.update({
//               where: { productId: item.productId },
//               data: {
//                 stockQuantity: {
//                   decrement: item.quantity * item.packageSize,
//                 },
//               },
//             });

//             await tx.stockTransaction.create({
//               data: {
//                 quantity: item.quantity * item.packageSize,
//                 transactionType: "OUT",
//                 productId: item.productId,
//                 orderId: Number(orderId),
//                 description: `Stock reduced for Order #${orderId}`,
//               },
//             });
//           }),
//         );

//         // Auto-complete payment if not already done
//         if (currentOrder.paymentStatus !== "COMPLETED") {
//           await tx.payment.update({
//             where: { orderId, paymentMethod: "COD" },
//             data: {
//               paymentStatus: "COMPLETED",
//             },
//           });
//         }
//       }

//       // Handle subscription orders
//       if (currentOrder.isSubscription) {
//         const updatedSubscriptionDelivery =
//           await tx.subscriptionDelivery.update({
//             where: { orderId },
//             data: { status: data.status },
//           });
//         if (data.status === "DELIVERED") {
//           const subscriptionId = updatedSubscriptionDelivery.subscriptionId;
//           const delivery = await upcomingDelivery(tx, subscriptionId);
//           let nextDeliveryDate: Date | null;
//           if (delivery) {
//             nextDeliveryDate = delivery.deliveryDate;
//           } else {
//             nextDeliveryDate = null;
//           }
//           await tx.subscription.update({
//             where: { subscriptionId },
//             data: { nextDeliveryDate },
//           });
//         }
//         if (
//           currentOrder.paymentMethod === "WALLET" &&
//           data.status === "DELIVERED"
//         ) {
//           if (
//             hasInsufficientWalletBalance(
//               currentOrder.customer.wallet,
//               currentOrder.totalAmount,
//             )
//           ) {
//             throw new Error(`Insufficient wallet balance`);
//           }
//           await tx.wallet.update({
//             where: { walletId: currentOrder.customer.wallet?.walletId },
//             data: {
//               lockedBalance: { decrement: currentOrder.totalAmount },
//               balance: { decrement: currentOrder.totalAmount },
//             },
//           });
//           await tx.walletTransaction.update({
//             where: { orderId },
//             data: {
//               transactionStatus: "COMPLETED",
//               description: `Payment completed for order #${currentOrder.orderId}`,
//             },
//           });
//           await tx.payment.update({
//             where: { orderId },
//             data: { paymentStatus: "COMPLETED" },
//           });
//         }
//       }

//       return updatedOrder;
//     });
//   } catch (error) {
//     throw new Error(`Failed to update order: ${getErrorMessage(error)}`);
//   }
// }

// =============================================================================
// Update Order
// =============================================================================

export async function updateOrder(
  orderId: bigint,
  data: UpdateOrderDto,
): Promise<Order> {
  try {
    const currentOrder = await prisma.order.findUnique({
      where: { orderId },
      include: {
        customer: { include: { wallet: true } },
        orderItems: true,
      },
    });
    if (!currentOrder) throw new Error("Order not found");
    if (currentOrder.status === "DELIVERED" && data.status) {
      throw new Error("Cannot update status after it has been delivered.");
    }

    // Validate payment status updates
    if (data.paymentStatus) {
      // Don't allow changing from COMPLETED to other statuses
      if (
        currentOrder.paymentStatus === "COMPLETED" &&
        data.paymentStatus !== "COMPLETED"
      ) {
        throw new Error("Cannot change payment status from COMPLETED");
      }

      // Don't allow REFUNDED unless current status is COMPLETED
      if (
        data.paymentStatus === "REFUNDED" &&
        currentOrder.paymentStatus !== "COMPLETED"
      ) {
        throw new Error("Can only refund orders with COMPLETED payment status");
      }

      // Validate payment status changes for COD orders
      if (currentOrder.paymentMethod === "COD") {
        const allowedCODStatuses = ["PENDING", "COMPLETED", "FAILED"];
        if (!allowedCODStatuses.includes(data.paymentStatus)) {
          throw new Error(
            `Invalid payment status for COD orders. Allowed: ${allowedCODStatuses.join(", ")}`,
          );
        }
      }
    }

    return await prisma.$transaction(async (tx) => {
      const isDelivered = data.status === "DELIVERED";

      // Update order - NO automatic payment status change
      const updatedOrder = await tx.order.update({
        where: { orderId },
        data: {
          status: data.status,
          paymentStatus: data.paymentStatus, // Only update if explicitly provided
          shippingAddress: data.shippingAddress,
          preorderDeliveryDate: currentOrder.isPreorder
            ? data.preorderDeliveryDate
            : currentOrder.preorderDeliveryDate,
        },
      });

      // Handle status tracking
      if (data.status) {
        const orderStatusFlow: OrderStatus[] = [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
        ];
        const currentStatusIndex = orderStatusFlow.indexOf(currentOrder.status);
        const newStatusIndex = orderStatusFlow.indexOf(data.status);

        if (data.status === currentOrder.status) {
          throw new Error(`Order is already ${currentOrder.status}`);
        }
        if (newStatusIndex > currentStatusIndex + 1) {
          throw new Error(
            `Invalid status transition: Cannot skip status levels from ${currentOrder.status} to ${data.status}`,
          );
        }
        if (newStatusIndex < currentStatusIndex) {
          await tx.orderTracking.deleteMany({
            where: {
              orderId,
              status: {
                in: orderStatusFlow.filter(
                  (status) => orderStatusFlow.indexOf(status) > newStatusIndex,
                ),
              },
            },
          });
        }
      }

      if (data.status && data.status !== currentOrder.status) {
        const alreadyTracked = await tx.orderTracking.findFirst({
          where: {
            orderId,
            status: data.status,
          },
        });
        if (!alreadyTracked) {
          await tx.orderTracking.create({
            data: {
              orderId,
              status: data.status,
              description: `Status updated to ${data.status}`,
            },
          });
        }
        const message = getOrderStatusMessage(data.status, orderId);
        await sendNotification(
          message,
          "ORDER",
          "CUSTOMER",
          currentOrder.customer.userId,
          tx,
        );
      }

      // Send notification for payment status changes
      if (
        data.paymentStatus &&
        data.paymentStatus !== currentOrder.paymentStatus
      ) {
        let paymentMessage = "";
        switch (data.paymentStatus) {
          case "COMPLETED":
            paymentMessage = `Payment for Order #${orderId} has been marked as completed.`;
            break;
          case "FAILED":
            paymentMessage = `Payment for Order #${orderId} has failed. Please contact support.`;
            break;
          case "REFUNDED":
            paymentMessage = `Payment for Order #${orderId} has been refunded.`;
            break;
        }

        if (paymentMessage) {
          await sendNotification(
            paymentMessage,
            "PAYMENT",
            "CUSTOMER",
            currentOrder.customer.userId,
            tx,
          );
        }
      }

      // Handle stock reduction when delivered (regardless of payment status)
      if (data.status === "DELIVERED" && currentOrder.status !== "DELIVERED") {
        await Promise.all(
          currentOrder.orderItems.map(async (item) => {
            await tx.product.update({
              where: { productId: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity * item.packageSize,
                },
              },
            });

            await tx.stockTransaction.create({
              data: {
                quantity: item.quantity * item.packageSize,
                transactionType: "OUT",
                productId: item.productId,
                orderId: Number(orderId),
                description: `Stock reduced for Order #${orderId}`,
              },
            });
          }),
        );
      }

      // Update Payment table when payment status is explicitly updated
      if (
        data.paymentStatus &&
        data.paymentStatus !== currentOrder.paymentStatus
      ) {
        const payment = await tx.payment.findUnique({
          where: { orderId },
        });

        if (payment) {
          await tx.payment.update({
            where: { orderId },
            data: {
              paymentStatus: data.paymentStatus,
            },
          });
        }
      }

      // Handle subscription orders
      if (currentOrder.isSubscription) {
        const updatedSubscriptionDelivery =
          await tx.subscriptionDelivery.update({
            where: { orderId },
            data: { status: data.status },
          });
        if (data.status === "DELIVERED") {
          const subscriptionId = updatedSubscriptionDelivery.subscriptionId;
          const delivery = await upcomingDelivery(tx, subscriptionId);
          let nextDeliveryDate: Date | null;
          if (delivery) {
            nextDeliveryDate = delivery.deliveryDate;
          } else {
            nextDeliveryDate = null;
          }
          await tx.subscription.update({
            where: { subscriptionId },
            data: { nextDeliveryDate },
          });
        }

        // Handle wallet payment for subscription orders when delivered
        if (
          currentOrder.paymentMethod === "WALLET" &&
          data.status === "DELIVERED" &&
          currentOrder.status !== "DELIVERED"
        ) {
          if (
            hasInsufficientWalletBalance(
              currentOrder.customer.wallet,
              currentOrder.totalAmount,
            )
          ) {
            throw new Error(`Insufficient wallet balance`);
          }
          await tx.wallet.update({
            where: { walletId: currentOrder.customer.wallet?.walletId },
            data: {
              lockedBalance: { decrement: currentOrder.totalAmount },
              balance: { decrement: currentOrder.totalAmount },
            },
          });
          await tx.walletTransaction.update({
            where: { orderId },
            data: {
              transactionStatus: "COMPLETED",
              description: `Payment completed for order #${currentOrder.orderId}`,
            },
          });
          // For wallet payments, auto-complete when delivered
          await tx.payment.update({
            where: { orderId },
            data: { paymentStatus: "COMPLETED" },
          });
        }
      }

      return updatedOrder;
    });
  } catch (error) {
    throw new Error(`Failed to update order: ${getErrorMessage(error)}`);
  }
}

// =============================================================================
// Delete Order
// =============================================================================

export async function deleteOrder(orderId: BigInt): Promise<void> {
  try {
    await prisma.order.delete({
      where: { orderId: Number(orderId) },
    });
  } catch (error) {
    throw new Error(`Failed to delete order: ${getErrorMessage(error)}`);
  }
}

// =============================================================================
// Get Customer Orders
// =============================================================================

export async function getCustomerOrders({
  userId,
  page,
  limit,
  sort,
  statusArray,
  skip,
}: {
  userId: BigInt;
  page: number;
  limit: number;
  sort: string;
  statusArray: string[];
  skip: number;
}): Promise<CustomerOrdersResult> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { userId: Number(userId) },
      select: { customerId: true },
    });
    if (!customer) {
      throw new Error("Customer not found");
    }

    const orders = await prisma.order.findMany({
      where: {
        customerId: customer.customerId,
        ...(statusArray.length > 0 && {
          status: { in: statusArray as OrderStatus[] },
        }),
      },
      include: {
        orderItems: {
          select: orderItemSelect,
        },
      },
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: sort === "asc" ? "asc" : "desc",
      },
    });

    if (!orders) {
      throw new Error("Orders not found");
    }

    const processedOrders = await Promise.all(
      orders.map(async (order) => {
        const updatedOrderItems = await processOrderItems(order.orderItems);
        return {
          ...order,
          totalAmount: order.totalAmount,
          orderItems: updatedOrderItems,
        };
      }),
    );

    const totalOrders = await prisma.order.count({
      where: {
        customerId: customer.customerId,
        ...(statusArray.length > 0 && {
          status: { in: statusArray as OrderStatus[] },
        }),
      },
    });

    return {
      orders: processedOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalCount: totalOrders,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch customer orders: ${getErrorMessage(error)}`,
    );
  }
}

/**
 * Get orders with pending payment
 */
export async function getDueOrders({
  filters,
  pagination,
}: {
  filters: { paymentStatus: string; search?: string };
  pagination: { page: number; limit: number; skip: number; sort: string };
}): Promise<{
  orders: Order[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}> {
  try {
    const { paymentStatus, search } = filters;
    const { page, limit, skip, sort } = pagination;

    const whereClause: Prisma.OrderWhereInput = {
      paymentStatus: "PENDING",
    };

    // Search support
    if (search && search.length >= 2) {
      const searchTerm = search.trim();
      const searchAsNumber = Number(searchTerm);

      whereClause.OR = [
        ...(Number.isInteger(searchAsNumber) && searchAsNumber > 0
          ? [{ orderId: BigInt(searchAsNumber) }]
          : []),
        {
          customer: {
            user: {
              name: {
                contains: searchTerm,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
          },
        },
        {
          customer: {
            user: {
              email: {
                contains: searchTerm,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
          },
        },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        orderId: true,
        status: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        shippingAddress: true,
        createdAt: true,
        updatedAt: true,
        orderItems: {
          select: orderItemSelect,
        },
        customer: {
          select: {
            customerId: true,
            user: {
              select: {
                userId: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
    });

    const processedOrders = await Promise.all(
      orders.map(async (order) => {
        const updatedOrderItems = await processOrderItems(order.orderItems);
        return {
          ...order,
          totalAmount: order.totalAmount,
          orderItems: updatedOrderItems,
        };
      }),
    );

    const totalOrders = await prisma.order.count({
      where: whereClause,
    });

    return {
      orders: processedOrders as any,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalCount: totalOrders,
    };
  } catch (error) {
    throw new Error(`Failed to fetch due orders: ${getErrorMessage(error)}`);
  }
}

/**
 * Send payment reminder notification
 */
export async function sendPaymentReminder(orderId: bigint): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus !== "PENDING") {
      throw new Error("Payment already completed for this order");
    }

    await prisma.$transaction(async (tx) => {
      // Send notification
      const message = `Gentle reminder: Your payment of ৳${order.totalAmount} for Order #${orderId} is pending. Please complete the payment at your earliest convenience.`;

      await sendNotification(
        message,
        "PAYMENT",
        "CUSTOMER",
        order.customer.userId,
        tx,
      );
    });
  } catch (error) {
    throw new Error(
      `Failed to send payment reminder: ${getErrorMessage(error)}`,
    );
  }
}

/**
 * Generate order bill PDF using HTML
 */
export async function generateOrderBillPDF(orderId: bigint): Promise<Buffer> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Generate HTML invoice
    const itemsHTML = order.orderItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">৳${item.unitPrice}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">৳${item.subtotal}</td>
        </tr>
      `,
      )
      .join("");

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            background: white;
            padding: 20px;
            line-height: 1.4;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
          }
          .header h1 { font-size: 24px; color: #333; }
          .header p { font-size: 14px; color: #666; }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            font-size: 12px;
          }
          .info-grid strong { display: block; color: #333; margin-bottom: 3px; }
          .info-grid span { color: #666; }
          .customer-info {
            margin-bottom: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            font-size: 12px;
          }
          .customer-info h3 { font-size: 13px; margin-bottom: 10px; color: #333; }
          .customer-info p { margin-bottom: 5px; color: #666; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          thead { background: #333; color: white; }
          th { padding: 8px; text-align: left; font-size: 11px; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .total {
            text-align: right;
            font-size: 16px;
            font-weight: bold;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .footer {
            text-align: center;
            padding-top: 15px;
            border-top: 2px solid #333;
            font-size: 10px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TOHORI FOODS</h1>
            <p>INVOICE</p>
          </div>

          <div class="info-grid">
            <div>
              <strong>Order ID:</strong>
              <span>#${order.orderId}</span>
            </div>
            <div>
              <strong>Order Date:</strong>
              <span>${orderDate}</span>
            </div>
            <div>
              <strong>Order Status:</strong>
              <span>${order.status}</span>
            </div>
            <div>
              <strong>Payment Status:</strong>
              <span>${order.paymentStatus}</span>
            </div>
          </div>

          <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${order.customer.user.name || "N/A"}</p>
            <p><strong>Phone:</strong> ${order.customer.user.phone || "N/A"}</p>
            <p><strong>Email:</strong> ${order.customer.user.email || "N/A"}</p>
            <p><strong>Address:</strong> ${order.shippingAddress || "N/A"}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="total">
            TOTAL: ৳${order.totalAmount}
          </div>

          <div class="footer">
            <p>Thank you for your order!</p>
            <p>Contact: support@tohorifoods.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use puppeteer to convert HTML to PDF
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: { top: 8, bottom: 8, left: 8, right: 8 },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (error) {
    throw new Error(`Failed to generate bill PDF: ${getErrorMessage(error)}`);
  }
}

/**
 * Send bill to customer email
 */
export async function sendBillToEmail(orderId: bigint): Promise<void> {
  try {
    // Debug: Check env values
    console.log("[sendBillToEmail] SMTP Config:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM,
      passExists: !!process.env.SMTP_PASS,
    });
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (!order.customer.user.email) {
      throw new Error("Customer email not found");
    }

    // Generate PDF
    const pdfBuffer = await generateOrderBillPDF(orderId);

    // Generate items HTML for email body
    const itemsHTML = order.orderItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">৳${item.unitPrice}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">৳${item.subtotal}</td>
        </tr>
      `,
      )
      .join("");

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email with PDF attachment
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@tohorifoods.com",
      to: order.customer.user.email,
      subject: `Invoice for Order #${orderId} - Tohori Foods`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333;">
            <h1 style="font-size: 24px; color: #333; margin: 0;">TOHORI FOODS</h1>
            <p style="font-size: 14px; color: #666; margin: 5px 0;">Invoice</p>
          </div>
          
          <p style="color: #333;">Dear ${order.customer.user.name},</p>
          <p style="color: #666;">Please find attached the invoice for your order.</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order ID:</strong> #${orderId}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDate}</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> ৳${order.totalAmount}</p>
            <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            <p style="margin: 5px 0;"><strong>Order Status:</strong> ${order.status}</p>
          </div>

          <h3 style="color: #333; margin-bottom: 10px;">Order Items:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #333; color: white;">
                <th style="padding: 8px; text-align: left; font-size: 12px;">Item</th>
                <th style="padding: 8px; text-align: center; font-size: 12px;">Qty</th>
                <th style="padding: 8px; text-align: right; font-size: 12px;">Price</th>
                <th style="padding: 8px; text-align: right; font-size: 12px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div style="background: #e8f4f8; padding: 15px; border-radius: 5px; text-align: right; margin-bottom: 20px;">
            <p style="font-size: 18px; font-weight: bold; color: #333; margin: 0;">Total: ৳${order.totalAmount}</p>
          </div>

          <p style="color: #333;">Thank you for choosing Tohori Foods!</p>
          
          <div style="text-align: center; padding-top: 15px; border-top: 1px solid #eee; margin-top: 20px;">
            <p style="color: #666; font-size: 12px;">Tohori Foods Team</p>
            <p style="color: #666; font-size: 11px;">Contact: support@tohorifoods.com</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${orderId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log(
      `[sendBillToEmail] Email sent to ${order.customer.user.email} for order #${orderId}`,
    );
  } catch (error) {
    console.error("[sendBillToEmail] Error:", error);
    throw new Error(`Failed to send bill email: ${getErrorMessage(error)}`);
  }
}
