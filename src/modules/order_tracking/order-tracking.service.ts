// /**
//  * Service layer for OrderTracking entity operations.
//  * Contains business logic and database interactions for order tracking entries.
//  */
// import prisma from "@/prisma-client/prismaClient";
// import { getErrorMessage } from "@/utils/errorHandler";
// import { OrderTracking } from "@/generated/prisma/client";
// import {
//   CreateOrderTrackingDto,
//   UpdateOrderTrackingDto,
// } from "@/modules/order_tracking/order-tracking.dto";

// /**
//  * Create a new order tracking entry
//  */
// export async function createOrderTracking(
//   data: CreateOrderTrackingDto
// ): Promise<OrderTracking> {
//   try {
//     const order = await prisma.order.findUnique({
//       where: { orderId: Number(data.orderId) },
//     });
//     if (!order) {
//       throw new Error("Order not found");
//     }

//     const orderTracking = await prisma.orderTracking.create({
//       data: {
//         status: data.status,
//         description: data.description,
//         orderId: data.orderId,
//       },
//     });
//     return orderTracking;
//   } catch (error) {
//     throw new Error(
//       `Failed to create order tracking: ${getErrorMessage(error)}`
//     );
//   }
// }

// /**
//  * Retrieve all order tracking entries with pagination and search
//  */
// interface GetAllOrderTrackingsOptions {
//   skip: number;
//   limit: number;
//   search: string;
// }

// interface GetAllOrderTrackingsResult {
//   orderTrackings: OrderTracking[];
//   totalCount: number;
//   totalPages: number;
// }

// export async function getAllOrderTrackings(
//   options: GetAllOrderTrackingsOptions
// ): Promise<GetAllOrderTrackingsResult> {
//   try {
//     const { skip, limit, search } = options;

//     // Build search filter
//     const whereClause = search
//       ? {
//           OR: [
//             { status: { contains: search, mode: "insensitive" as const } },
//             { description: { contains: search, mode: "insensitive" as const } },
//           ],
//         }
//       : {};

//     const [orderTrackings, totalCount] = await Promise.all([
//       prisma.orderTracking.findMany({
//         where: whereClause,
//         skip,
//         take: limit,
//         orderBy: { createdAt: "desc" },
//       }),
//       prisma.orderTracking.count({ where: whereClause }),
//     ]);

//     const totalPages = Math.ceil(totalCount / limit);

//     return {
//       orderTrackings,
//       totalCount,
//       totalPages,
//     };
//   } catch (error) {
//     throw new Error(
//       `Failed to fetch order trackings: ${getErrorMessage(error)}`
//     );
//   }
// }

// /**
//  * Retrieve an order trackings entry by order ID
//  */
// export async function getOrderTrackingsByOrderId(
//   orderId: BigInt
// ): Promise<OrderTracking[] | null> {
//   try {
//     const orderTracking = await prisma.orderTracking.findMany({
//       where: { orderId: Number(orderId) },
//       orderBy: { createdAt: "asc" },
//     });
//     return orderTracking;
//   } catch (error) {
//     throw new Error(
//       `Failed to fetch order tracking: ${getErrorMessage(error)}`
//     );
//   }
// }

// /**
//  * Update an order tracking entry by its ID
//  */
// export async function updateOrderTracking(
//   trackingId: BigInt,
//   data: UpdateOrderTrackingDto
// ): Promise<OrderTracking> {
//   try {
//     if (data.orderId) {
//       const order = await prisma.order.findUnique({
//         where: { orderId: Number(data.orderId) },
//       });
//       if (!order) {
//         throw new Error("Order not found");
//       }
//     }

//     const orderTracking = await prisma.orderTracking.update({
//       where: { trackingId: Number(trackingId) },
//       data: {
//         status: data.status,
//         description: data.description,
//         orderId: data.orderId,
//       },
//     });
//     return orderTracking;
//   } catch (error) {
//     throw new Error(
//       `Failed to update order tracking: ${getErrorMessage(error)}`
//     );
//   }
// }

