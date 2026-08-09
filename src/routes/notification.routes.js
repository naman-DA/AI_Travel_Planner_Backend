import { Router } from "express";

import {
    createNotification,
    getAllNotifications,
    getNotificationById,
    searchNotifications,
    filterNotifications,
    updateNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from "../controllers/notification.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Authentication for all notification routes

router.use(verifyJWT);

// Create Notification

router.post(
    "/",
    createNotification
);

// Get All Notifications

router.get(
    "/",
    getAllNotifications
);

// Search Notifications

router.get(
    "/search",
    searchNotifications
);

// Filter Notifications

router.get(
    "/filter",
    filterNotifications
);

// Mark All Notifications As Read

router.patch(
    "/read-all",
    markAllNotificationsAsRead
);

// Get Notification By ID

router.get(
    "/:notificationId",
    getNotificationById
);

// Update Notification

router.patch(
    "/:notificationId",
    updateNotification
);

// Mark Notification As Read

router.patch(
    "/:notificationId/read",
    markNotificationAsRead
);

// Delete Notification

router.delete(
    "/:notificationId",
    deleteNotification
);

export default router;