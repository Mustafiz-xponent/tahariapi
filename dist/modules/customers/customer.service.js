"use strict";
// /**
//  * Service layer for Customer entity operations.
//  * Contains business logic and database interactions for customers.
//  */
// import bcrypt from "bcrypt";
// import prisma from "../../prisma-client/prismaClient";
// import { Customer } from "../../generated/prisma/client";
// import { getErrorMessage } from "../../utils/errorHandler";
// import { UpdateCustomerDto } from "../../modules/customers/customer.dto";
// import {
//   GetAllCusotmersResult,
//   GetAllCustomersPaginationParams,
// } from "../../modules/customers/customer.interface";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCustomers = getAllCustomers;
exports.getCustomerById = getCustomerById;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
// /**
//  * Retrieve all customers
//  * @returns An array of all customers
//  * @throws Error if the query fails
//  */
// export async function getAllCustomers(
//   paginationParams: GetAllCustomersPaginationParams,
//   filterParams: { search?: string }
// ): Promise<GetAllCusotmersResult> {
//   try {
//     const { page, limit, skip, sort } = paginationParams;
//     const { search } = filterParams;
//     const [customers, totalUnreadMessageResult] = await Promise.all([
//       prisma.$queryRaw<
//         Array<{
//           customerId: bigint;
//           userId: bigint;
//           name: string | null;
//           email: string | null;
//           phone: string;
//           lastMessageId: bigint | null;
//           lastMessage: string | null;
//           lastMessageCreatedAt: Date | null;
//           unreadMessageCount: number;
//         }>
//       >`
//         SELECT
//             c."customerId",
//             u."userId",
//             u."name",
//             u."email",
//             u."phone",
//             m."messageId" as "lastMessageId",
//             m."message"   as "lastMessage",
//             m."createdAt" as "lastMessageCreatedAt",
//             COALESCE(unread_counts."unreadCount", 0) as "unreadMessageCount"
//         FROM "Customer" c
//         JOIN "User" u ON u."userId" = c."userId"
//         -- find last message per user (sent or received)
//         LEFT JOIN LATERAL (
//             SELECT msg."messageId", msg."message", msg."createdAt"
//             FROM "Message" msg
//             WHERE msg."senderId" = u."userId" OR msg."receiverId" = u."userId"
//             ORDER BY msg."createdAt" DESC
//             LIMIT 1
//         ) m ON TRUE
//         -- count unread messages (for admin/support)
//         LEFT JOIN LATERAL (
//             SELECT COUNT(*) as "unreadCount"
//             FROM "Message" um
//             WHERE um."senderId" = u."userId"
//               AND um."receiverId" IS NULL
//               AND um."status" = 'UNREAD'
//         ) unread_counts ON TRUE
//        -- Filter by name or phone
//         WHERE
//           (${search}::text IS NULL OR
//           u."name" ILIKE '%' || ${search} || '%' OR
//           u."phone" ILIKE '%' || ${search} || '%')
//         ORDER BY m."createdAt" DESC NULLS LAST
//         LIMIT ${limit} OFFSET ${skip};
//         `,
//       // Count total unread messages for admin/support
//       prisma.$queryRaw<{ totalUnreadMessageCount: number }[]>`
//       SELECT COUNT(*)::int as "totalUnreadMessageCount"
//       FROM "Message"
//       WHERE "status" = 'UNREAD'
//         AND "receiverId" IS NULL;
//   `,
//     ]);
//     // count total customers
//     const totalCount = await prisma.customer.count({
//       where: {
//         user: {
//           OR: search
//             ? [
//                 { name: { contains: search, mode: "insensitive" } },
//                 { phone: { contains: search, mode: "insensitive" } },
//               ]
//             : undefined,
//         },
//       },
//     });
//     const totalPages = Math.ceil(totalCount / limit);
//     const totalUnreadMessageCount =
//       totalUnreadMessageResult[0]?.totalUnreadMessageCount ?? 0;
//     return {
//       customers,
//       totalCount,
//       totalPages,
//       currentPage: page,
//       totalUnreadMessageCount,
//     };
//   } catch (error) {
//     console.error("Failed to fetch customers:", error);
//     throw error;
//   }
// }
// /**
//  * Retrieve a customer by its ID
//  * @param customerId - The ID of the customer
//  * @returns The customer if found, or null if not found
//  * @throws Error if the query fails
//  */
// export async function getCustomerById(
//   customerId: BigInt
// ): Promise<Customer | null> {
//   try {
//     const customer = await prisma.customer.findUnique({
//       where: { customerId: Number(customerId) },
//     });
//     return customer;
//   } catch (error) {
//     throw new Error(`Failed to fetch customer: ${getErrorMessage(error)}`);
//   }
// }
// /**
//  * Update a customer by its ID
//  * @param customerId - The ID of the customer to update
//  * @param data - Data to update the customer
//  * @returns The updated customer
//  * @throws Error if the customer is not found or update fails
//  */
// export async function updateCustomer(
//   customerId: BigInt,
//   data: UpdateCustomerDto
// ): Promise<Customer> {
//   try {
//     const updateData: any = {
//       firebaseUid: data.firebaseUid,
//       name: data.name,
//       email: data.email,
//       phone: data.phone,
//       address: data.address,
//     };
//     // Only hash and update password if provided
//     if (data.password) {
//       updateData.passwordHash = await bcrypt.hash(data.password, 10);
//     }
//     const customer = await prisma.customer.update({
//       where: { customerId: Number(customerId) },
//       data: updateData,
//     });
//     return customer;
//   } catch (error) {
//     throw new Error(`Failed to update customer: ${getErrorMessage(error)}`);
//   }
// }
// /**
//  * Delete a customer by its ID
//  * @param customerId - The ID of the customer to delete
//  * @throws Error if the customer is not found or deletion fails
//  */
// export async function deleteCustomer(customerId: BigInt): Promise<void> {
//   try {
//     await prisma.customer.delete({
//       where: { customerId: Number(customerId) },
//     });
//   } catch (error) {
//     throw new Error(`Failed to delete customer: ${getErrorMessage(error)}`);
//   }
// }
// ------------------------------- 22222222222222222222222222 -------------------------------
/**
 * Service layer for Customer entity operations.
 * Contains business logic and database interactions for customers.
 */
