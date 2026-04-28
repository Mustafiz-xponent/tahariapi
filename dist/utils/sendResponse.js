"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, { success, statusCode, message, data, pagination, meta }) => {
    const responseBody = {
        success,
        statusCode,
        message,
        data,
        ...(pagination && { pagination }),
        ...(meta && { meta }),
    };
    return res.status(statusCode).json(responseBody);
};
exports.default = sendResponse;
