"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Routes for Message entity operations.
 * Defines API endpoints for message-related CRUD operations.
 */
const express_1 = require("express");
const validator_1 = __importDefault(require("../../middlewares/validator"));
const client_1 = require("../../generated/prisma/client");
const auth_1 = require("../../middlewares/auth");
const MessageController = __importStar(require("../../modules/messages/message.controller"));
const message_dto_1 = require("../../modules/messages/message.dto");
const router = (0, express_1.Router)();
// Route to create a new message
router.post("/", MessageController.createMessage);
// Route to get all messages
router.get("/", auth_1.authMiddleware, MessageController.getAllMessages);
// Route to get a message by ID
router.get("/:id", MessageController.getMessageById);
// Route to update a message's details
router.put("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CUSTOMER), (0, validator_1.default)(message_dto_1.zUpdateMessageDto), MessageController.updateMessage);
// Route to delete a message
router.delete("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.CUSTOMER), (0, validator_1.default)(message_dto_1.zDeleteMessageDto), MessageController.deleteMessage);
// Route to send message
router.post("/send", auth_1.authMiddleware, (0, validator_1.default)(message_dto_1.zSendMessageDto), MessageController.sendMessage);
// Route to mark message as read
router.patch("/read", auth_1.authMiddleware, (0, validator_1.default)(message_dto_1.zMarkMessageAsReadDto), MessageController.markMessageAsRead);
exports.default = router;