const bcrypt_1 = __importDefault(require("bcrypt"));
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
const errorHandler_1 = require("../../utils/errorHandler");
/**
 * Retrieve all customers with last message and unread count
 */
async function getAllCustomers(paginationParams, filterParams) {
    try {
        const { page, limit, skip } = paginationParams;
        const { search } = filterParams;
        console.log("━━━ SERVICE DEBUG ━━━");
        console.log("1. Input params:", { page, limit, skip, search });
        const whereClause = search
            ? {
                user: {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search, mode: "insensitive" } },
                    ],
                },
            }
            : {};
        console.log("2. Where clause:", JSON.stringify(whereClause, null, 2));
        // First, check if customers exist at all
        const totalCustomers = await prismaClient_1.default.customer.count();
        console.log("3. Total customers in DB:", totalCustomers);
        if (totalCustomers === 0) {
            console.log("❌ NO CUSTOMERS IN DATABASE!");
            return {
                customers: [],
                totalCount: 0,
                totalPages: 0,
                currentPage: page,
                totalUnreadMessageCount: 0,
            };
        }
        // Fetch customers
        const customersData = await prismaClient_1.default.customer.findMany({
            where: whereClause,
            skip,
            take: limit,
            include: {
                user: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                customerId: "desc",
            },
        });
        console.log("4. Customers fetched:", customersData.length);
        console.log("5. First customer raw:", customersData[0]);
        if (customersData.length === 0) {
            console.log("❌ NO CUSTOMERS MATCHED QUERY");
            console.log("   Check: skip =", skip, "might be too high");
            return {
                customers: [],
                totalCount: 0,
                totalPages: 0,
                currentPage: page,
                totalUnreadMessageCount: 0,
            };
        }
        // Get all userIds
        const userIds = customersData.map((c) => c.user.userId);
        console.log("6. User IDs:", userIds);
        // Fetch messages in batch
        const [sentMessages, receivedMessages, unreadCounts, totalUnread] = await Promise.all([
            prismaClient_1.default.message.findMany({
                where: { senderId: { in: userIds } },
                orderBy: { createdAt: "desc" },
                distinct: ["senderId"],
                select: {
                    messageId: true,
                    message: true,
                    createdAt: true,
                    senderId: true,
                },
            }),
            prismaClient_1.default.message.findMany({
                where: { receiverId: { in: userIds } },
                orderBy: { createdAt: "desc" },
                distinct: ["receiverId"],
                select: {
                    messageId: true,
                    message: true,
                    createdAt: true,
                    receiverId: true,
                },
            }),
            prismaClient_1.default.message.groupBy({
                by: ["senderId"],
                where: {
                    senderId: { in: userIds },
                    receiverId: null,
                    status: "UNREAD",
                },
                _count: {
                    messageId: true,
                },
            }),
            prismaClient_1.default.message.count({
                where: {
                    status: "UNREAD",
                    receiverId: null,
                },
            }),
        ]);
        console.log("7. Messages fetched:", {
            sent: sentMessages.length,
            received: receivedMessages.length,
            unreadGroups: unreadCounts.length,
            totalUnread,
        });
        // Create lookup maps
        const sentMessagesMap = new Map(sentMessages.map((m) => [m.senderId.toString(), m]));
        const receivedMessagesMap = new Map(receivedMessages.map((m) => [m.receiverId?.toString() || "", m]));
        const unreadCountsMap = new Map(unreadCounts.map((u) => [u.senderId.toString(), u._count.messageId]));
        // Map customers
        const customers = customersData.map((customer) => {
            const userId = customer.user.userId.toString();
            const sent = sentMessagesMap.get(userId);
            const received = receivedMessagesMap.get(userId);
            let lastMessage = null;
            if (sent && received) {
                lastMessage =
                    new Date(sent.createdAt) > new Date(received.createdAt)
                        ? sent
                        : received;
            }
            else {
                lastMessage = sent || received || null;
            }
            const unreadCount = unreadCountsMap.get(userId) || 0;
            return {
                customerId: String(customer.customerId),
                userId: String(customer.user.userId),
                name: customer.user.name,
                email: customer.user.email,
                phone: customer.user.phone,
                lastMessageId: lastMessage ? String(lastMessage.messageId) : null,
                lastMessage: lastMessage?.message ?? null,
                lastMessageCreatedAt: lastMessage?.createdAt.toISOString() ?? null,
                unreadMessageCount: unreadCount,
            };
        });
        console.log("8. Mapped customers:", customers.length);
        console.log("9. First mapped customer:", customers[0]);
        // Sort by last message
        customers.sort((a, b) => {
            if (!a.lastMessageCreatedAt && !b.lastMessageCreatedAt)
                return 0;
            if (!a.lastMessageCreatedAt)
                return 1;
            if (!b.lastMessageCreatedAt)
                return -1;
            return (new Date(b.lastMessageCreatedAt).getTime() -
                new Date(a.lastMessageCreatedAt).getTime());
        });
        const totalCount = await prismaClient_1.default.customer.count({ where: whereClause });
        const totalPages = Math.ceil(totalCount / limit);
        console.log("10. Final result:", {
            customersCount: customers.length,
            totalCount,
            totalPages,
            currentPage: page,
        });
        return {
            customers,
            totalCount,
            totalPages,
            currentPage: page,
            totalUnreadMessageCount: totalUnread,
        };
    }
    catch (error) {
        console.error("━━━ SERVICE ERROR ━━━");
        console.error(error);
        throw error;
    }
}
/**
 * Retrieve a customer by its ID
 */
