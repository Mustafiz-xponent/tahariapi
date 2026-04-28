"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/utils/safeBigIntJsonStringify 
const safeBigIntJsonStringify = (param) => {
    return JSON.stringify(param, (_key, value) => typeof value === "bigint" ? value.toString() : value);
};
exports.default = safeBigIntJsonStringify;
