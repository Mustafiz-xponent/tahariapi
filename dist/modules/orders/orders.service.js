"use strict";
// /**
//  * Controller layer for Order entity operations.
//  * Handles HTTP requests and responses for order-related endpoints.
//  */
// import prisma from "@/prisma-client/prismaClient";
// import { getErrorMessage } from "@/utils/errorHandler";
// import { sendNotification } from "@/utils/sendNotification";
// import { getOrderStatusMessage } from "@/utils/getOrderStatusMessage";
// import { getBatchAccessibleImageUrls } from "@/utils/fileUpload/s3Aws";
// import { Order, OrderStatus, Prisma } from "@/generated/prisma/client";
// import { CreateOrderDto, UpdateOrderDto } from "@/modules/orders/orders.dto";
// import {
//   hasInsufficientWalletBalance,
//   upcomingDelivery,
// } from "@/utils/processSubscription";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.getAllOrders = getAllOrders;
exports.getOrderById = getOrderById;
exports.updateOrder = updateOrder;
exports.deleteOrder = deleteOrder;
exports.getCustomerOrders = getCustomerOrders;
// interface CustomerOrdersResult {
//   orders: Order[];
//   totalCount: number;
//   totalPages: number;
//   currentPage: number;
// }
// /**
//  * Create a new order
//  * @param data - Data required to create an order
//  * @returns The created order
//  * @throws Error if the order cannot be created (e.g., invalid customerId)
//  */
// export async function createOrder(data: CreateOrderDto): Promise<Order> {
//   try {
//     return await prisma.$transaction(async (tx) => {
//       //  Validate customer
//       const customer = await tx.customer.findUnique({
//         where: { customerId: data.customerId },
//       });
//       if (!customer) {
//         throw new Error("Customer not found");
//       }
//       //  Create order
//       const order = await tx.order.create({
//         data: {
//           status: data.status,
//           totalAmount: data.totalAmount,
//           paymentMethod: data.paymentMethod,
//           paymentStatus: data.paymentStatus,
//           shippingAddress: data.shippingAddress,
//           customerId: data.customerId,
//           isSubscription: data.isSubscription ?? false,
//           isPreorder: data.isPreorder ?? false,
//           preorderDeliveryDate: data.preorderDeliveryDate
//             ? new Date(data.preorderDeliveryDate)
//             : undefined,
//         },
//       });
//       // Create initial tracking entry
//       await tx.orderTracking.create({
//         data: {
//           orderId: Number(order.orderId),
//           status: "PENDING",
//           description: "Order created pending",
//         },
//       });
//       return order;
//     });
//   } catch (error) {
//     throw new Error(`Failed to create order: ${getErrorMessage(error)}`);
//   }
// }
// /**
//  * Retrieve all orders
//  * @returns An array of all orders
//  * @throws Error if the query fails
//  */
// interface GetAllOrdersQueryParams {
//   filters: {
//     status?: OrderStatus;
//     customerId?: bigint;
//     orderId?: bigint;
//   };
//   pagination: {
//     page: number;
//     limit: number;
//     skip: number;
//     sort: string;
//   };
// }
// export async function getAllOrders(
//   queryParams: GetAllOrdersQueryParams
// ): Promise<{
//   orders: Order[];
//   currentPage: number;
//   totalPages: number;
//   totalCount: number;
// }> {
//   try {
//     const { filters, pagination } = queryParams;
//     const { status, customerId, orderId } = filters;
//     const { page, limit, skip, sort } = pagination;
//     const whereClause: Prisma.OrderWhereInput = {};
//     if (status && Object.values(OrderStatus).includes(status)) {
//       // Cast incoming string to Prisma enum
//       whereClause.status = status as OrderStatus;
//     }
//     if (customerId) whereClause.customerId = customerId;
//     if (orderId) whereClause.orderId = orderId;
//     const orders = await prisma.order.findMany({
//       where: whereClause,
//       include: {
//         orderItems: {
//           include: {
//             product: true,
//           },
//         },
//         customer: {
//           select: {
//             user: true,
//             customerId: true,
//           },
//         },
//       },
//       skip,
//       take: limit,
//       orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
//     });
//     const processedOrdersWithImageUrls = await Promise.all(
//       orders.map(async (order) => {
//         const updatedOrderItems = await Promise.all(
//           order.orderItems.map(async (item) => {
//             const accessibleUrls =
//               item.product.imageUrls.length > 0
//                 ? await getBatchAccessibleImageUrls(
//                     item.product.imageUrls,
//                     item.product.isPrivateImages,
//                     300
//                   )
//                 : [];
//             return {
//               ...item.product,
//               accessibleImageUrls: accessibleUrls,
//               quantity: item.quantity,
//             };
//           })
//         );
//         return {
//           ...order,
//           totalAmount: order.totalAmount,
//           orderItems: updatedOrderItems,
//         };
//       })
//     );
//     // Count total orders for pagination
//     const totalOrders = await prisma.order.count({
//       where: whereClause,
//     });
//     return {
//       orders: processedOrdersWithImageUrls,
//       currentPage: page,
//       totalPages: Math.ceil(totalOrders / limit),
//       totalCount: totalOrders,
//     };
//   } catch (error) {
//     throw new Error(`Failed to fetch orders: ${getErrorMessage(error)}`);
//   }
// }
// /**
//  * Retrieve an order by its ID
//  * @param orderId - The ID of the order
//  * @returns The order if found, or null if not found
//  * @throws Error if the query fails
//  */
// export async function getOrderById(orderId: BigInt) {
//   try {
//     const order = await prisma.order.findUnique({
//       where: { orderId: Number(orderId) },
//       include: {
//         orderItems: {
//           include: {
//             product: true,
//           },
//         },
//         customer: true,
//       },
//     });
//     if (!order) {
//       throw new Error("Order not found");
//     }
//     const updatedOrderItems = await Promise.all(
//       order.orderItems.map(async (item) => {
//         const accessibleUrls =
//           item.product.imageUrls.length > 0
//             ? await getBatchAccessibleImageUrls(
//                 item.product.imageUrls,
//                 item.product.isPrivateImages,
//                 300
//               )
//             : [];
//         return {
//           ...item.product,
//           quantity: item.quantity,
//           accessibleImageUrls: accessibleUrls,
//         };
//       })
//     );
//     return { ...order, orderItems: updatedOrderItems };
//   } catch (error) {
//     throw new Error(`Failed to fetch order: ${getErrorMessage(error)}`);
//   }
// }
// /**
//  * Update an order by its ID
//  * @param orderId - The ID of the order to update
//  * @param data - Data to update the order
//  * @returns The updated order
//  * @throws Error if the order is not found or update fails
//  */
// export async function updateOrder(
//   orderId: bigint,
//   data: UpdateOrderDto
// ): Promise<Order> {
//   try {
//     // Get current order
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
//     return await prisma.$transaction(async (tx) => {
//       // Update order
//       const isDelivered = data.status === "DELIVERED";
//       const updatedOrder = await tx.order.update({
//         where: { orderId },
//         data: {
//           status: data.status,
//           paymentStatus:
//             data.paymentStatus ??
//             (isDelivered ? "COMPLETED" : currentOrder.paymentStatus),
//           shippingAddress: data.shippingAddress,
//           preorderDeliveryDate: currentOrder.isPreorder
//             ? data.preorderDeliveryDate
//             : currentOrder.preorderDeliveryDate,
//         },
//       });
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
//             `Invalid status transition: Cannot skip status levels from ${currentOrder.status} to ${data.status}`
//           );
//         }
//         // if Backward status move detected--
//         if (newStatusIndex < currentStatusIndex) {
//           // Delete any forward tracking records
//           await tx.orderTracking.deleteMany({
//             where: {
//               orderId,
//               status: {
//                 in: orderStatusFlow.filter(
//                   (status) => orderStatusFlow.indexOf(status) > newStatusIndex
//                 ),
//               },
//             },
//           });
//         }
//       }
//       // Log only if status actually changed & not already tracked
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
//         // Notify the customer
//         const message = getOrderStatusMessage(data.status, orderId);
//         await sendNotification(
//           message,
//           "ORDER",
//           "CUSTOMER",
//           currentOrder.customer.userId,
//           tx
//         );
//       }
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
//           })
//         );
//         // update payment record
//         await tx.payment.update({
//           where: { orderId, paymentMethod: "COD" },
//           data: {
//             paymentStatus: "COMPLETED",
//           },
//         });
//       }
//       if (currentOrder.isSubscription) {
//         // Update subscription delivery
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
//           // update subscription delivery date
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
//               currentOrder.totalAmount
//             )
//           ) {
//             throw new Error(`Insufficient wallet balance`);
//           }
//           // deduct wallet balance
//           await tx.wallet.update({
//             where: { walletId: currentOrder.customer.wallet?.walletId },
//             data: {
//               lockedBalance: { decrement: currentOrder.totalAmount },
//               balance: { decrement: currentOrder.totalAmount },
//             },
//           });
//           // update wallet transaction record
//           await tx.walletTransaction.update({
//             where: { orderId },
//             data: {
//               transactionStatus: "COMPLETED",
//               description: `Payment completed for order #${currentOrder.orderId}`,
//             },
//           });
//           // update payment record
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
// /**
//  * Delete an order by its ID
//  * @param orderId - The ID of the order to delete
//  * @throws Error if the order is not found or deletion fails
//  */
// export async function deleteOrder(orderId: BigInt): Promise<void> {
//   try {
//     await prisma.order.delete({
//       where: { orderId: Number(orderId) },
//     });
//   } catch (error) {
//     throw new Error(`Failed to delete order: ${getErrorMessage(error)}`);
//   }
// }
// /**
//  * Get all orders for a specific customer
//  * @param customerID - The ID of the customer
//  * @returns An array of orders for the customer
//  * @throws Error if the order is not found or deletion fails
//  */
// export async function getCustomerOrders({
//   userId,
//   page,
//   limit,
//   sort,
//   statusArray,
//   skip,
// }: {
//   userId: BigInt;
//   page: number;
//   limit: number;
//   sort: string;
//   statusArray: string[];
//   skip: number;
// }): Promise<CustomerOrdersResult> {
//   try {
//     const customer = await prisma.customer.findUnique({
//       where: { userId: Number(userId) },
//       select: { customerId: true },
//     });
//     if (!customer) {
//       throw new Error("Customer not found");
//     }
//     // Fetch all customer orders--
//     const orders = await prisma.order.findMany({
//       where: {
//         customerId: customer.customerId,
//         ...(statusArray.length > 0 && {
//           status: { in: statusArray as OrderStatus[] },
//         }),
//       },
//       include: {
//         orderItems: {
//           select: {
//             quantity: true,
//             product: true,
//           },
//         },
//       },
//       take: limit,
//       skip: skip,
//       orderBy: {
//         createdAt: sort === "asc" ? "asc" : "desc",
//       },
//     });
//     if (!orders) {
//       throw new Error("Orders not found");
//     }
//     const processedOrdersWithImageUrls = await Promise.all(
//       orders.map(async (order) => {
//         const updatedOrderItems = await Promise.all(
//           order.orderItems.map(async (item) => {
//             const accessibleUrls =
//               item.product.imageUrls.length > 0
//                 ? await getBatchAccessibleImageUrls(
//                     item.product.imageUrls,
//                     item.product.isPrivateImages,
//                     300
//                   )
//                 : [];
//             return {
//               ...item.product,
//               accessibleImageUrls: accessibleUrls,
//               quantity: item.quantity,
//             };
//           })
//         );
//         return {
//           ...order,
//           totalAmount: order.totalAmount,
//           orderItems: updatedOrderItems,
//         };
//       })
//     );
//     const totalOrders = await prisma.order.count({
//       where: {
//         customerId: customer.customerId,
//         ...(statusArray.length > 0 && {
//           status: { in: statusArray as OrderStatus[] },
//         }),
//       },
//     });
//     return {
//       orders: processedOrdersWithImageUrls,
//       currentPage: page,
//       totalPages: Math.ceil(totalOrders / limit),
//       totalCount: totalOrders,
//     };
//   } catch (error) {
//     throw new Error(
//       `Failed to fetch customer orders: ${getErrorMessage(error)}`
//     );
//   }
// }
// -------------------------------- 2222222222222222222222222222222222222 ---------------------------------
// orders.service.ts
// import prisma from "@/prisma-client/prismaClient";
// import { getErrorMessage } from "@/utils/errorHandler";
// import { sendNotification } from "@/utils/sendNotification";
// import { getOrderStatusMessage } from "@/utils/getOrderStatusMessage";
// import { getBatchAccessibleImageUrls } from "@/utils/fileUpload/s3Aws";
// import { Order, OrderStatus, Prisma } from "@/generated/prisma/client";
// import { CreateOrderDto, UpdateOrderDto } from "@/modules/orders/orders.dto";
// import {
//   hasInsufficientWalletBalance,
//   upcomingDelivery,
// } from "@/utils/processSubscription";
// interface CustomerOrdersResult {
//   orders: Order[];
//   totalCount: number;
//   totalPages: number;
//   currentPage: number;
// }
// /**
//  * Create a new order
//  */
// export async function createOrder(data: CreateOrderDto): Promise<Order> {
//   try {
//     return await prisma.$transaction(async (tx) => {
//       const customer = await tx.customer.findUnique({
//         where: { customerId: data.customerId },
//       });
//       if (!customer) {
//         throw new Error("Customer not found");
//       }
//       const order = await tx.order.create({
//         data: {
//           status: data.status,
//           totalAmount: data.totalAmount,
//           paymentMethod: data.paymentMethod,
//           paymentStatus: data.paymentStatus,
//           shippingAddress: data.shippingAddress,
//           customerId: data.customerId,
//           isSubscription: data.isSubscription ?? false,
//           isPreorder: data.isPreorder ?? false,
//           preorderDeliveryDate: data.preorderDeliveryDate
//             ? new Date(data.preorderDeliveryDate)
//             : undefined,
//         },
//       });
//       await tx.orderTracking.create({
//         data: {
//           orderId: Number(order.orderId),
//           status: "PENDING",
//           description: "Order created pending",
//         },
//       });
//       return order;
//     });
//   } catch (error) {
//     throw new Error(`Failed to create order: ${getErrorMessage(error)}`);
//   }
// }
// /**
//  * Retrieve all orders with search and date filtering
//  */
// interface GetAllOrdersQueryParams {
//   filters: {
//     status?: OrderStatus;
//     customerId?: bigint;
//     orderId?: bigint;
//     search?: string;
//     startDate?: string;
//     endDate?: string;
//   };
//   pagination: {
//     page: number;
//     limit: number;
//     skip: number;
//     sort: string;
//   };
// }
// export async function getAllOrders(
//   queryParams: GetAllOrdersQueryParams,
// ): Promise<{
//   orders: Order[];
//   currentPage: number;
//   totalPages: number;
//   totalCount: number;
// }> {
//   try {
//     const { filters, pagination } = queryParams;
//     const { status, customerId, orderId, search, startDate, endDate } = filters;
//     const { page, limit, skip, sort } = pagination;
//     const whereClause: Prisma.OrderWhereInput = {};
//     if (status && Object.values(OrderStatus).includes(status)) {
//       whereClause.status = status as OrderStatus;
//     }
//     if (customerId) whereClause.customerId = customerId;
//     if (orderId) whereClause.orderId = orderId;
//     // Search by order ID or customer name/email
//     if (search && search.trim()) {
//       const searchTerm = search.trim();
//       const searchAsNumber = Number(searchTerm);
//       whereClause.OR = [
//         // Search by orderId if it's a valid number
//         ...(Number.isInteger(searchAsNumber) && searchAsNumber > 0
//           ? [{ orderId: BigInt(searchAsNumber) }]
//           : []),
//         // Search by customer name
//         {
//           customer: {
//             user: {
//               name: {
//                 contains: searchTerm,
//                 mode: "insensitive" as Prisma.QueryMode,
//               },
//             },
//           },
//         },
//         // Search by customer email
//         {
//           customer: {
//             user: {
//               email: {
//                 contains: searchTerm,
//                 mode: "insensitive" as Prisma.QueryMode,
//               },
//             },
//           },
//         },
//         // Search by shipping address
//         {
//           shippingAddress: {
//             contains: searchTerm,
//             mode: "insensitive" as Prisma.QueryMode,
//           },
//         },
//         // Search by payment method
//         {
//           paymentMethod: {
//             contains: searchTerm,
//             mode: "insensitive" as Prisma.QueryMode,
//           },
//         },
//       ];
//     }
//     // Date range filter
//     if (startDate || endDate) {
//       whereClause.createdAt = {};
//       if (startDate) {
//         const start = new Date(startDate);
//         start.setHours(0, 0, 0, 0);
//         whereClause.createdAt.gte = start;
//       }
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         whereClause.createdAt.lte = end;
//       }
//     }
//     const orders = await prisma.order.findMany({
//       where: whereClause,
//       include: {
//         orderItems: {
//           include: {
//             product: true,
//           },
//         },
//         customer: {
//           select: {
//             user: true,
//             customerId: true,
//           },
//         },
//       },
//       skip,
//       take: limit,
//       orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
//     });
//     const processedOrdersWithImageUrls = await Promise.all(
//       orders.map(async (order) => {
//         const updatedOrderItems = await Promise.all(
//           order.orderItems.map(async (item) => {
//             const accessibleUrls =
//               item.product.imageUrls.length > 0
//                 ? await getBatchAccessibleImageUrls(
//                     item.product.imageUrls,
//                     item.product.isPrivateImages,
//                     300,
//                   )
//                 : [];
//             return {
//               ...item.product,
//               accessibleImageUrls: accessibleUrls,
//               quantity: item.quantity,
//             };
//           }),
//         );
//         return {
//           ...order,
//           totalAmount: order.totalAmount,
//           orderItems: updatedOrderItems,
//         };
//       }),
//     );
//     const totalOrders = await prisma.order.count({
//       where: whereClause,
//     });
//     return {
//       orders: processedOrdersWithImageUrls,
//       currentPage: page,
//       totalPages: Math.ceil(totalOrders / limit),
//       totalCount: totalOrders,
//     };
//   } catch (error) {
//     throw new Error(`Failed to fetch orders: ${getErrorMessage(error)}`);
//   }
// }
// /**
//  * Retrieve an order by its ID
//  */
// export async function getOrderById(orderId: BigInt) {
//   try {
//     const order = await prisma.order.findUnique({
//       where: { orderId: Number(orderId) },
//       include: {
//         orderItems: {
//           include: {
//             product: true,
//           },
//         },
//         customer: true,
//       },
//     });
//     if (!order) {
//       throw new Error("Order not found");
//     }
//     const updatedOrderItems = await Promise.all(
//       order.orderItems.map(async (item) => {
//         const accessibleUrls =
//           item.product.imageUrls.length > 0
//             ? await getBatchAccessibleImageUrls(
//                 item.product.imageUrls,
//                 item.product.isPrivateImages,
//                 300,
//               )
//             : [];
//         return {
//           ...item.product,
//           quantity: item.quantity,
//           accessibleImageUrls: accessibleUrls,
//         };
//       }),
//     );
//     return { ...order, orderItems: updatedOrderItems };
//   } catch (error) {
//     throw new Error(`Failed to fetch order: ${getErrorMessage(error)}`);
//   }
// }
// /**
//  * Update an order by its ID
//  */
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
//     return await prisma.$transaction(async (tx) => {
//       const isDelivered = data.status === "DELIVERED";
//       const updatedOrder = await tx.order.update({
//         where: { orderId },
//         data: {
//           status: data.status,
//           paymentStatus:
//             data.paymentStatus ??
//             (isDelivered ? "COMPLETED" : currentOrder.paymentStatus),
//           shippingAddress: data.shippingAddress,
//           preorderDeliveryDate: currentOrder.isPreorder
//             ? data.preorderDeliveryDate
//             : currentOrder.preorderDeliveryDate,
//         },
//       });
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
//         await tx.payment.update({
//           where: { orderId, paymentMethod: "COD" },
//           data: {
//             paymentStatus: "COMPLETED",
//           },
//         });
//       }
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
// /**
//  * Delete an order by its ID
//  */
// export async function deleteOrder(orderId: BigInt): Promise<void> {
//   try {
//     await prisma.order.delete({
//       where: { orderId: Number(orderId) },
//     });
//   } catch (error) {
//     throw new Error(`Failed to delete order: ${getErrorMessage(error)}`);
//   }
// }
// /**
//  * Get all orders for a specific customer
//  */
// export async function getCustomerOrders({
//   userId,
//   page,
//   limit,
//   sort,
//   statusArray,
//   skip,
// }: {
//   userId: BigInt;
//   page: number;
//   limit: number;
//   sort: string;
//   statusArray: string[];
//   skip: number;
// }): Promise<CustomerOrdersResult> {
//   try {
//     const customer = await prisma.customer.findUnique({
//       where: { userId: Number(userId) },
//       select: { customerId: true },
//     });
//     if (!customer) {
//       throw new Error("Customer not found");
//     }
//     const orders = await prisma.order.findMany({
//       where: {
//         customerId: customer.customerId,
//         ...(statusArray.length > 0 && {
//           status: { in: statusArray as OrderStatus[] },
//         }),
//       },
//       include: {
//         orderItems: {
//           select: {
//             quantity: true,
//             product: true,
//           },
//         },
//       },
//       take: limit,
//       skip: skip,
//       orderBy: {
//         createdAt: sort === "asc" ? "asc" : "desc",
//       },
//     });
//     if (!orders) {
//       throw new Error("Orders not found");
//     }
//     const processedOrdersWithImageUrls = await Promise.all(
//       orders.map(async (order) => {
//         const updatedOrderItems = await Promise.all(
//           order.orderItems.map(async (item) => {
//             const accessibleUrls =
//               item.product.imageUrls.length > 0
//                 ? await getBatchAccessibleImageUrls(
//                     item.product.imageUrls,
//                     item.product.isPrivateImages,
//                     300,
//                   )
//                 : [];
//             return {
//               ...item.product,
//               accessibleImageUrls: accessibleUrls,
//               quantity: item.quantity,
//             };
//           }),
//         );
//         return {
//           ...order,
//           totalAmount: order.totalAmount,
//           orderItems: updatedOrderItems,
//         };
//       }),
//     );
//     const totalOrders = await prisma.order.count({
//       where: {
//         customerId: customer.customerId,
//         ...(statusArray.length > 0 && {
//           status: { in: statusArray as OrderStatus[] },
//         }),
//       },
//     });
//     return {
//       orders: processedOrdersWithImageUrls,
//       currentPage: page,
//       totalPages: Math.ceil(totalOrders / limit),
//       totalCount: totalOrders,
//     };
//   } catch (error) {
//     throw new Error(
//       `Failed to fetch customer orders: ${getErrorMessage(error)}`,
//     );
//   }
// }
// ------------------------------ 3333333333333333333333333333333333 --------------------------------
// orders.service.ts
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const errorHandler_1 = require("@/utils/errorHandler");
const sendNotification_1 = require("@/utils/sendNotification");
const getOrderStatusMessage_1 = require("@/utils/getOrderStatusMessage");
const s3Aws_1 = require("@/utils/fileUpload/s3Aws");
const client_1 = require("@/generated/prisma/client");
const processSubscription_1 = require("@/utils/processSubscription");
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
};
// =============================================================================
// Shared: Process order items with image URLs
// =============================================================================
async function processOrderItems(orderItems) {
    return Promise.all(orderItems.map(async (item) => {
        const accessibleUrls = item.product.imageUrls.length > 0
            ? await (0, s3Aws_1.getBatchAccessibleImageUrls)(item.product.imageUrls, item.product.isPrivateImages, 300)
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
    }));
}
// =============================================================================
// Create Order
// =============================================================================
async function createOrder(data) {
    try {
        return await prismaClient_1.default.$transaction(async (tx) => {
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
    }
    catch (error) {
        throw new Error(`Failed to create order: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
// =============================================================================
// Get All Orders
// =============================================================================
async function getAllOrders(queryParams) {
    try {
        const { filters, pagination } = queryParams;
        const { status, customerId, orderId, search, startDate, endDate } = filters;
        const { page, limit, skip, sort } = pagination;
        const whereClause = {};
        if (status && Object.values(client_1.OrderStatus).includes(status)) {
            whereClause.status = status;
        }
        if (customerId)
            whereClause.customerId = customerId;
        if (orderId)
            whereClause.orderId = orderId;
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
                                mode: "insensitive",
                            },
                        },
                    },
                },
                {
                    customer: {
                        user: {
                            email: {
                                contains: searchTerm,
                                mode: "insensitive",
                            },
                        },
                    },
                },
                {
                    shippingAddress: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    paymentMethod: {
                        contains: searchTerm,
                        mode: "insensitive",
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
        const orders = await prismaClient_1.default.order.findMany({
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
        const processedOrders = await Promise.all(orders.map(async (order) => {
            const updatedOrderItems = await processOrderItems(order.orderItems);
            return {
                ...order,
                totalAmount: order.totalAmount,
                orderItems: updatedOrderItems,
            };
        }));
        const totalOrders = await prismaClient_1.default.order.count({
            where: whereClause,
        });
        return {
            orders: processedOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            totalCount: totalOrders,
        };
    }
    catch (error) {
        throw new Error(`Failed to fetch orders: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
// =============================================================================
// Get Order By ID
// =============================================================================
async function getOrderById(orderId) {
    try {
        const order = await prismaClient_1.default.order.findUnique({
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
    }
    catch (error) {
        throw new Error(`Failed to fetch order: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
// =============================================================================
// Update Order
// =============================================================================
async function updateOrder(orderId, data) {
    try {
        const currentOrder = await prismaClient_1.default.order.findUnique({
            where: { orderId },
            include: {
                customer: { include: { wallet: true } },
                orderItems: true,
            },
        });
        if (!currentOrder)
            throw new Error("Order not found");
        if (currentOrder.status === "DELIVERED" && data.status) {
            throw new Error("Cannot update status after it has been delivered.");
        }
        return await prismaClient_1.default.$transaction(async (tx) => {
            const isDelivered = data.status === "DELIVERED";
            const updatedOrder = await tx.order.update({
                where: { orderId },
                data: {
                    status: data.status,
                    paymentStatus: data.paymentStatus ??
                        (isDelivered ? "COMPLETED" : currentOrder.paymentStatus),
                    shippingAddress: data.shippingAddress,
                    preorderDeliveryDate: currentOrder.isPreorder
                        ? data.preorderDeliveryDate
                        : currentOrder.preorderDeliveryDate,
                },
            });
            if (data.status) {
                const orderStatusFlow = [
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
                    throw new Error(`Invalid status transition: Cannot skip status levels from ${currentOrder.status} to ${data.status}`);
                }
                if (newStatusIndex < currentStatusIndex) {
                    await tx.orderTracking.deleteMany({
                        where: {
                            orderId,
                            status: {
                                in: orderStatusFlow.filter((status) => orderStatusFlow.indexOf(status) > newStatusIndex),
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
                const message = (0, getOrderStatusMessage_1.getOrderStatusMessage)(data.status, orderId);
                await (0, sendNotification_1.sendNotification)(message, "ORDER", "CUSTOMER", currentOrder.customer.userId, tx);
            }
            if (data.status === "DELIVERED" && currentOrder.paymentMethod === "COD") {
                await Promise.all(currentOrder.orderItems.map(async (item) => {
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
                }));
                await tx.payment.update({
                    where: { orderId, paymentMethod: "COD" },
                    data: {
                        paymentStatus: "COMPLETED",
                    },
                });
            }
            if (currentOrder.isSubscription) {
                const updatedSubscriptionDelivery = await tx.subscriptionDelivery.update({
                    where: { orderId },
                    data: { status: data.status },
                });
                if (data.status === "DELIVERED") {
                    const subscriptionId = updatedSubscriptionDelivery.subscriptionId;
                    const delivery = await (0, processSubscription_1.upcomingDelivery)(tx, subscriptionId);
                    let nextDeliveryDate;
                    if (delivery) {
                        nextDeliveryDate = delivery.deliveryDate;
                    }
                    else {
                        nextDeliveryDate = null;
                    }
                    await tx.subscription.update({
                        where: { subscriptionId },
                        data: { nextDeliveryDate },
                    });
                }
                if (currentOrder.paymentMethod === "WALLET" &&
                    data.status === "DELIVERED") {
                    if ((0, processSubscription_1.hasInsufficientWalletBalance)(currentOrder.customer.wallet, currentOrder.totalAmount)) {
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
                    await tx.payment.update({
                        where: { orderId },
                        data: { paymentStatus: "COMPLETED" },
                    });
                }
            }
            return updatedOrder;
        });
    }
    catch (error) {
        throw new Error(`Failed to update order: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
// =============================================================================
// Delete Order
// =============================================================================
async function deleteOrder(orderId) {
    try {
        await prismaClient_1.default.order.delete({
            where: { orderId: Number(orderId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete order: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
// =============================================================================
// Get Customer Orders
// =============================================================================
async function getCustomerOrders({ userId, page, limit, sort, statusArray, skip, }) {
    try {
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { userId: Number(userId) },
            select: { customerId: true },
        });
        if (!customer) {
            throw new Error("Customer not found");
        }
        const orders = await prismaClient_1.default.order.findMany({
            where: {
                customerId: customer.customerId,
                ...(statusArray.length > 0 && {
                    status: { in: statusArray },
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
        const processedOrders = await Promise.all(orders.map(async (order) => {
            const updatedOrderItems = await processOrderItems(order.orderItems);
            return {
                ...order,
                totalAmount: order.totalAmount,
                orderItems: updatedOrderItems,
            };
        }));
        const totalOrders = await prismaClient_1.default.order.count({
            where: {
                customerId: customer.customerId,
                ...(statusArray.length > 0 && {
                    status: { in: statusArray },
                }),
            },
        });
        return {
            orders: processedOrders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            totalCount: totalOrders,
        };
    }
    catch (error) {
        throw new Error(`Failed to fetch customer orders: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
