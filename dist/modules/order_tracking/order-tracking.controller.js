"use strict";
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
exports.deleteOrderTracking = exports.updateOrderTracking = exports.getOrderTrackingById = exports.getOrderTrackingsByOrderId = exports.getAllOrderTrackings = exports.createOrderTracking = void 0;
/**
 * Controller layer for OrderTracking entity operations.
 * Handles HTTP requests and responses for order tracking-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const errorResponseHandler_1 = require("@/utils/errorResponseHandler");
const orderTrackingService = __importStar(require("@/modules/order_tracking/order-tracking.service"));
const order_tracking_dto_1 = require("@/modules/order_tracking/order-tracking.dto");
const idSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "ID must be a positive integer",
});
/**
 * Create a new order tracking entry
 */
const createOrderTracking = async (req, res) => {
    try {
        const data = order_tracking_dto_1.zCreateOrderTrackingDto.parse(req.body);
        const orderTracking = await orderTrackingService.createOrderTracking(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Order tracking created successfully",
            data: orderTracking,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create order tracking");
    }
};
exports.createOrderTracking = createOrderTracking;
const getAllOrderTrackings = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 10, 1);
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const result = await orderTrackingService.getAllOrderTrackings({
            skip,
            limit,
            search,
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
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
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch order trackings");
    }
};
exports.getAllOrderTrackings = getAllOrderTrackings;
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
const getOrderTrackingsByOrderId = async (req, res) => {
    try {
        const orderId = idSchema.parse(req.params.orderId);
        const orderTracking = await orderTrackingService.getOrderTrackingsByOrderId(orderId);
        if (!orderTracking || orderTracking.length === 0) {
            (0, sendResponse_1.default)(res, {
                success: true,
                statusCode: http_status_1.default.OK,
                message: "Order trackings retrieved successfully",
                data: [],
            });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order trackings retrieved successfully",
            data: orderTracking,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch order tracking");
    }
};
exports.getOrderTrackingsByOrderId = getOrderTrackingsByOrderId;
/**
 * Get a single order tracking entry by ID (for edit page)
 */
const getOrderTrackingById = async (req, res) => {
    try {
        const trackingId = idSchema.parse(req.params.id);
        const orderTracking = await orderTrackingService.getOrderTrackingById(trackingId);
        if (!orderTracking) {
            (0, sendResponse_1.default)(res, {
                success: false,
                statusCode: http_status_1.default.NOT_FOUND,
                message: "Order tracking not found",
            });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order tracking retrieved successfully",
            data: orderTracking,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch order tracking");
    }
};
exports.getOrderTrackingById = getOrderTrackingById;
/**
 * Update an order tracking entry by ID
 */
const updateOrderTracking = async (req, res) => {
    try {
        const trackingId = idSchema.parse(req.params.id);
        const data = order_tracking_dto_1.zUpdateOrderTrackingDto.parse(req.body);
        const updated = await orderTrackingService.updateOrderTracking(trackingId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order tracking updated successfully",
            data: updated,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update order tracking");
    }
};
exports.updateOrderTracking = updateOrderTracking;
/**
 * Delete an order tracking entry by ID
 */
const deleteOrderTracking = async (req, res) => {
    try {
        const trackingId = idSchema.parse(req.params.id);
        await orderTrackingService.deleteOrderTracking(trackingId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Order tracking deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete order tracking");
    }
};
exports.deleteOrderTracking = deleteOrderTracking;
