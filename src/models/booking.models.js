import mongoose, { Schema } from "mongoose";

// Guest / Customer Details

const guestDetailsSchema = new Schema(
    {
        firstName: {
            type: String,
            trim: true,
            default: "",
        },

        lastName: {
            type: String,
            trim: true,
            default: "",
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },

        phone: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        _id: false,
    }
);

// Booking Schema

const bookingSchema = new Schema(
    {
        // User who initiated the booking

        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Trip associated with the booking

        trip: {
            type: Schema.Types.ObjectId,
            ref: "Trip",
            required: true,
            index: true,
        },

        // Type of item being booked

        type: {
            type: String,
            enum: [
                "Flight",
                "Hotel",
                "Activity",
            ],
            required: true,
            index: true,
        },

        // Our internal item reference

        item: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "itemModel",
        },

        // Model associated with the item reference

        itemModel: {
            type: String,
            enum: [
                "Flight",
                "Hotel",
                "Activity",
            ],
            required: true,
        },

        // External booking provider

        provider: {
            type: String,
            required: true,
            trim: true,
        },

        // ID used by the external provider

        externalItemId: {
            type: String,
            default: "",
            trim: true,
        },

        // Actual booking reference received
        // from the external provider, if available

        providerBookingId: {
            type: String,
            default: "",
            trim: true,
        },

        // External booking URL

        bookingUrl: {
            type: String,
            default: "",
            trim: true,
        },

        // How the booking is completed

        bookingMode: {
            type: String,
            enum: [
                "ExternalRedirect",
                "DirectAPI",
            ],
            default: "ExternalRedirect",
        },

        // Booking lifecycle

        status: {
            type: String,
            enum: [
                "Selected",
                "BookingInitiated",
                "Redirected",
                "Confirmed",
                "Cancelled",
                "Failed",
            ],
            default: "Selected",
            index: true,
        },

        // Customer / guest information

        guestDetails: {
            type: guestDetailsSchema,
            default: () => ({}),
        },

        // Number of travelers / guests

        travelers: {
            adults: {
                type: Number,
                default: 1,
                min: 1,
            },

            children: {
                type: Number,
                default: 0,
                min: 0,
            },

            infants: {
                type: Number,
                default: 0,
                min: 0,
            },
        },

        // Booking amount

        amount: {
            type: Number,
            default: 0,
            min: 0,
        },

        currency: {
            type: String,
            default: "INR",
            uppercase: true,
            trim: true,
        },

        // Travel / reservation dates

        startDate: {
            type: Date,
            default: null,
        },

        endDate: {
            type: Date,
            default: null,
        },

        // Used for tracking external redirect

        redirectedAt: {
            type: Date,
            default: null,
        },

        // Provider confirmation timestamp

        confirmedAt: {
            type: Date,
            default: null,
        },

        // Cancellation timestamp

        cancelledAt: {
            type: Date,
            default: null,
        },

        // Additional provider-specific information

        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Indexes

bookingSchema.index({
    user: 1,
    createdAt: -1,
});

bookingSchema.index({
    trip: 1,
    createdAt: -1,
});

bookingSchema.index({
    type: 1,
    status: 1,
});

bookingSchema.index({
    provider: 1,
    externalItemId: 1,
});

bookingSchema.index({
    provider: 1,
    providerBookingId: 1,
});

// Virtual

bookingSchema.virtual(
    "totalTravelers"
).get(function () {
    if (!this.travelers) {
        return 0;
    }

    return (
        (this.travelers.adults || 0) +
        (this.travelers.children || 0) +
        (this.travelers.infants || 0)
    );
});

// JSON Configuration

bookingSchema.set(
    "toJSON",
    {
        virtuals: true,
        versionKey: false,
    }
);

bookingSchema.set(
    "toObject",
    {
        virtuals: true,
        versionKey: false,
    }
);

export const Booking = mongoose.model(
    "Booking",
    bookingSchema
);