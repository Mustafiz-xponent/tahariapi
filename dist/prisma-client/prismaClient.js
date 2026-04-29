"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@/generated/prisma/client");
const isTest = process.env.NODE_ENV === "test";
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: isTest
                ? "file:./test.db?mode=memory&cache=shared"
                : process.env.DATABASE_URL,
        },
    },
    // @ts-ignore
    __internal: {
        engine: {
            disablePrepareStatements: true,
        },
    },
});
exports.default = prisma;
