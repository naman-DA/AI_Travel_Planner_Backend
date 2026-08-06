import mongoose, { Schema } from "mongoose";

/* ==========================================================
                    Notification Schema
========================================================== */

const notificationSchema = new Schema(
  {

    // ======================================================
    // User
    // ======================================================

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ======================================================
    // Related References
    // ======================================================

    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
    },

    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },

    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },

    // ======================================================
    // Notification Details
    // ======================================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    notificationType: {
      type: String,
      enum: [
        "Trip",
        "Booking",
        "Payment",
        "Reminder",
        "Weather",
        "Promotion",
        "Security",
        "System",
        "Chat",
        "Offer",
        "Wishlist",
      ],
      required: true,
    },

    // ======================================================
    // Delivery Channel
    // ======================================================

    channel: {
      type: String,
      enum: [
        "InApp",
        "Email",
        "SMS",
        "Push",
      ],
      default: "InApp",
    },

    // ======================================================
    // Priority
    // ======================================================

    priority: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
        "Critical",
      ],
      default: "Medium",
    },

    // ======================================================
    // Read Status
    // ======================================================

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: Date,

    // ======================================================
    // Delivery Status
    // ======================================================

    deliveryStatus: {
      type: String,
      enum: [
        "Pending",
        "Sent",
        "Delivered",
        "Failed",
      ],
      default: "Pending",
    },

    sentAt: Date,

    deliveredAt: Date,

    // ======================================================
    // Action
    // ======================================================

    actionUrl: String,

    actionLabel: String,

    // ======================================================
    // Extra Metadata
    // ======================================================

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // ======================================================
    // Expiry
    // ======================================================

    expiresAt: Date,

  },
  {
    timestamps: true,
  }
);

/* ==========================================================
                    Indexes
========================================================== */

notificationSchema.index({
  user: 1,
  createdAt: -1,
});

notificationSchema.index({
  isRead: 1,
});

notificationSchema.index({
  notificationType: 1,
});

notificationSchema.index({
  deliveryStatus: 1,
});

notificationSchema.index({
  expiresAt: 1,
});

/* ==========================================================
                    TTL Index (Optional)
    Automatically removes expired notifications
========================================================== */

notificationSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

/* ==========================================================
                    Model
========================================================== */

export const Notification = mongoose.model(
  "Notification",
  notificationSchema
);