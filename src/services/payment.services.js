import { Payment } from "../models/payment.models.js";
import { User } from "../models/user.models.js";
import { Booking } from "../models/booking.models.js";
import { ApiError } from "../utils/ApiError.js";
import { generatePaymentReference } from "../utils/generatePaymentReference.js";

// Populate Payment

const populatePayment = (query) => {
    return query
        .populate(
            "user",
            "fullName email avatar"
        )
        .populate(
            "booking",
            "bookingReference bookingType checkInDate checkOutDate guests totalAmount currency paymentStatus bookingStatus"
        );
};

// Validate References

const validateReferences = async (
    paymentData
) => {
    // User

    const user =
        await User.findById(
            paymentData.user
        );

    if (!user) {
        throw new ApiError(
            404,
            "User not found."
        );
    }

    // Booking

    const booking =
        await Booking.findOne({
            _id: paymentData.booking,
            user: paymentData.user,
            isActive: true,
        });

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found."
        );
    }

    return {
        user,
        booking,
    };
};

// Create Payment

const createPayment = async (
    paymentData
) => {
    // Validate References

    const {
        booking,
    } = await validateReferences(
        paymentData
    );

    // Validate Payment Amount

    if (
        paymentData.amount !==
        booking.totalAmount
    ) {
        throw new ApiError(
            400,
            "Payment amount must match booking total amount."
        );
    }

    // Validate Currency

    if (
        paymentData.currency &&
        paymentData.currency !==
            booking.currency
    ) {
        throw new ApiError(
            400,
            "Payment currency must match booking currency."
        );
    }

    // Prevent Duplicate Active Payment

    const existingPayment =
        await Payment.findOne({
            booking: paymentData.booking,
            user: paymentData.user,
            isActive: true,
            paymentStatus: {
                $in: [
                    "Pending",
                    "Processing",
                    "Paid",
                ],
            },
        });

    if (existingPayment) {
        throw new ApiError(
            400,
            "An active payment already exists for this booking."
        );
    }

    // Generate Unique Payment Reference

    let paymentReference;

    do {
        paymentReference =
            generatePaymentReference();
    } while (
        await Payment.exists({
            paymentReference,
        })
    );

    // Create Payment

    const payment =
        await Payment.create({
            ...paymentData,
            paymentReference,
        });

    // Return Populated Payment

    return await populatePayment(
        Payment.findById(
            payment._id
        )
    );
};

// Get All Payments

