"use strict";
// import { Response } from "express";
// import { ZodError } from "zod";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleErrorResponse = handleErrorResponse;
// /**
//  * Handle error response
//  */
// export function handleErrorResponse(
//   error: unknown,
//   res: Response,
//   context: string
// ): void {
//   if (error instanceof ZodError) {
//     res.status(400).json({
//       success: false,
//       message: "Validation error",
//       errors: error.flatten(),
//     });
//     return;
//   }
//   const message = error instanceof Error ? error.message : "An error occurred";
//   const statusCode = message.toLowerCase().includes("not found") ? 404 : 500;
//   console.error(`Error in ${context}:`, error);
//   res.status(statusCode).json({
//     success: false,
//     message,
//   });
// }
const client_1 = require("@/generated/prisma/client");
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
/**
 * Handle error response with enhanced Prisma error handling
 */
function handleErrorResponse(error, res, context) {
    // Log error for debugging
    console.error(`Error in ${context}:`, error);
    // Handle Zod validation errors
    if (error instanceof zod_1.ZodError) {
        res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: "Validation error",
            errors: error.flatten(),
        });
        return;
    }
    // Handle Prisma errors
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2001": // Record does not exist
            case "P2025": // Record to update/delete not found
                res.status(http_status_1.default.NOT_FOUND).json({
                    success: false,
                    message: "Resource not found",
                    error: error.message,
                });
                break;
            case "P2002": // Unique constraint failed
                res.status(http_status_1.default.CONFLICT).json({
                    success: false,
                    message: "Unique constraint violation",
                    error: error.message,
                    field: error.meta?.target,
                });
                break;
            case "P2003": // Foreign key constraint failed
                res.status(http_status_1.default.CONFLICT).json({
                    success: false,
                    message: "Foreign key constraint violation",
                    error: error.message,
                    field: error.meta?.field_name,
                });
                break;
            case "P2004": // Constraint failed
                res.status(http_status_1.default.CONFLICT).json({
                    success: false,
                    message: "Constraint violation",
                    error: error.message,
                });
                break;
            case "P2014": // Required relation violation
                res.status(http_status_1.default.BAD_REQUEST).json({
                    success: false,
                    message: "Invalid relation data",
                    error: error.message,
                });
                break;
            default:
                res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
                    success: false,
                    message: "Database operation failed",
                    error: error.message,
                });
        }
        return;
    }
    // Handle Prisma validation errors
    if (error instanceof client_1.Prisma.PrismaClientValidationError) {
        res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: "Invalid data provided",
            error: error.message,
        });
        return;
    }
    // Handle Prisma initialization errors
    if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Database connection error",
            error: error.message,
        });
        return;
    }
    // Handle Prisma RustPanic errors (rare but possible)
    if (error instanceof client_1.Prisma.PrismaClientRustPanicError) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Critical database error",
            error: "Internal server error",
        });
        return;
    }
    // Handle Prisma unknown request errors
    if (error instanceof client_1.Prisma.PrismaClientUnknownRequestError) {
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unknown database error",
            error: error.message,
        });
        return;
    }
    // Parse error message for non-instance errors (stringified Prisma errors)
    if (typeof error === "string" || error instanceof Error) {
        const errorMessage = typeof error === "string" ? error : error.message;
        // Check for common Prisma error patterns in string format
        if (errorMessage.includes("prisma") &&
            errorMessage.toLowerCase().includes("not found")) {
            res.status(http_status_1.default.NOT_FOUND).json({
                success: false,
                message: "Resource not found",
                error: errorMessage,
            });
            return;
        }
        if (errorMessage.includes("prisma") &&
            errorMessage.toLowerCase().includes("unique constraint")) {
            res.status(http_status_1.default.CONFLICT).json({
                success: false,
                message: "Duplicate entry",
                error: errorMessage,
            });
            return;
        }
        // Default status code based on error message
        const statusCode = errorMessage.toLowerCase().includes("not found")
            ? http_status_1.default.NOT_FOUND
            : http_status_1.default.INTERNAL_SERVER_ERROR;
        res.status(statusCode).json({
            success: false,
            message: `Failed to ${context}`,
            error: errorMessage || "An error occurred",
        });
        return;
    }
    // Fallback for any other error types
    res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "An unexpected error occurred",
    });
}
