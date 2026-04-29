"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFarmerPayment = createFarmerPayment;
exports.getAllFarmerPayments = getAllFarmerPayments;
exports.getFarmerPaymentById = getFarmerPaymentById;
exports.updateFarmerPayment = updateFarmerPayment;
exports.deleteFarmerPayment = deleteFarmerPayment;
//src/modules/farmer_payments/farmer_payment.service.ts
/**
 * Service layer for FarmerPayment entity operations.
 * Contains business logic and database interactions for farmer payments.
 */
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const errorHandler_1 = require("@/utils/errorHandler");
/**
 * Create a new farmer payment
 * @param data - Data required to create a farmer payment
 * @returns The created farmer payment
 * @throws Error if the farmer payment cannot be created (e.g., invalid foreign keys)
 */
async function createFarmerPayment(data) {
    try {
        const farmerPayment = await prismaClient_1.default.farmerPayment.create({
            data: {
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                paymentDate: data.paymentDate ?? new Date(),
                notes: data.notes,
                transactionId: data.transactionId,
                farmerFarmerId: data.farmerFarmerId,
            },
        });
        return farmerPayment;
    }
    catch (error) {
        throw new Error(`Failed to create farmer payment: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve all farmer payments
 * @returns An array of all farmer payments
 * @throws Error if the query fails
 */
async function getAllFarmerPayments() {
    try {
        const farmerPayments = await prismaClient_1.default.farmerPayment.findMany();
        return farmerPayments;
    }
    catch (error) {
        throw new Error(`Failed to fetch farmer payments: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Retrieve a farmer payment by its ID
 * @param paymentId - The ID of the farmer payment
 * @returns The farmer payment if found, or null if not found
 * @throws Error if the query fails
 */
async function getFarmerPaymentById(paymentId) {
    try {
        const farmerPayment = await prismaClient_1.default.farmerPayment.findUnique({
            where: { paymentId: Number(paymentId) },
        });
        return farmerPayment;
    }
    catch (error) {
        throw new Error(`Failed to fetch farmer payment: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a farmer payment by its ID
 * @param paymentId - The ID of the farmer payment to update
 * @param data - Data to update the farmer payment
 * @returns The updated farmer payment
 * @throws Error if the farmer payment is not found or update fails
 */
async function updateFarmerPayment(paymentId, data) {
    try {
        const farmerPayment = await prismaClient_1.default.farmerPayment.update({
            where: { paymentId: Number(paymentId) },
            data: {
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                paymentDate: data.paymentDate,
                notes: data.notes,
                transactionId: data.transactionId,
                farmerFarmerId: data.farmerFarmerId,
            },
        });
        return farmerPayment;
    }
    catch (error) {
        throw new Error(`Failed to update farmer payment: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a farmer payment by its ID
 * @param paymentId - The ID of the farmer payment to delete
 * @throws Error if the farmer payment is not found or deletion fails
 */
async function deleteFarmerPayment(paymentId) {
    try {
        await prismaClient_1.default.farmerPayment.delete({
            where: { paymentId: Number(paymentId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete farmer payment: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
