"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderTracking = createOrderTracking;
exports.getAllOrderTrackings = getAllOrderTrackings;
exports.getOrderTrackingsByOrderId = getOrderTrackingsByOrderId;
exports.getOrderTrackingById = getOrderTrackingById;
exports.updateOrderTracking = updateOrderTracking;
exports.deleteOrderTracking = deleteOrderTracking;
/**
 * Service layer for OrderTracking entity operations.
 * Contains business logic and database interactions for order tracking entries.
 */
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const errorHandler_1 = require("@/utils/errorHandler");
/**
 * Create a new order tracking entry
 */
async function createOrderTracking(data) {
    try {
        const order = await prismaClient_1.default.order.findUnique({
            where: { orderId: Number(data.orderId) },
        });
        if (!order) {
            throw new Error("Order not found");
        }
        const orderTracking = await prismaClient_1.default.orderTracking.create({
            data: {
                status: data.status,
                description: data.description,
                orderId: data.orderId,
            },
        });
        return orderTracking;
    }
    catch (error) {
        throw new Error(`Failed to create order tracking: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
async function getAllOrderTrackings(options) {
    try {
        const { skip, limit, search } = options;
        // ✅ Check if search matches a valid OrderStatus enum value
        const searchUpperCase = search.toUpperCase();
        const validStatuses = [
            "PENDING",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
            "CONFIRMED",
        ];
        const isValidStatus = validStatuses.includes(searchUpperCase);
        // ✅ Build search filter — status is an enum, only use contains on string fields
        const whereClause = search
            ? {
                OR: [
                    // Search description (String field — supports contains)
                    {
                        description: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    // Search status (Enum field — must use exact match)
                    ...(isValidStatus
                        ? [{ status: { equals: searchUpperCase } }]
                        : []),
                ],
            }
            : {};
        const [orderTrackings, totalCount] = await Promise.all([
            prismaClient_1.default.orderTracking.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    order: {
                        select: {
                            orderId: true,
                            status: true,
                            totalAmount: true,
                            customerId: true,
                        },
                    },
                },
            }),
            prismaClient_1.default.orderTracking.count({ where: whereClause }),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        return {
            orderTrackings,
            totalCount,
            totalPages,
        };
    }
    catch (error) {
        throw new Error(`Failed to fetch order trackings: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve order trackings by order ID
 */
async function getOrderTrackingsByOrderId(orderId) {
    try {
        const orderTracking = await prismaClient_1.default.orderTracking.findMany({
            where: { orderId: Number(orderId) },
            orderBy: { createdAt: "asc" },
        });
        return orderTracking;
    }
    catch (error) {
        throw new Error(`Failed to fetch order tracking: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a single order tracking entry by tracking ID
 */
async function getOrderTrackingById(trackingId) {
    try {
        const orderTracking = await prismaClient_1.default.orderTracking.findUnique({
            where: { trackingId: Number(trackingId) },
        });
        return orderTracking;
    }
    catch (error) {
        throw new Error(`Failed to fetch order tracking: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update an order tracking entry by its ID
 */
async function updateOrderTracking(trackingId, data) {
    try {
        if (data.orderId) {
            const order = await prismaClient_1.default.order.findUnique({
                where: { orderId: Number(data.orderId) },
            });
            if (!order) {
                throw new Error("Order not found");
            }
        }
        const orderTracking = await prismaClient_1.default.orderTracking.update({
            where: { trackingId: Number(trackingId) },
            data: {
                status: data.status,
                description: data.description,
                orderId: data.orderId,
            },
        });
        return orderTracking;
    }
    catch (error) {
        throw new Error(`Failed to update order tracking: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete an order tracking entry by its ID
 */
async function deleteOrderTracking(trackingId) {
    try {
        await prismaClient_1.default.orderTracking.delete({
            where: { trackingId: Number(trackingId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete order tracking: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
