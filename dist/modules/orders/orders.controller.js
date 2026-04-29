"use strict";
// /**
//  * Controller layer for Order entity operations.
//  * Handles HTTP requests and responses for order-related endpoints.
//  */
// import { z } from "zod";
// import httpStatus from "http-status";
// import { Request, Response } from "express";
// import sendResponse from "@/utils/sendResponse";
// import { Order, OrderStatus } from "@/generated/prisma/client";
// import * as orderService from "@/modules/orders/orders.service";
// import { handleErrorResponse } from "@/utils/errorResponseHandler";
// import { zCreateOrderDto, zUpdateOrderDto } from "@/modules/orders/orders.dto";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerOrders = exports.deleteOrder = exports.updateOrder = exports.getOrderById = exports.getAllOrders = exports.createOrder = void 0;
// const orderIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
//   message: "Order ID must be a positive integer",
// });
// /**
//  * Create a new order
//  */
// export const createOrder = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const data = zCreateOrderDto.parse(req.body);
//     const order = await orderService.createOrder(data);
//     sendResponse<Order>(res, {
//       success: true,
//       statusCode: httpStatus.CREATED,
//       message: "Order created successfully",
//       data: order,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "create order");
//   }
// };
// /**
//  * Get all orders
//  */
// interface OrdersQuery {
//   page?: string;
//   limit?: string;
//   status?: OrderStatus;
//   customerId?: string;
//   orderId?: string;
//   sort?: string;
// }
// export const getAllOrders = async (
//   req: Request<{}, {}, {}, OrdersQuery>,
//   res: Response
// ): Promise<void> => {
//   try {
//     const page = Math.max(parseInt(req.query.page as string) || 1, 1);
//     const limit = Math.min(
//       Math.max(parseInt(req.query.limit as string) || 10, 1),
//       100
//     ); // Max 100 items per page
//     const skip = (page - 1) * limit;
//     const sort = req.query.sort === "asc" ? "asc" : "desc";
//     const status = req.query.status as OrderStatus | undefined;
//     const customerId = req.query.customerId
//       ? BigInt(req.query.customerId as string)
//       : undefined;
//     const orderId = req.query.orderId
//       ? BigInt(req.query.orderId as string)
//       : undefined;
//     const filters = { status, customerId, orderId };
//     const pagination = { page, limit, skip, sort };
//     const result = await orderService.getAllOrders({ filters, pagination });
//     sendResponse<Order[]>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Orders fetched successfully",
//       data: result.orders,
//       pagination: {
//         currentPage: result.currentPage,
//         totalPages: result.totalPages,
//         totalItems: result.totalCount,
//         itemsPerPage: limit,
//         hasNextPage: result.currentPage < result.totalPages,
//         hasPreviousPage: result.currentPage > 1,
//       },
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch orders");
//   }
// };
// /**
//  * Get a single order by ID
//  */
// export const getOrderById = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const orderId = orderIdSchema.parse(req.params.id);
//     const order = await orderService.getOrderById(orderId);
//     if (!order) {
//       throw new Error("Order not found");
//     }
//     sendResponse<Order>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Order retrieved successfully",
//       data: order,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch order");
//   }
// };
// /**
//  * Update an order by ID
//  */
// export const updateOrder = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const orderId = orderIdSchema.parse(req.params.id);
//     const data = zUpdateOrderDto.parse(req.body);
//     const updated = await orderService.updateOrder(orderId, data);
//     sendResponse<Order>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Order updated successfully",
//       data: updated,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "update order");
//   }
// };
// /**
//  * Delete an order by ID
//  */
// export const deleteOrder = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const orderId = orderIdSchema.parse(req.params.id);
//     await orderService.deleteOrder(orderId);
//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Order deleted successfully",
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "delete order");
//   }
// };
// /**
//  * Get all customer orders
//  */
// export const getCustomerOrders = async (
//   req: Request<{}, {}, {}, OrdersQuery>,
//   res: Response
// ): Promise<void> => {
//   try {
//     const page = Math.max(parseInt(req.query.page as string) || 1, 1);
//     const limit = Math.min(
//       Math.max(parseInt(req.query.limit as string) || 10, 1),
//       100
//     ); // Max 100 items per page
//     const skip = (page - 1) * limit;
//     const sort = req.query.sort === "asc" ? "asc" : "desc";
//     const status = req.query.status as string | undefined;
//     const statusArray = status
//       ? Array.isArray(status)
//         ? status.map((s) => s.toUpperCase())
//         : status.split(",").map((s) => s.toUpperCase())
//       : [];
//     if (!req.user?.userId) throw new Error("Please login to continue");
//     const userId = BigInt(req.user?.userId!);
//     const result = await orderService.getCustomerOrders({
//       userId,
//       page,
//       limit,
//       sort,
//       statusArray,
//       skip,
//     });
//     sendResponse<Order[]>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Customer orders retrieved successfully",
//       data: result.orders,
//       pagination: {
//         currentPage: result.currentPage,
//         totalPages: result.totalPages,
//         totalItems: result.totalCount,
//         itemsPerPage: limit,
//         hasNextPage: page < result.totalPages,
//         hasPreviousPage: page > 1,
//       },
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch customer orders");
//   }
// };
// --------------------------- 2222222222222222222222222222 -------------------------
// orders.controller.ts
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const orderService = __importStar(require("@/modules/orders/orders.service"));
const errorResponseHandler_1 = require("@/utils/errorResponseHandler");
const orders_dto_1 = require("@/modules/orders/orders.dto");
const orderIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Order ID must be a positive integer",
});
/**
 * Create a new order
 */
