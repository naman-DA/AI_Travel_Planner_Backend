import mongoose, { Schema } from "mongoose";

// Booking Item Schema

const bookingItemSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "Flight",
        "Hotel",
        "Activity",
        "Transport",
        "Package",
      ],
      required: true,
    },

    provider: String,
    name: String,
    bookingReference: String,
    bookingURL: String,

    bookingDate: {
      type: Date,
      default: Date.now,
    },

    startDate: Date,
    endDate: Date,

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Cancelled",
        "Refunded",
        "Completed",
      ],
      default: "Pending",
    },

    price: {
      amount: Number,
      currency: {
        type: String,
        default: "INR",
      },
    },

    cancellationPolicy: String,

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: false,
  }
);

// Booking Schema

const bookingSchema = new Schema(
  {
    // References

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },

    // Booking Details

    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    bookingItems: [bookingItemSchema],

    // Booking Summary

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // Booking Status

    bookingStatus: {
      type: String,
      enum: [
        "Pending",
        "Partially Confirmed",
        "Confirmed",
        "Cancelled",
        "Completed",
      ],
      default: "Pending",
    },

    // Payment

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
        "Partially Refunded",
      ],
      default: "Pending",
    },

    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },

    // Cancellation

    cancellationReason: String,
    cancelledAt: Date,

    // AI Metadata

    bookedBy: {
      type: String,
      enum: [
        "AI",
        "User",
      ],
      default: "User",
    },

    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes

// bookingSchema.index({  bookingNumber: 1,});
// bookingSchema.index({user: 1, createdAt: -1,});
// bookingSchema.index({trip: 1,});
// bookingSchema.index({bookingStatus: 1,});
// bookingSchema.index({paymentStatus: 1,});

// Model

export const Booking = mongoose.model("Booking", bookingSchema);