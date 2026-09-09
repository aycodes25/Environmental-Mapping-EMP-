import { Router } from "express";
import NotificationController from "./notification.controller";
import { authenticateUser } from "../../middlewares/auth.middleware";

export class NotificationRoutes {
    path = "/notifications";
    router = Router();

    constructor() {
        this.initialiseRoutes();
    }

    private initialiseRoutes(): void {
        /**
         * @GET /api/notifications
         * @DESC Get all notifications for the authenticated user (with optional category filter)
         */
        this.router.get(
            `${this.path}`,
            authenticateUser,
            NotificationController.getNotifications
        );

        /**
         * @GET /api/notifications/unread-count
         * @DESC Get unread notification count for bell badge
         */
        this.router.get(
            `${this.path}/unread-count`,
            authenticateUser,
            NotificationController.getUnreadCount
        );

        /**
         * @PATCH /api/notifications/:id/read
         * @DESC Mark a single notification as read
         */
        this.router.patch(
            `${this.path}/:id/read`,
            authenticateUser,
            NotificationController.markAsRead
        );

        /**
         * @PATCH /api/notifications/read-all
         * @DESC Mark all notifications as read
         */
        this.router.patch(
            `${this.path}/read-all`,
            authenticateUser,
            NotificationController.markAllAsRead
        );
    }
}