const createOrder = async (req, res) => {
    try {
        const data = orders_dto_1.zCreateOrderDto.parse(req.body);
        const order = await orderService.createOrder(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Order created successfully",
            data: order,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create order");
    }
};
exports.createOrder = createOrder;
const getAllOrders = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
        const skip = (page - 1) * limit;
        const sort = req.query.sort === "asc" ? "asc" : "desc";
        const status = req.query.status;
        const search = req.query.search;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const customerId = req.query.customerId
            ? BigInt(req.query.customerId)
            : undefined;
        const orderId = req.query.orderId
            ? BigInt(req.query.orderId)
            : undefined;
        const filters = { status, customerId, orderId, search, startDate, endDate };
        const pagination = { page, limit, skip, sort };
        const result = await orderService.getAllOrders({ filters, pagination });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Orders fetched successfully",
            data: result.orders,
            pagination: {
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                totalItems: result.totalCount,
                itemsPerPage: limit,
                hasNextPage: result.currentPage < result.totalPages,
                hasPreviousPage: result.currentPage > 1,
            },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch orders");
    }
};
exports.getAllOrders = getAllOrders;
/**
 * Get a single order by ID
 */
const getOrderById = async (req, res) => {
    try {
        const orderId = orderIdSchema.parse(req.params.id);
        const order = await orderService.getOrderById(orderId);
        if (!order) {
            throw new Error("Order not found");
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order retrieved successfully",
            data: order,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch order");
    }
};
exports.getOrderById = getOrderById;
/**
 * Update an order by ID
 */
const updateOrder = async (req, res) => {
    try {
        const orderId = orderIdSchema.parse(req.params.id);
        const data = orders_dto_1.zUpdateOrderDto.parse(req.body);
        const updated = await orderService.updateOrder(orderId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order updated successfully",
            data: updated,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update order");
    }
};
exports.updateOrder = updateOrder;
/**
 * Delete an order by ID
 */
const deleteOrder = async (req, res) => {
    try {
        const orderId = orderIdSchema.parse(req.params.id);
        await orderService.deleteOrder(orderId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete order");
    }
};
exports.deleteOrder = deleteOrder;
/**
 * Get all customer orders
 */
const getCustomerOrders = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
        const skip = (page - 1) * limit;
        const sort = req.query.sort === "asc" ? "asc" : "desc";
        const status = req.query.status;
        const statusArray = status
            ? Array.isArray(status)
                ? status.map((s) => s.toUpperCase())
                : status.split(",").map((s) => s.toUpperCase())
            : [];
        if (!req.user?.userId)
            throw new Error("Please login to continue");
        const userId = BigInt(req.user?.userId);
        const result = await orderService.getCustomerOrders({
            userId,
            page,
            limit,
            sort,
            statusArray,
            skip,
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Customer orders retrieved successfully",
            data: result.orders,
            pagination: {
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                totalItems: result.totalCount,
                itemsPerPage: limit,
                hasNextPage: page < result.totalPages,
                hasPreviousPage: page > 1,
            },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch customer orders");
    }
};
exports.getCustomerOrders = getCustomerOrders;
