// /**
//  * Controller layer for InventoryPurchase entity operations.
//  * Handles HTTP requests and responses for inventory purchase-related endpoints.
//  */
// import { z } from "zod";
// import httpStatus from "http-status";
// import { Request, Response } from "express";
// import sendResponse from "@/utils/sendResponse";
// import { InventoryPurchase } from "@/generated/prisma/client";
// import { handleErrorResponse } from "@/utils/errorResponseHandler";
// import * as inventoryPurchaseService from "@/modules/inventory_purchases/inventory_purchase.service";
// import {
//   zCreateInventoryPurchaseDto,
//   zUpdateInventoryPurchaseDto,
// } from "@/modules/inventory_purchases/inventory-purchase.dto";

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
import { z } from "zod";
import httpStatus from "http-status";
import { Request, Response } from "express";
import sendResponse from "@/utils/sendResponse";
import { InventoryPurchase } from "@/generated/prisma/client";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import {
  createInventoryPurchase as createInventoryPurchaseService,
  getAllInventoryPurchases as getAllInventoryPurchasesService,
  getInventoryPurchaseById as getInventoryPurchaseByIdService,
  updateInventoryPurchase as updateInventoryPurchaseService,
  deleteInventoryPurchase as deleteInventoryPurchaseService,
} from "@/modules/inventory_purchases/inventory_purchase.service";
import {
  zCreateInventoryPurchaseDto,
  zUpdateInventoryPurchaseDto,
} from "@/modules/inventory_purchases/inventory-purchase.dto";

// ✅ Explicit pagination type to force TypeScript to match IPagination
interface PaginationShape {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginatedResult {
  data: InventoryPurchase[];
  pagination: PaginationShape;
}

const purchaseIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Purchase ID must be a positive integer",
});

export const createInventoryPurchase = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = zCreateInventoryPurchaseDto.parse(req.body);
    const purchase = await createInventoryPurchaseService(data);
    sendResponse<InventoryPurchase>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Inventory purchase created successfully",
      data: purchase,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create inventory purchase");
  }
};

export const getAllInventoryPurchases = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { search = "", limit = "10", page = "1" } = req.query;

    // ✅ Explicit type assertion to ensure correct shape
    const result: PaginatedResult = await getAllInventoryPurchasesService({
      search: search as string,
      limit: parseInt(limit as string, 10),
      page: parseInt(page as string, 10),
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Inventory purchases retrieved successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch inventory purchases");
  }
};

export const getInventoryPurchaseById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const purchaseId = purchaseIdSchema.parse(req.params.id);
    const purchase = await getInventoryPurchaseByIdService(purchaseId);
    if (!purchase) {
      throw new Error("Inventory purchase not found");
    }
    sendResponse<InventoryPurchase>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Inventory purchase retrieved successfully",
      data: purchase,
    });
  } catch (error) {
    handleErrorResponse(error, res, "fetch inventory purchase");
  }
};

export const updateInventoryPurchase = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const purchaseId = purchaseIdSchema.parse(req.params.id);
    const data = zUpdateInventoryPurchaseDto.parse(req.body);
    const updatedInventoryPurchase = await updateInventoryPurchaseService(
      purchaseId,
      data,
    );
    sendResponse<InventoryPurchase>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Inventory purchase updated successfully",
      data: updatedInventoryPurchase,
    });
  } catch (error) {
    handleErrorResponse(error, res, "update inventory purchase");
  }
};

export const deleteInventoryPurchase = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const purchaseId = purchaseIdSchema.parse(req.params.id);
    await deleteInventoryPurchaseService(purchaseId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Inventory purchase deleted successfully",
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete inventory purchase");
  }
};
