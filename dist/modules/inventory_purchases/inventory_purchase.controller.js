"use strict";
// /**
//  * Controller layer for InventoryPurchase entity operations.
//  * Handles HTTP requests and responses for inventory purchase-related endpoints.
//  */
// import { z } from "zod";
// import httpStatus from "http-status";
// import { Request, Response } from "express";
// import sendResponse from "../../utils/sendResponse";
// import { InventoryPurchase } from "../../generated/prisma/client";
// import { handleErrorResponse } from "../../utils/errorResponseHandler";
// import * as inventoryPurchaseService from "../../modules/inventory_purchases/inventory_purchase.service";
// import {
//   zCreateInventoryPurchaseDto,
//   zUpdateInventoryPurchaseDto,
// } from "../../modules/inventory_purchases/inventory-purchase.dto";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInventoryPurchase = exports.updateInventoryPurchase = exports.getInventoryPurchaseById = exports.getAllInventoryPurchases = exports.createInventoryPurchase = void 0;
// const purchaseIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
//   message: "Purchase ID must be a positive integer",
// });
// /**
//  * Create a new inventory purchase
//  */
// export const createInventoryPurchase = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const data = zCreateInventoryPurchaseDto.parse(req.body);
//     const purchase = await inventoryPurchaseService.createInventoryPurchase(
//       data
//     );
//     sendResponse<InventoryPurchase>(res, {
//       success: true,
//       statusCode: httpStatus.CREATED,
//       message: "Inventory purchase created successfully",
//       data: purchase,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "create inventory purchase");
//   }
// };
// /**
//  * Get all inventory purchases
//  */
// export const getAllInventoryPurchases = async (
//   _req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const purchases = await inventoryPurchaseService.getAllInventoryPurchases();
//     sendResponse<InventoryPurchase[]>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Inventory purchases retrieved successfully",
//       data: purchases,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch inventory purchases");
//   }
// };
// /**
//  * Get a single inventory purchase by ID
//  */
// export const getInventoryPurchaseById = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const purchaseId = purchaseIdSchema.parse(req.params.id);
//     const purchase = await inventoryPurchaseService.getInventoryPurchaseById(
//       purchaseId
//     );
//     if (!purchase) {
//       throw new Error("Inventory purchase not found");
//     }
//     sendResponse<InventoryPurchase>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Inventory purchase retrieved successfully",
//       data: purchase,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "fetch inventory purchase");
//   }
// };
// /**
//  * Update an inventory purchase by ID
//  */
// export const updateInventoryPurchase = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const purchaseId = purchaseIdSchema.parse(req.params.id);
//     const data = zUpdateInventoryPurchaseDto.parse(req.body);
//     const updatedInventoryPurchase =
//       await inventoryPurchaseService.updateInventoryPurchase(purchaseId, data);
//     sendResponse<InventoryPurchase>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Inventory purchase updated successfully",
//       data: updatedInventoryPurchase,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "update inventory purchase");
//   }
// };
// /**
//  * Delete an inventory purchase by ID
//  */
// export const deleteInventoryPurchase = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const purchaseId = purchaseIdSchema.parse(req.params.id);
//     await inventoryPurchaseService.deleteInventoryPurchase(purchaseId);
//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Inventory purchase deleted successfully",
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "delete inventory purchase");
//   }
// };
// ----------------------- 2222222222222222222222 -------------------
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const errorResponseHandler_1 = require("../../utils/errorResponseHandler");
const inventory_purchase_service_1 = require("../../modules/inventory_purchases/inventory_purchase.service");
const inventory_purchase_dto_1 = require("../../modules/inventory_purchases/inventory-purchase.dto");
const purchaseIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Purchase ID must be a positive integer",
});
const createInventoryPurchase = async (req, res) => {
    try {
        const data = inventory_purchase_dto_1.zCreateInventoryPurchaseDto.parse(req.body);
        const purchase = await (0, inventory_purchase_service_1.createInventoryPurchase)(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Inventory purchase created successfully",
            data: purchase,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create inventory purchase");
    }
};
exports.createInventoryPurchase = createInventoryPurchase;
const getAllInventoryPurchases = async (req, res) => {
    try {
        const { search = "", limit = "10", page = "1" } = req.query;
        // ✅ Explicit type assertion to ensure correct shape
        const result = await (0, inventory_purchase_service_1.getAllInventoryPurchases)({
            search: search,
            limit: parseInt(limit, 10),
            page: parseInt(page, 10),
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Inventory purchases retrieved successfully",
            data: result.data,
            pagination: result.pagination,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch inventory purchases");
    }
};
exports.getAllInventoryPurchases = getAllInventoryPurchases;
const getInventoryPurchaseById = async (req, res) => {
    try {
        const purchaseId = purchaseIdSchema.parse(req.params.id);
        const purchase = await (0, inventory_purchase_service_1.getInventoryPurchaseById)(purchaseId);
        if (!purchase) {
            throw new Error("Inventory purchase not found");
        }
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Inventory purchase retrieved successfully",
            data: purchase,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "fetch inventory purchase");
    }
};
exports.getInventoryPurchaseById = getInventoryPurchaseById;
const updateInventoryPurchase = async (req, res) => {
    try {
        const purchaseId = purchaseIdSchema.parse(req.params.id);
        const data = inventory_purchase_dto_1.zUpdateInventoryPurchaseDto.parse(req.body);
        const updatedInventoryPurchase = await (0, inventory_purchase_service_1.updateInventoryPurchase)(purchaseId, data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Inventory purchase updated successfully",
            data: updatedInventoryPurchase,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update inventory purchase");
    }
};
exports.updateInventoryPurchase = updateInventoryPurchase;
const deleteInventoryPurchase = async (req, res) => {
    try {
        const purchaseId = purchaseIdSchema.parse(req.params.id);
        await (0, inventory_purchase_service_1.deleteInventoryPurchase)(purchaseId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Inventory purchase deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete inventory purchase");
    }
};
exports.deleteInventoryPurchase = deleteInventoryPurchase;
