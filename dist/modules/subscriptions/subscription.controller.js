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
exports.deleteSubscription = exports.resumeSubscription = exports.cancelSubscription = exports.pauseSubscription = exports.updateSubscription = exports.getCustomerSubscriptions = exports.getSubscriptionById = exports.getAllSubscriptions = exports.createSubscription = void 0;
/**
 * Controller layer for Subscription entity operations.
 * Handles HTTP requests and responses for subscription-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const errorResponseHandler_1 = require("@/utils/errorResponseHandler");
const subscription_dto_1 = require("@/modules/subscriptions/subscription.dto");
const subscriptionService = __importStar(require("@/modules/subscriptions/subscription.service"));
const subscriptionIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Subscription ID must be a positive integer",
});
/**
 * Create a new subscription
 */
const createSubscription = async (req, res) => {
    try {
        const data = req.body;
        const userId = req.user?.userId;
        const subscription = await subscriptionService.createSubscription(userId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Subscription created successfully",
            data: subscription,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create subscription");
    }
};
exports.createSubscription = createSubscription;
/**
 * Get all subscriptions
 */
const getAllSubscriptions = async (_req, res) => {
    try {
        const subscriptions = await subscriptionService.getAllSubscriptions();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscriptions retrieved successfully",
            data: subscriptions,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch subscriptions");
    }
};
exports.getAllSubscriptions = getAllSubscriptions;
/**
 * Get a single subscription by ID
 */
const getSubscriptionById = async (req, res) => {
    try {
        const subscriptionId = BigInt(req.params.id);
        const subscription = await subscriptionService.getSubscriptionById(subscriptionId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription retrieved successfully",
            data: subscription,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch subscription");
    }
};
exports.getSubscriptionById = getSubscriptionById;
/**
 * Get users subscription
 */
const getCustomerSubscriptions = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100); // Max 100 items per page
        const skip = (page - 1) * limit;
        const sort = req.query.sort === "asc" ? "asc" : "desc";
        const status = req.query.status?.toUpperCase();
        const paginationParams = { page, limit, skip, sort };
        const result = await subscriptionService.getCustomerSubscriptions(userId, paginationParams, status);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription retrieved successfully",
            data: result.subscriptions,
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
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch subscription");
    }
};
exports.getCustomerSubscriptions = getCustomerSubscriptions;
/**
 * Update a subscription by ID
 */
const updateSubscription = async (req, res) => {
    try {
        const subscriptionId = subscriptionIdSchema.parse(req.params.id);
        const data = subscription_dto_1.zUpdateSubscriptionDto.parse(req.body);
        const updated = await subscriptionService.updateSubscription(subscriptionId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription updated successfully",
            data: updated,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update subscription");
    }
};
exports.updateSubscription = updateSubscription;
/**
 * Pause customer subscription by Subscription Id
 */
const pauseSubscription = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const userId = req.user?.userId;
        const subscription = await subscriptionService.pauseSubscription(BigInt(subscriptionId), userId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription paused successfully",
            data: subscription,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "pause subscription");
    }
};
exports.pauseSubscription = pauseSubscription;
/**
 * Cancel customer subscription by Subscription Id
 */
const cancelSubscription = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const userId = req.user?.userId;
        const subscription = await subscriptionService.cancelSubscription(BigInt(subscriptionId), userId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription cancelled successfully",
            data: subscription,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "cancel subscription");
    }
};
exports.cancelSubscription = cancelSubscription;
/**
 * Resume customer subscription by Subscription Id
 */
const resumeSubscription = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const userId = req.user?.userId;
        const subscription = await subscriptionService.resumeSubscription(BigInt(subscriptionId), userId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription resumed successfully",
            data: subscription,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "resume subscription");
    }
};
exports.resumeSubscription = resumeSubscription;
/**
 * Delete a subscription by ID
 */
const deleteSubscription = async (req, res) => {
    try {
        const subscriptionId = subscriptionIdSchema.parse(req.params.id);
        await subscriptionService.deleteSubscription(subscriptionId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete subscription");
    }
};
exports.deleteSubscription = deleteSubscription;
