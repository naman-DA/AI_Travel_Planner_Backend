import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { notificationService } from "../services/notification.services.js";

import {
    validateCreateNotification,
    validateUpdateNotification,
    validateMarkAsRead,
    validateNotificationId,
} from "../validators/notification.validators.js";

// Create Notification

const createNotification = asyncHandler(
    async (req, res) => {
        const notificationData = {
            ...req.body,
            user: req.user._id,
        };

        validateCreateNotification(
            notificationData
        );

        const notification =
            await notificationService.createNotification(
                notificationData
            );

        return res.status(201).json(
            new ApiResponse(
                201,
                notification,
                "Notification created successfully."
            )
        );
    }
);

// Get All Notifications

const getAllNotifications = asyncHandler(
    async (req, res) => {
        const notifications =
            await notificationService.getAllNotifications({
                page: req.query.page,
                limit: req.query.limit,
                user: req.user._id,
            });

        return res.status(200).json(
            new ApiResponse(
                200,
                notifications,
                "Notifications fetched successfully."
            )
        );
    }
);

// Get Notification By ID

const getNotificationById =
    asyncHandler(
        async (req, res) => {
            const {
                notificationId,
            } = req.params;

            validateNotificationId(
                notificationId
            );

            const notification =
                await notificationService.getNotificationById({
                    notificationId,
                    user: req.user._id,
                });

            return res.status(200).json(
                new ApiResponse(
                    200,
                    notification,
                    "Notification fetched successfully."
                )
            );
        }
    );

// Search Notifications

const searchNotifications =
    asyncHandler(
        async (req, res) => {
            const notifications =
                await notificationService.searchNotifications(
                    req.query.keyword,
                    req.user._id
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    notifications,
                    "Search completed successfully."
                )
            );
        }
    );

// Filter Notifications

const filterNotifications =
    asyncHandler(
        async (req, res) => {
            const notifications =
                await notificationService.filterNotifications({
                    ...req.query,
                    user: req.user._id,
                });

            return res.status(200).json(
                new ApiResponse(
                    200,
                    notifications,
                    "Notifications filtered successfully."
                )
            );
        }
    );

// Update Notification

const updateNotification =
    asyncHandler(
        async (req, res) => {
            const {
                notificationId,
            } = req.params;

            validateNotificationId(
                notificationId
            );

            validateUpdateNotification(
                req.body
            );

            const notification =
                await notificationService.updateNotification({
                    notificationId,
                    notificationData:
                        req.body,
                    user: req.user._id,
                });

            return res.status(200).json(
                new ApiResponse(
                    200,
                    notification,
                    "Notification updated successfully."
                )
            );
        }
    );

// Mark Notification As Read

const markNotificationAsRead =
    asyncHandler(
        async (req, res) => {
            const {
                notificationId,
            } = req.params;

            validateMarkAsRead(
                notificationId
            );

            const notification =
                await notificationService.markNotificationAsRead({
                    notificationId,
                    user: req.user._id,
                });

            return res.status(200).json(
                new ApiResponse(
                    200,
                    notification,
                    "Notification marked as read successfully."
                )
            );
        }
    );

// Mark All Notifications As Read

const markAllNotificationsAsRead =
    asyncHandler(
        async (req, res) => {
            const result =
                await notificationService.markAllNotificationsAsRead(
                    req.user._id
                );

            return res.status(200).json(
                new ApiResponse(
                    200,
                    result,
                    "All notifications marked as read successfully."
                )
            );
        }
    );

// Delete Notification

const deleteNotification =
    asyncHandler(
        async (req, res) => {
            const {
                notificationId,
            } = req.params;

            validateNotificationId(
                notificationId
            );

            await notificationService.deleteNotification({
                notificationId,
                user: req.user._id,
            });

            return res.status(200).json(
                new ApiResponse(
                    200,
                    {},
                    "Notification deleted successfully."
                )
            );
        }
    );

export {
    createNotification,
    getAllNotifications,
    getNotificationById,
    searchNotifications,
    filterNotifications,
    updateNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
};