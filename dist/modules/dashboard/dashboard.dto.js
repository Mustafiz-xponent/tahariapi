"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zGetSalesOverviewDto = void 0;
const zod_1 = __importDefault(require("zod"));
/*
 ** Schema: Get All Deals (Query Parameters)
 ** Includes pagination, sorting
 */
const currentDate = new Date();
exports.zGetSalesOverviewDto = {
    query: zod_1.default.object({
        year: zod_1.default.coerce
            .number()
            .int()
            .positive()
            .optional()
            .default(currentDate.getFullYear()),
    }),
};
