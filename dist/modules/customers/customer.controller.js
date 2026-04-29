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
exports.deleteCustomer = exports.updateCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
/**
 * Controller layer for Customer entity operations.
 * Handles HTTP requests and responses for customer-related endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const asyncHandler_1 = __importDefault(require("@/utils/asyncHandler"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const customerService = __importStar(require("@/modules/customers/customer.service"));
const customer_dto_1 = require("@/modules/customers/customer.dto");
const customerIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Customer ID must be a positive integer",
});
/**
 * Get all customers
 */
exports.getAllCustomers = (0, asyncHandler_1.default)(async (req, res) => {
    const { page, limit, sort, search } = req.query;
    const skip = (page - 1) * limit;
    const paginationParams = { page, limit, skip, sort };
    const filterParams = { search };
    const result = await customerService.getAllCustomers(paginationParams, filterParams);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Customers retrieved successfully",
        data: result.customers,
        pagination: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            totalItems: result.totalCount,
            itemsPerPage: limit,
            hasNextPage: page < result.totalPages,
            hasPreviousPage: page > 1,
        },
        meta: {
            totalUnreadMessageCount: result.totalUnreadMessageCount,
        },
    });
});
/**
 * Get a single customer by ID
 */
const getCustomerById = async (req, res) => {
    try {
        const customerId = customerIdSchema.parse(req.params.id);
        const customer = await customerService.getCustomerById(customerId);
        if (!customer) {
            (0, sendResponse_1.default)(res, {
                success: false,
                statusCode: http_status_1.default.NOT_FOUND,
                message: "Customer not found",
            });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Customer retrieved successfully",
            data: customer,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(http_status_1.default.BAD_REQUEST).json({ errors: error.flatten() });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to fetch customer",
            data: null,
        });
    }
};
exports.getCustomerById = getCustomerById;
/**
 * Update a customer by ID
 */
const updateCustomer = async (req, res) => {
    try {
        const customerId = customerIdSchema.parse(req.params.id);
        const data = customer_dto_1.zUpdateCustomerDto.parse(req.body);
        const updated = await customerService.updateCustomer(customerId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Customer updated successfully",
            data: updated,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(http_status_1.default.BAD_REQUEST).json({ errors: error.flatten() });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to update customer",
        });
    }
};
exports.updateCustomer = updateCustomer;
/**
 * Delete a customer by ID
 */
const deleteCustomer = async (req, res) => {
    try {
        const customerId = customerIdSchema.parse(req.params.id);
        await customerService.deleteCustomer(customerId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Customer deleted successfully",
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(http_status_1.default.BAD_REQUEST).json({ errors: error.flatten() });
            return;
        }
        (0, sendResponse_1.default)(res, {
            success: false,
            statusCode: http_status_1.default.INTERNAL_SERVER_ERROR,
            message: "Failed to delete customer",
        });
    }
};
exports.deleteCustomer = deleteCustomer;
