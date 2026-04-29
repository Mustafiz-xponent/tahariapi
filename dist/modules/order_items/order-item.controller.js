"use strict";
// /**
//  * Controller layer for OrderItem entity operations.
//  * Handles HTTP requests and responses for order item-related endpoints.
//  */
// import { z } from "zod";
// import httpStatus from "http-status";
// import { Request, Response } from "express";
// import sendResponse from "@/utils/sendResponse";
// import { OrderItem } from "@/generated/prisma/client";
// import { handleErrorResponse } from "@/utils/errorResponseHandler";
// import * as orderItemService from "@/modules/order_items/order-item.service";
// import {
//   zCreateOrderItemDto,
//   zCreateOrderItemsDto,
//   zUpdateOrderItemDto,
// } from "@/modules/order_items/order-item.dto";
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
exports.deleteOrderItem = exports.updateOrderItem = exports.getOrderItemById = exports.getAllOrderItems = exports.createOrderItem = exports.checkProductStock = void 0;
// const orderItemIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
//   message: "Order Item ID must be a positive integer",
// });
// export const createOrderItem = async (req: Request, res: Response) => {
//   try {
//     // Check if request is for multiple items
//     if (req.body.items && Array.isArray(req.body.items)) {
//       const data = zCreateOrderItemsDto.parse(req.body);
//       const items = await orderItemService.createOrderItems(data);
//       sendResponse<OrderItem[]>(res, {
//         success: true,
//         statusCode: httpStatus.CREATED,
//         message: `Created ${items.length} order items`,
//         data: items,
//       });
//     }
//     // Handle single item creation
//     else {
//       const data = zCreateOrderItemDto.parse(req.body);
//       const item = await orderItemService.createOrderItem(data);
//       sendResponse<OrderItem>(res, {
//         success: true,
//         statusCode: httpStatus.CREATED,
//         message: "Order item created successfully",
//         data: item,
//       });
//     }
//   } catch (error) {
//     handleErrorResponse(error, res, "create order item(s)");
//   }
// };
// /**
//  * Get all order items
//  */
// export const getAllOrderItems = async (
//   _req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const orderItems = await orderItemService.getAllOrderItems();
//     sendResponse<OrderItem[]>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Order items retrieved successfully",
//       data: orderItems,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch order items");
//   }
// };
// /**
//  * Get a single order item by ID
//  */
// export const getOrderItemById = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const orderItemId = orderItemIdSchema.parse(req.params.id);
//     const orderItem = await orderItemService.getOrderItemById(orderItemId);
//     if (!orderItem) {
//       throw new Error("Order item not found");
//     }
//     sendResponse<OrderItem>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Order item retrieved successfully",
//       data: orderItem,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch order item");
//   }
// };
// /**
//  * Update an order item by ID
//  */
// export const updateOrderItem = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const orderItemId = orderItemIdSchema.parse(req.params.id);
//     const data = zUpdateOrderItemDto.parse(req.body);
//     const updated = await orderItemService.updateOrderItem(orderItemId, data);
//     sendResponse<OrderItem>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Order item updated successfully",
//       data: updated,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "update order item");
//   }
// };
// /**
//  * Delete an order item by ID
//  */
// export const deleteOrderItem = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const orderItemId = orderItemIdSchema.parse(req.params.id);
//     await orderItemService.deleteOrderItem(orderItemId);
//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Order item deleted successfully",
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "delete order item");
//   }
// };
// --------------------------------- 222222222222222222222222222 -----------------------------
/**
 * Controller layer for OrderItem entity operations.
 * Handles HTTP requests and responses for order item-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const errorResponseHandler_1 = require("@/utils/errorResponseHandler");
const orderItemService = __importStar(require("@/modules/order_items/order-item.service"));
const order_item_dto_1 = require("@/modules/order_items/order-item.dto");
const orderItemIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Order Item ID must be a positive integer",
});
const productIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Product ID must be a positive integer",
});
/**
 * Check product stock availability
 */
const checkProductStock = async (req, res) => {
    try {
        const productId = productIdSchema.parse(req.params.productId);
        // Use z.coerce to automatically convert strings to numbers
        const quantity = zod_1.z.coerce
            .number()
            .int()
            .positive("Quantity must be positive")
            .parse(req.query.quantity || "1");
        const packageSize = zod_1.z.coerce
            .number()
            .positive("Package size must be positive")
            .parse(req.query.packageSize || "1");
        const stockInfo = await orderItemService.checkProductStock(productId, quantity, packageSize);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Stock information retrieved",
            data: stockInfo,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "check product stock");
    }
};
exports.checkProductStock = checkProductStock;
const createOrderItem = async (req, res) => {
    try {
        // Check if request is for multiple items
        if (req.body.items && Array.isArray(req.body.items)) {
            const data = order_item_dto_1.zCreateOrderItemsDto.parse(req.body);
            const items = await orderItemService.createOrderItems(data);
            (0, sendResponse_1.default)(res, {
                success: true,
                statusCode: http_status_1.default.CREATED,
                message: `Created ${items.length} order items`,
                data: items,
            });
        }
        // Handle single item creation
        else {
            const data = order_item_dto_1.zCreateOrderItemDto.parse(req.body);
            const item = await orderItemService.createOrderItem(data);
            (0, sendResponse_1.default)(res, {
                success: true,
                statusCode: http_status_1.default.CREATED,
                message: "Order item created successfully",
                data: item,
            });
        }
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create order item(s)");
    }
};
exports.createOrderItem = createOrderItem;
/**
 * Get all order items
 */
const getAllOrderItems = async (_req, res) => {
    try {
        const orderItems = await orderItemService.getAllOrderItems();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order items retrieved successfully",
            data: orderItems,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch order items");
    }
};
exports.getAllOrderItems = getAllOrderItems;
/**
 * Get a single order item by ID
 */
const getOrderItemById = async (req, res) => {
    try {
        const orderItemId = orderItemIdSchema.parse(req.params.id);
        const orderItem = await orderItemService.getOrderItemById(orderItemId);
        if (!orderItem) {
            throw new Error("Order item not found");
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order item retrieved successfully",
            data: orderItem,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch order item");
    }
};
exports.getOrderItemById = getOrderItemById;
/**
 * Update an order item by ID
 */
const updateOrderItem = async (req, res) => {
    try {
        const orderItemId = orderItemIdSchema.parse(req.params.id);
        const data = order_item_dto_1.zUpdateOrderItemDto.parse(req.body);
        const updated = await orderItemService.updateOrderItem(orderItemId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order item updated successfully",
            data: updated,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update order item");
    }
};
exports.updateOrderItem = updateOrderItem;
/**
 * Delete an order item by ID
 */
const deleteOrderItem = async (req, res) => {
    try {
        const orderItemId = orderItemIdSchema.parse(req.params.id);
        await orderItemService.deleteOrderItem(orderItemId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order item deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete order item");
    }
};
exports.deleteOrderItem = deleteOrderItem;
