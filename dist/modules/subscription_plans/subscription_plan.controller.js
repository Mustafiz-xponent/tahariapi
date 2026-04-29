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
exports.deleteSubscriptionPlan = exports.updateSubscriptionPlan = exports.getSubscriptionPlanById = exports.getAllSubscriptionPlans = exports.createSubscriptionPlan = void 0;
/**
 * Controller layer for SubscriptionPlan entity operations.
 * Handles HTTP requests and responses for subscription plan-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const errorResponseHandler_1 = require("../../utils/errorResponseHandler");
const subscriptionPlanService = __importStar(require("../../modules/subscription_plans/subscription_plan.service"));
const subscription_plan_dto_1 = require("../../modules/subscription_plans/subscription_plan.dto");
const planIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Plan ID must be a positive integer",
});
/**
 * Create a new subscription plan
 */
const createSubscriptionPlan = async (req, res) => {
    try {
        const data = subscription_plan_dto_1.zCreateSubscriptionPlanDto.parse(req.body);
        const plan = await subscriptionPlanService.createSubscriptionPlan(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Subscription plan created successfully",
            data: plan,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create subscription plan");
    }
};
exports.createSubscriptionPlan = createSubscriptionPlan;
/**
 * Get all subscription plans
 */
const getAllSubscriptionPlans = async (_req, res) => {
    try {
        const plans = await subscriptionPlanService.getAllSubscriptionPlans();
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription plans retrived successfully",
            data: plans,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch subscription plans");
    }
};
exports.getAllSubscriptionPlans = getAllSubscriptionPlans;
/**
 * Get a single subscription plan by ID
 */
const getSubscriptionPlanById = async (req, res) => {
    try {
        const planId = planIdSchema.parse(req.params.id);
        const plan = await subscriptionPlanService.getSubscriptionPlanById(planId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription plan retrived successfully",
            data: plan,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch subscription plan");
    }
};
exports.getSubscriptionPlanById = getSubscriptionPlanById;
/**
 * Update a subscription plan by ID
 */
const updateSubscriptionPlan = async (req, res) => {
    try {
        const planId = planIdSchema.parse(req.params.id);
        const data = subscription_plan_dto_1.zUpdateSubscriptionPlanDto.parse(req.body);
        const updated = await subscriptionPlanService.updateSubscriptionPlan(planId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription plan updated successfully",
            data: updated,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update subscription plan");
    }
};
exports.updateSubscriptionPlan = updateSubscriptionPlan;
/**
 * Delete a subscription plan by ID
 */
const deleteSubscriptionPlan = async (req, res) => {
    try {
        const planId = planIdSchema.parse(req.params.id);
        await subscriptionPlanService.deleteSubscriptionPlan(planId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Subscription plan deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete subscription plan");
    }
};
exports.deleteSubscriptionPlan = deleteSubscriptionPlan;