const getAllPayments = async ({
    page = 1,
    limit = 10,
    user,
} = {}) => {
    page = Number(page);
    limit = Number(limit);

    const skip =
        (page - 1) * limit;

    const [
        payments,
        total,
    ] = await Promise.all([
        populatePayment(
            Payment.find({
                user,
                isActive: true,
            })
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
        ),

        Payment.countDocuments({
            user,
            isActive: true,
        }),
    ]);

    return {
        payments,
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

// Get Payment By ID

const getPaymentById = async ({
    paymentId,
    user,
}) => {
    const payment =
        await populatePayment(
            Payment.findOne({
                _id: paymentId,
                user,
                isActive: true,
            })
        );

    if (!payment) {
        throw new ApiError(
            404,
            "Payment not found."
        );
    }

    return payment;
};

// Search Payments

const searchPayments = async (
    keyword,
    user
) => {
    if (!keyword) {
        return [];
    }

    return await populatePayment(
        Payment.find({
            user,
            isActive: true,
            $or: [
                {
                    paymentReference: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    transactionId: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    paymentMethod: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    paymentGateway: {
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

// Filter Payments

const filterPayments = async ({
    user,
    paymentStatus,
    paymentMethod,
    paymentGateway,
} = {}) => {
    const query = {
        user,
        isActive: true,
    };

    if (paymentStatus) {
        query.paymentStatus =
            paymentStatus;
    }

    if (paymentMethod) {
        query.paymentMethod =
            paymentMethod;
    }

    if (paymentGateway) {
        query.paymentGateway =
            paymentGateway;
    }

    return await populatePayment(
        Payment.find(query)
            .sort({
                createdAt: -1,
            })
    );
};

// Update Payment

const updatePayment = async ({
    paymentId,
    paymentData,
    user,
}) => {
    const payment =
        await Payment.findOne({
            _id: paymentId,
            user,
            isActive: true,
        });

    if (!payment) {
        throw new ApiError(
            404,
            "Payment not found."
        );
    }

    // Do not allow changing ownership

    delete paymentData.user;

    // Do not allow changing payment reference

    delete paymentData.paymentReference;

    // Update Fields

    Object.entries(
        paymentData
    ).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null
        ) {
            payment[key] = value;
        }
    });

    await payment.save();

    return await populatePayment(
        Payment.findById(
            payment._id
        )
    );
};

// Mark Payment As Paid

const markPaymentAsPaid = async ({
    paymentId,
    transactionId,
    user,
}) => {
    const payment =
        await Payment.findOne({
            _id: paymentId,
            user,
            isActive: true,
        });

    if (!payment) {
        throw new ApiError(
            404,
            "Payment not found."
        );
    }

    if (
        payment.paymentStatus ===
        "Refunded"
    ) {
        throw new ApiError(
            400,
            "Refunded payment cannot be marked as paid."
        );
    }

    payment.paymentStatus =
        "Paid";

    payment.transactionId =
        transactionId ||
        payment.transactionId;

    payment.paidAt =
        new Date();

    await payment.save();

    // Update Booking Payment Status

    await Booking.findByIdAndUpdate(
        payment.booking,
        {
            paymentStatus: "Paid",
            bookingStatus: "Confirmed",
        }
    );

    return await populatePayment(
        Payment.findById(
            payment._id
        )
    );
};

// Mark Payment As Failed

const markPaymentAsFailed = async ({
    paymentId,
    failureReason,
    user,
}) => {
    const payment =
        await Payment.findOne({
            _id: paymentId,
            user,
            isActive: true,
        });

    if (!payment) {
        throw new ApiError(
            404,
            "Payment not found."
        );
    }

    payment.paymentStatus = "Failed";

    payment.failureReason =
        failureReason || "";

    payment.paidAt = null;

    await payment.save();

    // Update Booking Payment Status

    await Booking.findByIdAndUpdate(
        payment.booking,
        {
            paymentStatus: "Failed",
        }
    );

    return await populatePayment(
        Payment.findById(
            payment._id
        )
    );
};

// Refund Payment

const refundPayment = async ({
    paymentId,
    refundAmount,
    refundReason,
    user,
}) => {
    const payment =
        await Payment.findOne({
            _id: paymentId,
            user,
            isActive: true,
        });

    if (!payment) {
        throw new ApiError(
            404,
            "Payment not found."
        );
    }

    if (
        payment.paymentStatus !==
        "Paid"
    ) {
        throw new ApiError(
            400,
            "Only paid payments can be refunded."
        );
    }

    if (
        refundAmount >
        payment.amount
    ) {
        throw new ApiError(
            400,
            "Refund amount cannot exceed payment amount."
        );
    }

    payment.refundAmount =
        refundAmount;

    payment.refundReason =
        refundReason || "";

    payment.refundedAt =
        new Date();

    if (
        refundAmount ===
        payment.amount
    ) {
        payment.paymentStatus =
            "Refunded";
    } else {
        payment.paymentStatus =
            "Partially Refunded";
    }

    await payment.save();

    // Update Booking Payment Status

    await Booking.findByIdAndUpdate(
        payment.booking,
        {
            paymentStatus:
                payment.paymentStatus ===
                "Refunded"
                    ? "Refunded"
                    : "Paid",
        }
    );

    return await populatePayment(
        Payment.findById(
            payment._id
        )
    );
};

// Delete Payment

const deletePayment = async ({
    paymentId,
    user,
}) => {
    const payment =
        await Payment.findOne({
            _id: paymentId,
            user,
            isActive: true,
        });

    if (!payment) {
        throw new ApiError(
            404,
            "Payment not found."
        );
    }

    payment.isActive = false;

    await payment.save();
};

export const paymentService = {
    createPayment,
    getAllPayments,
    getPaymentById,
    searchPayments,
    filterPayments,
    updatePayment,
    markPaymentAsPaid,
    markPaymentAsFailed,
    refundPayment,
    deletePayment,
};