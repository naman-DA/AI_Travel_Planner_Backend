import mongoose, { Schema } from "mongoose";

/* ==========================================================
                    Refund Schema
========================================================== */

const refundSchema = new Schema(
  {
    refundId: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    reason: String,

    status: {
      type: String,
      enum: [
        "Pending",
        "Processed",
        "Failed",
      ],
      default: "Pending",
    },

    processedAt: Date,
  },
  {
    _id: false,
  }
);

/* ==========================================================
                    Payment Schema
========================================================== */

const paymentSchema = new Schema(
  {

    // ======================================================
    // References
    // ======================================================

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    // ======================================================
    // Payment Information
    // ======================================================

    paymentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    orderId: {
      type: String,
      trim: true,
    },

    transactionId: {
      type: String,
      trim: true,
    },

    // ======================================================
    // Gateway
    // ======================================================

    gateway: {
      type: String,
      enum: [
        "Stripe",
        "Razorpay",
        "PayPal",
        "Cash",
        "UPI",
      ],
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "Card",
        "UPI",
        "Net Banking",
        "Wallet",
        "Cash",
      ],
      required: true,
    },

    // ======================================================
    // Amount
    // ======================================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    // ======================================================
    // Status
    // ======================================================

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Authorized",
        "Paid",
        "Failed",
        "Cancelled",
        "Refunded",
        "Partially Refunded",
      ],
      default: "Pending",
    },

    // ======================================================
    // Refund
    // ======================================================

    refund: refundSchema,

    // ======================================================
    // Gateway Response
    // ======================================================

    gatewayResponse: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // ======================================================
    // Billing Address
    // ======================================================

    billingAddress: {

      fullName: String,

      email: String,

      phoneNumber: String,

      addressLine1: String,

      addressLine2: String,

      city: String,

      state: String,

      country: String,

      postalCode: String,

    },

    // ======================================================
    // Timestamps
    // ======================================================

    paidAt: Date,

    failureReason: String,

  },
  {
    timestamps: true,
  }
);

/* ==========================================================
                    Indexes
========================================================== */

paymentSchema.index({
  paymentId: 1,
});

paymentSchema.index({
  booking: 1,
});

paymentSchema.index({
  user: 1,
});

paymentSchema.index({
  paymentStatus: 1,
});

paymentSchema.index({
  gateway: 1,
});

/* ==========================================================
                    Model
========================================================== */

export const Payment = mongoose.model(
  "Payment",
  paymentSchema
);