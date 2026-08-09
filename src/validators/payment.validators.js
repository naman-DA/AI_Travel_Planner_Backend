import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

// Create Payment Validation

const validateCreatePayment = (data) => {
    const {
        user,
        booking,
        amount,
        currency,
        paymentMethod,
        paymentGateway,
    } = data;

    // User

    if (!user) {
        throw new ApiError(
            400,
            "User ID is required."
        );
    }

    if (
        !mongoose.Types.ObjectId.isValid(
            user
        )
    ) {
        throw new ApiError(
            400,
            "Invalid user ID."
        );
    }

    // Booking

    if (!booking) {
        throw new ApiError(
            400,
            "Booking ID is required."
        );
    }

    if (
        !mongoose.Types.ObjectId.isValid(
            booking
        )
    ) {
        throw new ApiError(
            400,
            "Invalid booking ID."
        );
    }

    // Amount

    if (
        amount === undefined ||
        amount === null
    ) {
        throw new ApiError(
            400,
            "Payment amount is required."
        );
    }

    if (
        typeof amount !== "number" ||
        amount <= 0
    ) {
        throw new ApiError(
            400,
            "Payment amount must be greater than 0."
        );
    }

    // Currency

    if (
        currency !== undefined &&
        (
            typeof currency !== "string" ||
            currency.trim().length !== 3
        )
    ) {
        throw new ApiError(
            400,
            "Currency must be a valid 3-letter code."
        );
    }

    // Payment Method

    const validPaymentMethods = [
        "Card",
        "UPI",
        "Net Banking",
        "Wallet",
        "Cash",
    ];

    if (
        paymentMethod &&
        !validPaymentMethods.includes(
            paymentMethod
        )
    ) {
        throw new ApiError(
            400,
            "Invalid payment method."
        );
    }

    // Payment Gateway

    const validPaymentGateways = [
        "Razorpay",
        "Stripe",
        "PayPal",
        "Cash",
        "Other",
    ];

    if (
        paymentGateway &&
        !validPaymentGateways.includes(
            paymentGateway
        )
    ) {
        throw new ApiError(
            400,
            "Invalid payment gateway."
        );
    }
};

// Update Payment Validation

const validateUpdatePayment = (
    data
) => {
    if (
        !Object.keys(data).length
    ) {
        throw new ApiError(
            400,
            "No update data provided."
        );
    }

    // Booking

    if (
        data.booking &&
        !mongoose.Types.ObjectId.isValid(
            data.booking
        )
    ) {
        throw new ApiError(
            400,
            "Invalid booking ID."
        );
    }

    // Amount

    if (
        data.amount !== undefined
    ) {
        if (
            typeof data.amount !== "number" ||
            data.amount <= 0
        ) {
            throw new ApiError(
                400,
                "Payment amount must be greater than 0."
            );
        }
    }

    // Payment Method

    const validPaymentMethods = [
        "Card",
        "UPI",
        "Net Banking",
        "Wallet",
        "Cash",
    ];

    if (
        data.paymentMethod &&
        !validPaymentMethods.includes(
            data.paymentMethod
        )
    ) {
        throw new ApiError(
            400,
            "Invalid payment method."
        );
    }

    // Payment Gateway

    const validPaymentGateways = [
        "Razorpay",
        "Stripe",
        "PayPal",
        "Cash",
        "Other",
    ];

    if (
        data.paymentGateway &&
        !validPaymentGateways.includes(
            data.paymentGateway
        )
    ) {
        throw new ApiError(
            400,
            "Invalid payment gateway."
        );
    }

    // Payment Status

    const validPaymentStatuses = [
        "Pending",
        "Processing",
        "Paid",
        "Failed",
        "Refunded",
        "Partially Refunded",
    ];

    if (
        data.paymentStatus &&
        !validPaymentStatuses.includes(
            data.paymentStatus
        )
    ) {
        throw new ApiError(
            400,
            "Invalid payment status."
        );
    }
};

// Refund Payment Validation

const validateRefundPayment = (
    data
) => {
    const {
        refundAmount,
        refundReason,
    } = data;

    if (
        refundAmount === undefined ||
        refundAmount === null
    ) {
        throw new ApiError(
            400,
            "Refund amount is required."
        );
    }

    if (
        typeof refundAmount !== "number" ||
        refundAmount <= 0
    ) {
        throw new ApiError(
            400,
            "Refund amount must be greater than 0."
        );
    }

    if (
        refundReason !== undefined &&
        typeof refundReason !== "string"
    ) {
        throw new ApiError(
            400,
            "Refund reason must be a string."
        );
    }
};

// Payment ID Validation

const validatePaymentId = (
    paymentId
) => {
    if (!paymentId) {
        throw new ApiError(
            400,
            "Payment ID is required."
        );
    }

    if (
        !mongoose.Types.ObjectId.isValid(
            paymentId
        )
    ) {
        throw new ApiError(
            400,
            "Invalid payment ID."
        );
    }
};

export {
    validateCreatePayment,
    validateUpdatePayment,
    validateRefundPayment,
    validatePaymentId,
};