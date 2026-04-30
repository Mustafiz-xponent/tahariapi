// /**
//  * Controller layer for Customer entity operations.
//  * Handles HTTP requests and responses for customer-related endpoints.
//  */
// import { ZodError, z } from "zod";
// import httpStatus from "http-status";
// import { Request, Response } from "express";
// import asyncHandler from "@/utils/asyncHandler";
// import sendResponse from "@/utils/sendResponse";
// import { Customer } from "@/generated/prisma/client";
// import * as customerService from "@/modules/customers/customer.service";
// import {
//   GetAllCustomersDto,
//   zUpdateCustomerDto,
// } from "@/modules/customers/customer.dto";

// const customerIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
//   message: "Customer ID must be a positive integer",
// });

// /**
//  * Get all customers
//  */
// export const getAllCustomers = asyncHandler(
//   async (req: Request, res: Response): Promise<void> => {
//     const { page, limit, sort, search } =
//       req.query as unknown as GetAllCustomersDto["query"];
//     const skip = (page - 1) * limit;
//     const paginationParams = { page, limit, skip, sort };
//     const filterParams = { search };
//     const result = await customerService.getAllCustomers(
//       paginationParams,
//       filterParams
//     );

//     sendResponse<Customer[]>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Customers retrieved successfully",
//       data: result.customers,
//       pagination: {
//         currentPage: result.currentPage,
//         totalPages: result.totalPages,
//         totalItems: result.totalCount,
//         itemsPerPage: limit,
//         hasNextPage: page < result.totalPages,
//         hasPreviousPage: page > 1,
//       },
//       meta: {
//         totalUnreadMessageCount: result.totalUnreadMessageCount,
//       },
//     });
//   }
// );

// /**
//  * Get a single customer by ID
//  */
// export const getCustomerById = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const customerId = customerIdSchema.parse(req.params.id);
//     const customer = await customerService.getCustomerById(customerId);
//     if (!customer) {
//       sendResponse(res, {
//         success: false,
//         statusCode: httpStatus.NOT_FOUND,
//         message: "Customer not found",
//       });
//       return;
//     }
//     sendResponse<Customer>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Customer retrieved successfully",
//       data: customer,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
//       return;
//     }
//     sendResponse(res, {
//       success: false,
//       statusCode: httpStatus.INTERNAL_SERVER_ERROR,
//       message: "Failed to fetch customer",
//       data: null,
//     });
//   }
// };

// /**
//  * Update a customer by ID
//  */
// export const updateCustomer = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const customerId = customerIdSchema.parse(req.params.id);
//     const data = zUpdateCustomerDto.parse(req.body);
//     const updated = await customerService.updateCustomer(customerId, data);
//     sendResponse<Customer>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Customer updated successfully",
//       data: updated,
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
//       return;
//     }
//     sendResponse(res, {
//       success: false,
//       statusCode: httpStatus.INTERNAL_SERVER_ERROR,
//       message: "Failed to update customer",
//     });
//   }
// };

// /**
//  * Delete a customer by ID
//  */
// export const deleteCustomer = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const customerId = customerIdSchema.parse(req.params.id);
//     await customerService.deleteCustomer(customerId);
//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Customer deleted successfully",
//     });
//   } catch (error) {
//     if (error instanceof ZodError) {
//       res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
//       return;
//     }
//     sendResponse(res, {
//       success: false,
//       statusCode: httpStatus.INTERNAL_SERVER_ERROR,
//       message: "Failed to delete customer",
//     });
//   }
// };

// --------------------------------- 22222222222222222222222222 --------------------------------
import { ZodError, z } from "zod";
import httpStatus from "http-status";
import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import sendResponse from "@/utils/sendResponse";
import * as customerService from "@/modules/customers/customer.service";
import {
  GetAllCustomersDto,
  zUpdateCustomerDto,
} from "@/modules/customers/customer.dto";

const customerIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Customer ID must be a positive integer",
});

/**
 * Get all customers
 */
export const getAllCustomers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    console.log("━━━ CONTROLLER DEBUG ━━━");
    console.log("1. Raw query:", req.query);

    // Safe parsing
    const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? "10"), 10) || 10),
    );
    const sort = req.query.sort === "asc" ? "asc" : "desc";
    const search = req.query.search
      ? String(req.query.search).trim()
      : undefined;

    const skip = (page - 1) * limit;

    console.log("2. Parsed params:", { page, limit, sort, search, skip });

    const result = await customerService.getAllCustomers(
      { page, limit, skip, sort },
      { search },
    );

    console.log("3. Service returned:", {
      customersCount: result.customers.length,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    });

    console.log("4. First customer from service:", result.customers[0]);

    const response = {
      success: true,
      statusCode: httpStatus.OK,
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
    };

    console.log("5. Response structure:", {
      success: response.success,
      dataLength: response.data.length,
      pagination: response.pagination,
    });

    sendResponse(res, response);
  },
);

/**
 * Get a single customer by ID
 */
export const getCustomerById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const customerId = customerIdSchema.parse(req.params.id);
    const customer = await customerService.getCustomerById(customerId);

    if (!customer) {
      sendResponse(res, {
        success: false,
        statusCode: httpStatus.NOT_FOUND,
        message: "Customer not found",
      });
      return;
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Customer retrieved successfully",
      data: customer,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch customer",
      data: null,
    });
  }
};

/**
 * Update a customer by ID
 */
export const updateCustomer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const customerId = customerIdSchema.parse(req.params.id);
    const data = zUpdateCustomerDto.parse(req.body);
    const updated = await customerService.updateCustomer(customerId, data);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Customer updated successfully",
      data: updated,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to update customer",
    });
  }
};

/**
 * Delete a customer by ID
 */
export const deleteCustomer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const customerId = customerIdSchema.parse(req.params.id);
    await customerService.deleteCustomer(customerId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(httpStatus.BAD_REQUEST).json({ errors: error.flatten() });
      return;
    }
    sendResponse(res, {
      success: false,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: "Failed to delete customer",
    });
  }
};