async function getCustomerById(customerId) {
    try {
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { customerId },
            include: {
                user: {
                    select: {
                        userId: true,
                        name: true,
                        email: true,
                        phone: true,
                        address: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!customer)
            return null;
        return {
            customerId: String(customer.customerId),
            userId: String(customer.user.userId),
            name: customer.user.name,
            email: customer.user.email,
            phone: customer.user.phone,
            address: customer.user.address,
            status: customer.user.status,
            createdAt: customer.user.createdAt.toISOString(),
        };
    }
    catch (error) {
        throw new Error(`Failed to fetch customer: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Update a customer by its ID
 */
async function updateCustomer(customerId, data) {
    try {
        // First, get the customer to find the userId
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { customerId },
            select: { userId: true },
        });
        if (!customer) {
            throw new Error("Customer not found");
        }
        // Build update data
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.email !== undefined)
            updateData.email = data.email;
        if (data.phone !== undefined)
            updateData.phone = data.phone;
        if (data.address !== undefined) {
            updateData.address = Array.isArray(data.address)
                ? data.address
                : [data.address];
        }
        if (data.password) {
            updateData.passwordHash = await bcrypt_1.default.hash(data.password, 10);
        }
        // Update the user
        const updatedUser = await prismaClient_1.default.user.update({
            where: { userId: customer.userId },
            data: updateData,
            select: {
                userId: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                status: true,
                updatedAt: true,
                customer: {
                    select: { customerId: true },
                },
            },
        });
        return {
            customerId: String(updatedUser.customer?.customerId),
            userId: String(updatedUser.userId),
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            address: updatedUser.address,
            status: updatedUser.status,
            updatedAt: updatedUser.updatedAt.toISOString(),
        };
    }
    catch (error) {
        throw new Error(`Failed to update customer: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Delete a customer by its ID
 */
async function deleteCustomer(customerId) {
    try {
        // First get the userId
        const customer = await prismaClient_1.default.customer.findUnique({
            where: { customerId },
            select: { userId: true },
        });
        if (!customer) {
            throw new Error("Customer not found");
        }
        // Delete the user (this will cascade delete the customer if configured)
        // Or delete customer first then user
        await prismaClient_1.default.$transaction([
            prismaClient_1.default.customer.delete({
                where: { customerId },
            }),
            prismaClient_1.default.user.delete({
                where: { userId: customer.userId },
            }),
        ]);
    }
    catch (error) {
        throw new Error(`Failed to delete customer: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
