import { Notification } from "../models/notification.models.js";
import { User } from "../models/user.models.js";
import { Booking } from "../models/booking.models.js";
import { Payment } from "../models/payment.models.js";
import { Trip } from "../models/trip.models.js";
import { ApiError } from "../utils/ApiError.js";

// Populate Notification

const populateNotification = (query) => {
    return query
        .populate(
            "user",
            "fullName email avatar"
        );
};

// Validate User

const validateUser = async (
    userId
) => {
    const user =
        await User.findById(
            userId
        );

    if (!user) {
        throw new ApiError(
            404,
            "User not found."
        );
    }

    return user;
};

// Validate Reference

const validateReference = async ({
    referenceId,
    referenceModel,
    user,
}) => {
    if (
        !referenceId ||
        !referenceModel
    ) {
        return;
    }

    let document;

    if (
        referenceModel ===
        "Booking"
    ) {
        document =
            await Booking.findOne({
                _id: referenceId,
                user,
                isActive: true,
            });
    }

    if (
        referenceModel ===
        "Payment"
    ) {
        document =
            await Payment.findOne({
                _id: referenceId,
                user,
                isActive: true,
            });
    }

    if (
        referenceModel ===
        "Trip"
    ) {
        document =
            await Trip.findOne({
                _id: referenceId,
                user,
                isActive: true,
            });
    }

    if (!document) {
        throw new ApiError(
            404,
            `${referenceModel} not found.`
        );
    }

    return document;
};

// Create Notification

const createNotification = async (
    notificationData
) => {
    // Validate User

    await validateUser(
        notificationData.user
    );

    // Validate Reference

    await validateReference({
        referenceId:
            notificationData.referenceId,
        referenceModel:
            notificationData.referenceModel,
        user: notificationData.user,
    });

    // Create Notification

    const notification =
        await Notification.create(
            notificationData
        );

    // Return Populated Notification

    return await populateNotification(
        Notification.findById(
            notification._id
        )
    );
};

// Get All Notifications

const getAllNotifications = async ({
    page = 1,
    limit = 10,
    user,
} = {}) => {
    page = Number(page);
    limit = Number(limit);

    const skip =
        (page - 1) * limit;

    const [
        notifications,
        total,
    ] = await Promise.all([
        populateNotification(
            Notification.find({
                user,
                isActive: true,
            })
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
        ),

        Notification.countDocuments({
            user,
            isActive: true,
        }),
    ]);

    return {
        notifications,
        pagination: {
            page,
            limit,
            total,
            totalPages:
                Math.ceil(
                    total / limit
                ),
        },
    };
};

// Get Notification By ID

const getNotificationById = async ({
    notificationId,
    user,
}) => {
    const notification =
        await populateNotification(
            Notification.findOne({
                _id: notificationId,
                user,
                isActive: true,
            })
        );

    if (!notification) {
        throw new ApiError(
            404,
            "Notification not found."
        );
    }

    return notification;
};

// Search Notifications

const searchNotifications = async (
    keyword,
    user
) => {
    if (!keyword) {
        return [];
    }

    return await populateNotification(
        Notification.find({
            user,
            isActive: true,
            $or: [
                {
                    title: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    message: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    type: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
            ],
        })
            .sort({
                createdAt: -1,
            })
            .limit(20)
    );
};

// Filter Notifications

const filterNotifications = async ({
    user,
    type,
    isRead,
} = {}) => {
    const query = {
        user,
        isActive: true,
    };

    if (type) {
        query.type = type;
    }

    if (
        isRead !== undefined
    ) {
        query.isRead =
            isRead === true ||
            isRead === "true";
    }

    return await populateNotification(
        Notification.find(query)
            .sort({
                createdAt: -1,
            })
    );
};

// Update Notification

const updateNotification = async ({
    notificationId,
    notificationData,
    user,
}) => {
    const notification =
        await Notification.findOne({
            _id: notificationId,
            user,
            isActive: true,
        });

    if (!notification) {
        throw new ApiError(
            404,
            "Notification not found."
        );
    }

    // Validate Reference

    if (
        notificationData.referenceId ||
        notificationData.referenceModel
    ) {
        await validateReference({
            referenceId:
                notificationData.referenceId ||
                notification.referenceId,
            referenceModel:
                notificationData.referenceModel ||
                notification.referenceModel,
            user,
        });
    }

    // Update Fields

    Object.entries(
        notificationData
    ).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null
        ) {
            notification[key] =
                value;
        }
    });

    // Maintain Read Timestamp

    if (
        notification.isRead &&
        !notification.readAt
    ) {
        notification.readAt =
            new Date();
    }

    if (
        notification.isRead === false
    ) {
        notification.readAt =
            null;
    }

    await notification.save();

    return await populateNotification(
        Notification.findById(
            notification._id
        )
    );
};

// Mark Notification As Read

const markNotificationAsRead =
    async ({
        notificationId,
        user,
    }) => {
        const notification =
            await Notification.findOne({
                _id: notificationId,
                user,
                isActive: true,
            });

        if (!notification) {
            throw new ApiError(
                404,
                "Notification not found."
            );
        }

        notification.isRead =
            true;

        notification.readAt =
            new Date();

        await notification.save();

        return await populateNotification(
            Notification.findById(
                notification._id
            )
        );
    };

// Mark All Notifications As Read

const markAllNotificationsAsRead =
    async (user) => {
        const result =
            await Notification.updateMany(
                {
                    user,
                    isActive: true,
                    isRead: false,
                },
                {
                    $set: {
                        isRead: true,
                        readAt: new Date(),
                    },
                }
            );

        return {
            modifiedCount:
                result.modifiedCount,
        };
    };

// Delete Notification

const deleteNotification = async ({
    notificationId,
    user,
}) => {
    const notification =
        await Notification.findOne({
            _id: notificationId,
            user,
            isActive: true,
        });

    if (!notification) {
        throw new ApiError(
            404,
            "Notification not found."
        );
    }

    notification.isActive =
        false;

    await notification.save();
};

export const notificationService = {
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