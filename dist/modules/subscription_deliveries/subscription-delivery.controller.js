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
exports.deleteSubscriptionDelivery = exports.updateSubscriptionDelivery = exports.getSubscriptionDeliveryById = exports.getAllSubscriptionDeliveries = exports.createSubscriptionDelivery = void 0;
/**
 * Controller layer for SubscriptionDelivery entity operations.
 * Handles HTTP requests and responses for subscription delivery-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const errorResponseHandler_1 = require("@/utils/errorResponseHandler");
const subscriptionDeliveryService = __importStar(require("@/modules/subscription_deliveries/subscription-delivery.service"));
const subscription_delivery_dto_1 = require("@/modules/subscription_deliveries/subscription-delivery.dto");
const deliveryIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Delivery ID must be a positive integer",
});
/**
 * Create a new subscription delivery
 */
const createSubscriptionDelivery = async (req, res) => {
    try {
        const data = subscription_delivery_dto_1.zCreateSubscriptionDeliveryDto.parse(req.body);
        const subscriptionDelivery = await subscriptionDeliveryService.createSubscriptionDelivery(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Subscription delivery created successfully",
            data: subscriptionDelivery,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create subscription delivery");
    }
};
exports.createSubscriptionDelivery = createSubscriptionDelivery;
/**
 * Get all subscription deliveries
 */
const getAllSubscriptionDeliveries = async (_req, res) => {
    try {
        const subscriptionDeliveries = await subscriptionDeliveryService.getAllSubscriptionDeliveries();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription deliveries retrieved successfully",
            data: subscriptionDeliveries,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch subscription deliveries");
    }
};
exports.getAllSubscriptionDeliveries = getAllSubscriptionDeliveries;
/**
 * Get a single subscription delivery by ID
 */
const getSubscriptionDeliveryById = async (req, res) => {
    try {
        const deliveryId = deliveryIdSchema.parse(req.params.id);
        const subscriptionDelivery = await subscriptionDeliveryService.getSubscriptionDeliveryById(deliveryId);
        if (!subscriptionDelivery) {
            throw new Error("Subscription delivery not found");
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription delivery retrieved successfully",
            data: subscriptionDelivery,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch subscription delivery");
    }
};
exports.getSubscriptionDeliveryById = getSubscriptionDeliveryById;
/**
 * Update a subscription delivery by ID
 */
const updateSubscriptionDelivery = async (req, res) => {
    try {
        const deliveryId = deliveryIdSchema.parse(req.params.id);
        const data = subscription_delivery_dto_1.zUpdateSubscriptionDeliveryDto.parse(req.body);
        const updated = await subscriptionDeliveryService.updateSubscriptionDelivery(deliveryId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription delivery updated successfully",
            data: updated,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update subscription delivery");
    }
};
exports.updateSubscriptionDelivery = updateSubscriptionDelivery;
/**
 * Delete a subscription delivery by ID
 */
const deleteSubscriptionDelivery = async (req, res) => {
    try {
        const deliveryId = deliveryIdSchema.parse(req.params.id);
        await subscriptionDeliveryService.deleteSubscriptionDelivery(deliveryId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription delivery deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete subscription delivery");
    }
};
exports.deleteSubscriptionDelivery = deleteSubscriptionDelivery;