// /**
//  * Delete an order tracking entry by its ID
//  */
// export async function deleteOrderTracking(trackingId: BigInt): Promise<void> {
//   try {
//     await prisma.orderTracking.delete({
//       where: { trackingId: Number(trackingId) },
//     });
//   } catch (error) {
//     throw new Error(
//       `Failed to delete order tracking: ${getErrorMessage(error)}`
//     );
//   }
// }


// -------------------------- 222222222222222222222222222222 --------------------------
/**
 * Service layer for OrderTracking entity operations.
 * Contains business logic and database interactions for order tracking entries.
 */
import prisma from "@/prisma-client/prismaClient";
import { getErrorMessage } from "@/utils/errorHandler";
import { OrderTracking } from "@/generated/prisma/client";
import {
  CreateOrderTrackingDto,
  UpdateOrderTrackingDto,
} from "@/modules/order_tracking/order-tracking.dto";

/**
 * Create a new order tracking entry
 */
export async function createOrderTracking(
  data: CreateOrderTrackingDto
): Promise<OrderTracking> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderId: Number(data.orderId) },
    });
    if (!order) {
      throw new Error("Order not found");
    }

    const orderTracking = await prisma.orderTracking.create({
      data: {
        status: data.status,
        description: data.description,
        orderId: data.orderId,
      },
    });
    return orderTracking;
  } catch (error) {
    throw new Error(
      `Failed to create order tracking: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve all order tracking entries with pagination and search
 */
interface GetAllOrderTrackingsOptions {
  skip: number;
  limit: number;
  search: string;
}

interface GetAllOrderTrackingsResult {
  orderTrackings: OrderTracking[];
  totalCount: number;
  totalPages: number;
}

export async function getAllOrderTrackings(
  options: GetAllOrderTrackingsOptions
): Promise<GetAllOrderTrackingsResult> {
  try {
    const { skip, limit, search } = options;

    // Build search filter
    const whereClause = search
      ? {
          OR: [
            { status: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [orderTrackings, totalCount] = await Promise.all([
      prisma.orderTracking.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.orderTracking.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      orderTrackings,
      totalCount,
      totalPages,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch order trackings: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve an order trackings entry by order ID
 */
export async function getOrderTrackingsByOrderId(
  orderId: BigInt
): Promise<OrderTracking[] | null> {
  try {
    const orderTracking = await prisma.orderTracking.findMany({
      where: { orderId: Number(orderId) },
      orderBy: { createdAt: "asc" },
    });
    return orderTracking;
  } catch (error) {
    throw new Error(
      `Failed to fetch order tracking: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Retrieve a single order tracking entry by tracking ID
 */
export async function getOrderTrackingById(
  trackingId: BigInt
): Promise<OrderTracking | null> {
  try {
    const orderTracking = await prisma.orderTracking.findUnique({
      where: { trackingId: Number(trackingId) },
    });
    return orderTracking;
  } catch (error) {
    throw new Error(
      `Failed to fetch order tracking: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Update an order tracking entry by its ID
 */
export async function updateOrderTracking(
  trackingId: BigInt,
  data: UpdateOrderTrackingDto
): Promise<OrderTracking> {
  try {
    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { orderId: Number(data.orderId) },
      });
      if (!order) {
        throw new Error("Order not found");
      }
    }

    const orderTracking = await prisma.orderTracking.update({
      where: { trackingId: Number(trackingId) },
      data: {
        status: data.status,
        description: data.description,
        orderId: data.orderId,
      },
    });
    return orderTracking;
  } catch (error) {
    throw new Error(
      `Failed to update order tracking: ${getErrorMessage(error)}`
    );
  }
}

/**
 * Delete an order tracking entry by its ID
 */
export async function deleteOrderTracking(trackingId: BigInt): Promise<void> {
  try {
    await prisma.orderTracking.delete({
      where: { trackingId: Number(trackingId) },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete order tracking: ${getErrorMessage(error)}`
    );
  }
}