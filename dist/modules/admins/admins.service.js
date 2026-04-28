"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdmin = exports.getAdminById = exports.getAllAdmins = void 0;
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = require("../../utils/appError");
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
/**
 * Retrieves all admins from the database.
 * @returns A list of Admin objects
 */
const getAllAdmins = async () => {
    const admins = await prismaClient_1.default.admin.findMany({
        include: { user: { omit: { passwordHash: true } } },
    });
    return admins;
};
exports.getAllAdmins = getAllAdmins;
/**
 * Retrieves an admin by ID from the database.
 * @param adminId The ID of the admin to retrieve
 * @returns The requested Admin object
 * @throws AppError if the admin does not exist
 */
const getAdminById = async (adminId) => {
    const admin = await prismaClient_1.default.admin.findUnique({
        where: { adminId },
        include: { user: { omit: { passwordHash: true } } },
    });
    if (!admin)
        throw new appError_1.AppError("Admin not found", http_status_1.default.NOT_FOUND);
    return admin;
};
exports.getAdminById = getAdminById;
/**
 * Deletes an existing admin from the database.
 * @param adminId The ID of the admin to delete
 * @throws AppError if the admin does not exist
 */
const deleteAdmin = async (adminId) => {
    // check admin exits or not
    const admin = await prismaClient_1.default.admin.findUnique({
        where: { adminId },
    });
    if (!admin)
        throw new appError_1.AppError("Admin not found", http_status_1.default.NOT_FOUND);
    // Delete the admin
    await prismaClient_1.default.admin.delete({
        where: { adminId },
    });
};
exports.deleteAdmin = deleteAdmin;
