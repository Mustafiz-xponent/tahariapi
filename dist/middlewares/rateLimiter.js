"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_status_1 = __importDefault(require("http-status"));
const rateLimiter = (maxRequests, time) => {
    return (0, express_rate_limit_1.default)({
        max: maxRequests,
        windowMs: time,
        message: "Too many requests, please try again later",
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, _next) => {
            res.status(http_status_1.default.TOO_MANY_REQUESTS).json({
                success: false,
                message: "Too many requests, please try again later",
            });
        },
    });
};
exports.rateLimiter = rateLimiter;
