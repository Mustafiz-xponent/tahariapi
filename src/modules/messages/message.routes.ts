/**
 * Routes for Message entity operations.
 * Defines API endpoints for message-related CRUD operations.
 */
import { Router } from "express";
import validator from "@/middlewares/validator";
import { UserRole } from "@/generated/prisma/client";
import { authMiddleware, authorizeRoles } from "@/middlewares/auth";
import * as MessageController from "@/modules/messages/message.controller";
import {
  zDeleteMessageDto,
  zMarkMessageAsReadDto,
  zSendMessageDto,
  zUpdateMessageDto,
} from "@/modules/messages/message.dto";

const router = Router();

// Route to create a new message
router.post("/", MessageController.createMessage);

// Route to get all messages
router.get("/", authMiddleware, MessageController.getAllMessages);

// Route to get a message by ID
router.get("/:id", MessageController.getMessageById);

// Route to update a message's details
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CUSTOMER),
  validator(zUpdateMessageDto),
  MessageController.updateMessage,
);

// Route to delete a message
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CUSTOMER),
  validator(zDeleteMessageDto),
  MessageController.deleteMessage,
);

// Route to send message
router.post(
  "/send",
  authMiddleware,
  validator(zSendMessageDto),
  MessageController.sendMessage,
);
// Route to mark message as read
router.patch(
  "/read",
  authMiddleware,
  validator(zMarkMessageAsReadDto),
  MessageController.markMessageAsRead,
);

// Add BEFORE other routes
router.get(
  "/unread-count",
  authMiddleware,
  MessageController.getTotalUnreadCount,
);

export default router;
