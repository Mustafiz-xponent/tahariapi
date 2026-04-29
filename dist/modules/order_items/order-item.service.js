"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderItem = createOrderItem;
exports.checkProductStock = checkProductStock;
exports.createOrderItems = createOrderItems;
exports.getAllOrderItems = getAllOrderItems;
exports.getOrderItemById = getOrderItemById;
exports.updateOrderItem = updateOrderItem;
exports.deleteOrderItem = deleteOrderItem;
/**
 * Service layer for OrderItem entity operations.
 * Contains business logic and database interactions for order items.
 */
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const errorHandler_1 = require("@/utils/errorHandler");
/**
 * Create a new order item
 * @param data - Data required to create an order item
 * @returns The created order item
 * @throws Error if the order item cannot be created (e.g., invalid orderId or productId)
 */
async function createOrderItem(data) {
    try {
        // Validate orderId existence
        const order = await prismaClient_1.default.order.findUnique({
            where: { orderId: Number(data.orderId) },
        });
        if (!order) {
            throw new Error("Order not found");
        }
        // Validate productId existence
        const product = await prismaClient_1.default.product.findUnique({
            where: { productId: data.productId },
        });
        if (!product) {
            throw new Error("Product not found");
        }
        if (product.stockQuantity < data.quantity * data.packageSize) {
            throw new Error("Insufficient stock quantity");
        }
        const orderItem = await prismaClient_1.default.orderItem.create({
            data: {
                quantity: data.quantity,
                unitPrice: data.unitPrice,
                unitType: data.unitType,
                packageSize: data.packageSize,
                subtotal: data.subtotal,
                orderId: Number(data.orderId),
                productId: Number(data.productId),
            },
        });
        return orderItem;
    }
    catch (error) {
        throw new Error(`Failed to create order item: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Check product stock availability
 */
/**
 * Check product stock availability
 */
async function checkProductStock(productId, quantity, packageSize) {
    try {
        const product = await prismaClient_1.default.product.findUnique({
            where: { productId: Number(productId) },
        });
        if (!product) {
            throw new Error("Product not found");
        }
        // requiredStock = packageSize (minimum to add to cart)
        const requiredStock = packageSize;
        // Out of stock if currentStock < packageSize
        const isAvailable = product.stockQuantity >= requiredStock;
        return {
            available: isAvailable,
            currentStock: product.stockQuantity,
            requiredStock: requiredStock,
            message: isAvailable
                ? "Stock available"
                : `Out of stock. Available: ${product.stockQuantity}${product.stockQuantity > 0 ? ", Need at least: " + requiredStock : ""}`,
        };
    }
    catch (error) {
        throw new Error(`Failed to check stock: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Creates multiple order items with validation.
 * @param {CreateOrderItemsDto} data - Order ID and items to create
 * @returns {Promise<Prisma.OrderItem[]>} Created order items
 * @throws {Error} If order or products don't exist
 */
async function createOrderItems(data) {
    try {
        // Convert all IDs to BigInt for consistent comparison
        const orderId = data.orderId;
        const productIds = data.items.map((item) => item.productId);
        // Validate order exists (convert to number for Prisma query)
        const order = await prismaClient_1.default.order.findUnique({
            where: { orderId: Number(orderId) },
        });
        if (!order)
            throw new Error(`Order not found: ${orderId.toString()}`);
        // Validate products exist
        const products = await prismaClient_1.default.product.findMany({
            where: {
                productId: {
                    in: productIds.map((id) => Number(id)), // Convert to number for query
                },
            },
        });
        // Compare using BigInt for type safety
        const missingProducts = productIds.filter((id) => !products.some((p) => BigInt(p.productId) === id));
        if (missingProducts.length > 0) {
            throw new Error(`Products not found: ${missingProducts.join(", ")}`);
        }
        // Validate stock quantity
        for (const item of data.items) {
            const product = products.find((p) => BigInt(p.productId) === item.productId);
            if (!product) {
                throw new Error(`Product not found: ${item.productId.toString()}`);
            }
            if (product.stockQuantity < item.quantity * item.packageSize) {
                throw new Error(`Insufficient stock quantity for product ${item.productId.toString()}`);
            }
        }
        // Create items in transaction (convert to number for Prisma)
        return prismaClient_1.default.$transaction(data.items.map((item) => prismaClient_1.default.orderItem.create({
            data: {
                orderId: Number(orderId),
                productId: Number(item.productId),
                unitType: item.unitType,
                packageSize: item.packageSize,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
            },
        })));
    }
    catch (error) {
        throw new Error(`Failed to create order item: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all order items
 * @returns An array of all order items
 * @throws Error if the query fails
 */
async function getAllOrderItems() {
    try {
        const orderItems = await prismaClient_1.default.orderItem.findMany();
        return orderItems;
    }
    catch (error) {
        throw new Error(`Failed to fetch order items: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve an order item by its ID
 * @param orderItemId - The ID of the order item
 * @returns The order item if found, or null if not found
 * @throws Error if the query fails
 */
async function getOrderItemById(orderItemId) {
    try {
        const orderItem = await prismaClient_1.default.orderItem.findUnique({
            where: { orderItemId: Number(orderItemId) },
        });
        return orderItem;
    }
    catch (error) {
        throw new Error(`Failed to fetch order item: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update an order item by its ID
 * @param orderItemId - The ID of the order item to update
 * @param data - Data to update the order item
 * @returns The updated order item
 * @throws Error if the order item is not found or update fails
 */
async function updateOrderItem(orderItemId, data) {
    try {
        // Validate orderId existence if provided
        if (data.orderId) {
            const order = await prismaClient_1.default.order.findUnique({
                where: { orderId: Number(data.orderId) },
            });
            if (!order) {
                throw new Error("Order not found");
            }
        }
        // Validate productId existence if provided
        if (data.productId) {
            const product = await prismaClient_1.default.product.findUnique({
                where: { productId: data.productId },
            });
            if (!product) {
                throw new Error("Product not found");
            }
        }
        const orderItem = await prismaClient_1.default.orderItem.update({
            where: { orderItemId: Number(orderItemId) },
            data: {
                quantity: data.quantity,
                unitPrice: data.unitPrice,
                unitType: data.unitType,
                packageSize: data.packageSize,
                subtotal: data.subtotal,
                orderId: data.orderId,
                productId: data.productId,
            },
        });
        return orderItem;
    }
    catch (error) {
        throw new Error(`Failed to update order item: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete an order item by its ID
 * @param orderItemId - The ID of the order item to delete
 * @throws Error if the order item is not found or deletion fails
 */
async function deleteOrderItem(orderItemId) {
    try {
        await prismaClient_1.default.orderItem.delete({
            where: { orderItemId: Number(orderItemId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete order item: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
