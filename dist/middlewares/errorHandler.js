"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = require("../utils/appError");
const library_1 = require("../generated/prisma/client/runtime/library");
const handlePrismaError = (error) => {
    let message = "Database operation failed";
    let statusCode = http_status_1.default.INTERNAL_SERVER_ERROR;
    if (error instanceof library_1.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002":
                message = `Duplicate value of: ${error.meta?.target?.join(", ") || "field"}`;
                statusCode = http_status_1.default.CONFLICT;
                break;
            case "P2025":
                message = "Record not found";
                statusCode = http_status_1.default.NOT_FOUND;
                break;
            case "P2003":
                message = "Foreign key constraint violation";
                statusCode = http_status_1.default.BAD_REQUEST;
                break;
            case "P2014":
                message = "Invalid ID provided";
                statusCode = http_status_1.default.BAD_REQUEST;
                break;
            case "P2021":
                message = "Table does not exist";
                statusCode = http_status_1.default.INTERNAL_SERVER_ERROR;
                break;
            case "P2022":
                message = "Column does not exist";
                statusCode = http_status_1.default.INTERNAL_SERVER_ERROR;
                break;
            default:
                message = `Database error: ${error.message}`;
        }
    }
    else if (error instanceof library_1.PrismaClientUnknownRequestError) {
        message = "Unknown database error occurred";
    }
    else if (error instanceof library_1.PrismaClientRustPanicError) {
        message = "Database connection error";
    }
    else if (error instanceof library_1.PrismaClientInitializationError) {
        message = "Database initialization error";
    }
    else if (error instanceof library_1.PrismaClientValidationError) {
        message = "Invalid data provided";
        statusCode = http_status_1.default.BAD_REQUEST;
    }
    return new appError_1.AppError(message, statusCode);
};
const handleJWTError = () => new appError_1.AppError("Invalid token", http_status_1.default.UNAUTHORIZED);
const handleJWTExpiredError = () => new appError_1.AppError("Token expired", http_status_1.default.UNAUTHORIZED);
const handleValidationError = (error) => {
    const errors = Object.values(error.errors).map((err) => err.message);
    const message = `Invalid input data: ${errors.join(", ")}`;
    return new appError_1.AppError(message, http_status_1.default.BAD_REQUEST);
};
const sendErrorDev = (err, res) => {
    console.log("ERROR:", err);
    res.status(err.statusCode).json({
        success: false,
        error: {
            message: err.message,
            stack: err.stack,
            details: err,
        },
    });
};
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
            },
        });
    }
    else {
        logger_1.default.error("UNEXPECTED ERROR 💥", err);
        res.status(http_status_1.default.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: {
                message: "Something went wrong!",
            },
        });
    }
};
const globalErrorHandler = (err, req, res, next) => {
    let error = err;
    error.statusCode = error.statusCode || http_status_1.default.INTERNAL_SERVER_ERROR;
    if (err instanceof library_1.PrismaClientKnownRequestError ||
        err instanceof library_1.PrismaClientUnknownRequestError ||
        err instanceof library_1.PrismaClientRustPanicError ||
        err instanceof library_1.PrismaClientInitializationError ||
        err instanceof library_1.PrismaClientValidationError) {
        error = handlePrismaError(err);
    }
    else if (err.name === "JsonWebTokenError") {
        error = handleJWTError();
    }
    else if (err.name === "TokenExpiredError") {
        error = handleJWTExpiredError();
    }
    else if (err.name === "ValidationError") {
        error = handleValidationError(err);
    }
    if (process.env.NODE_ENV === "development") {
        sendErrorDev(error, res);
    }
    else {
        sendErrorProd(error, res);
    }
};
exports.globalErrorHandler = globalErrorHandler;
