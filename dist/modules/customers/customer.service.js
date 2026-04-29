"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCustomers = getAllCustomers;
exports.getCustomerById = getCustomerById;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
/**
 * Service layer for Customer entity operations.
 * Contains business logic and database interactions for customers.
 */
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Retrieve all customers
 * @returns An array of all customers
 * @throws Error if the query fails
 */
async function getAllCustomers(paginationParams, filterParams) {
    try {
        const { page, limit, skip, sort } = paginationParams;
        const { search } = filterParams;
        const [customers, totalUnreadMessageResult] = await Promise.all([
            prismaClient_1.default.$queryRaw `
        SELECT 
            c."customerId",
            u."userId",
            u."name",
            u."email",
            u."phone",
            m."messageId" as "lastMessageId",
            m."message"   as "lastMessage",
            m."createdAt" as "lastMessageCreatedAt",
            COALESCE(unread_counts."unreadCount", 0) as "unreadMessageCount"
        FROM "Customer" c
        JOIN "User" u ON u."userId" = c."userId"

        -- find last message per user (sent or received)
        LEFT JOIN LATERAL (
            SELECT msg."messageId", msg."message", msg."createdAt"
            FROM "Message" msg
            WHERE msg."senderId" = u."userId" OR msg."receiverId" = u."userId"
            ORDER BY msg."createdAt" DESC
            LIMIT 1
        ) m ON TRUE

        -- count unread messages (for admin/support)
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as "unreadCount"
            FROM "Message" um
            WHERE um."senderId" = u."userId"
              AND um."receiverId" IS NULL
              AND um."status" = 'UNREAD'
        ) unread_counts ON TRUE
       
       -- Filter by name or phone
        WHERE 
          (${search}::text IS NULL OR 
          u."name" ILIKE '%' || ${search} || '%' OR 
          u."phone" ILIKE '%' || ${search} || '%')

        ORDER BY m."createdAt" DESC NULLS LAST
        LIMIT ${limit} OFFSET ${skip};
        `,
            // Count total unread messages for admin/support
            prismaClient_1.default.$queryRaw `
      SELECT COUNT(*)::int as "totalUnreadMessageCount"
      FROM "Message"
      WHERE "status" = 'UNREAD'
        AND "receiverId" IS NULL;
  `,
        ]);
        // count total customers
        const totalCount = await prismaClient_1.default.customer.count({
            where: {
                user: {
                    OR: search
                        ? [
                            { name: { contains: search, mode: "insensitive" } },
                            { phone: { contains: search, mode: "insensitive" } },
                        ]
                        : undefined,
                },
            },
        });
        const totalPages = Math.ceil(totalCount / limit);
        const totalUnreadMessageCount = totalUnreadMessageResult[0]?.totalUnreadMessageCount ?? 0;
        return {
            customers,
            totalCount,
            totalPages,
            currentPage: page,
            totalUnreadMessageCount,
        };
    }
    catch (error) {
        console.error("Failed to fetch customers:", error);
        throw error;
    }
}
/**
 * Retrieve a customer by its ID
 * @param customerId - The ID of the customer
 * @returns The customer if found, or null if not found
 * @throws Error if the query fails
 */
async function getCustomerById(customerId) {
    try {
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { customerId: Number(customerId) },
        });
        return customer;
    }
    catch (error) {
        throw new Error(`Failed to fetch customer: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a customer by its ID
 * @param customerId - The ID of the customer to update
 * @param data - Data to update the customer
 * @returns The updated customer
 * @throws Error if the customer is not found or update fails
 */
async function updateCustomer(customerId, data) {
    try {
        const updateData = {
            firebaseUid: data.firebaseUid,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
        };
        // Only hash and update password if provided
        if (data.password) {
            updateData.passwordHash = await bcrypt_1.default.hash(data.password, 10);
        }
        const customer = await prismaClient_1.default.customer.update({
            where: { customerId: Number(customerId) },
            data: updateData,
        });
        return customer;
    }
    catch (error) {
        throw new Error(`Failed to update customer: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a customer by its ID
 * @param customerId - The ID of the customer to delete
 * @throws Error if the customer is not found or deletion fails
 */
async function deleteCustomer(customerId) {
    try {
        await prismaClient_1.default.customer.delete({
            where: { customerId: Number(customerId) },
        });
    }
    catch (error) {
        throw new Error(`Failed to delete customer: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
