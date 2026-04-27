
/**
 * Controller layer for OrderTracking entity operations.
 * Handles HTTP requests and responses for order tracking-related endpoints.
 */
import { z } from "zod";
import httpStatus from "http-status";
import { Request, Response } from "express";
import sendResponse from "@/utils/sendResponse";
import { OrderTracking } from "@/generated/prisma/client";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import * as orderTrackingService from "@/modules/order_tracking/order-tracking.service";
import {
  zCreateOrderTrackingDto,
  zUpdateOrderTrackingDto,
} from "@/modules/order_tracking/order-tracking.dto";

const idSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "ID must be a positive integer",
});

/**
 * Create a new order tracking entry
 */
export const createOrderTracking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = zCreateOrderTrackingDto.parse(req.body);
    const orderTracking = await orderTrackingService.createOrderTracking(data);
    sendResponse<OrderTracking>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Order tracking created successfully",
      data: orderTracking,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create order tracking");
  }
};

/**
 * Get all order tracking entries
 */
interface OrderTrackingsQuery {
  page?: string;
  limit?: string;
  search?: string;
}
export const getAllOrderTrackings = async (
  req: Request<{}, {}, {}, OrderTrackingsQuery>,
  res: Response,
): Promise<void> => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || "";

    const result = await orderTrackingService.getAllOrderTrackings({
      skip,
      limit,
      search,
    });
    sendResponse<OrderTracking[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order trackings retrieved successfully",
      data: result.orderTrackings,
      pagination: {
        currentPage: page,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch order trackings");
  }
};

/**
 * Get a single order tracking entry by ID
 */
// export const getOrderTrackingsByOrderId = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const orderId = idSchema.parse(req.params.orderId);
//     const orderTracking = await orderTrackingService.getOrderTrackingsByOrderId(
//       orderId
//     );
//     if (!orderTracking) {
//       throw new Error("Order tracking not found");
//     }
//     sendResponse<OrderTracking[]>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Order trackings retrieved successfully",
//       data: orderTracking,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch order tracking");
//   }
// };

/**
 * Get a single order tracking entry by ID
 */
export const getOrderTrackingsByOrderId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const orderId = idSchema.parse(req.params.orderId);
    const orderTracking =
      await orderTrackingService.getOrderTrackingsByOrderId(orderId);
    if (!orderTracking || orderTracking.length === 0) {
      sendResponse<OrderTracking[]>(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Order trackings retrieved successfully",
        data: [],
      });
      return;
    }
    sendResponse<OrderTracking[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order trackings retrieved successfully",
      data: orderTracking,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch order tracking");
  }
};

/**
 * Get a single order tracking entry by ID (for edit page)
 */
export const getOrderTrackingById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const trackingId = idSchema.parse(req.params.id);
    const orderTracking =
      await orderTrackingService.getOrderTrackingById(trackingId);
    if (!orderTracking) {
      sendResponse(res, {
        success: false,
        statusCode: httpStatus.NOT_FOUND,
        message: "Order tracking not found",
      });

      return;
    }
    sendResponse<OrderTracking>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order tracking retrieved successfully",
      data: orderTracking,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch order tracking");
  }
};

/**
 * Update an order tracking entry by ID
 */
export const updateOrderTracking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const trackingId = idSchema.parse(req.params.id);
    const data = zUpdateOrderTrackingDto.parse(req.body);
    const updated = await orderTrackingService.updateOrderTracking(
      trackingId,
      data,
    );
    sendResponse<OrderTracking>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order tracking updated successfully",
      data: updated,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update order tracking");
  }
};

/**
 * Delete an order tracking entry by ID
 */
export const deleteOrderTracking = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const trackingId = idSchema.parse(req.params.id);
    await orderTrackingService.deleteOrderTracking(trackingId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order tracking deleted successfully",
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete order tracking");
  }
};
