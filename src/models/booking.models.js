import mongoose, { Schema } from "mongoose";

const bookingSchema = new Schema(
    {
        bookingReference: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },

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

        hotel: {
            type: Schema.Types.ObjectId,
            ref: "Hotel",
            default: null,
        },

        activities: [
            {
                type: Schema.Types.ObjectId,
                ref: "Activity",
            },
        ],

        bookingType: {
            type: String,
            enum: [
                "Trip",
                "Hotel",
                "Activity",
            ],
            default: "Trip",
        },

        checkInDate: {
            type: Date,
            required: true,
        },

        checkOutDate: {
            type: Date,
            required: true,
        },

        guests: {
            type: new Schema(
                {
                    adults: {
                        type: Number,
                        default: 1,
                        min: 1,
                        required: true,
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
                {
                    _id: false,
                }
            ),
            required: true,
        },

        passengers: [
            {
                traveler: {
                    type: Schema.Types.ObjectId,
                    ref: "Traveler",
                    required: true,
                },

                firstName: {
                    type: String,
                    required: true,
                    trim: true,
                },

                lastName: {
                    type: String,
                    required: true,
                    trim: true,
                },

                dateOfBirth: {
                    type: Date,
                    required: true,
                },

                gender: {
                    type: String,
                    enum: [
                        "Male",
                        "Female",
                        "Other",
                    ],
                    required: true,
                },

                nationality: {
                    type: String,
                    required: true,
                    trim: true,
                    uppercase: true,
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

                travelerType: {
                    type: String,
                    enum: [
                        "Adult",
                        "Child",
                        "Infant",
                    ],
                    required: true,
                },

                passport: {
                    type: new Schema(
                        {
                            passportNumber: {
                                type: String,
                                trim: true,
                                uppercase: true,
                                default: "",
                            },

                            issueDate: {
                                type: Date,
                                default: null,
                            },

                            expiryDate: {
                                type: Date,
                                default: null,
                            },

                            issuingCountry: {
                                type: String,
                                trim: true,
                                uppercase: true,
                                default: "",
                            },
                        },
                        {
                            _id: false,
                        }
                    ),
                    default: null,
                },
            },
        ],

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
            default: "INR",
            trim: true,
            uppercase: true,
        },

        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Paid",
                "Refunded",
                "Failed",
            ],
            default: "Pending",
        },

        bookingStatus: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Completed",
                "Cancelled",
            ],
            default: "Pending",
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
            default: "Card",
        },

        specialRequests: {
            type: String,
            trim: true,
            default: "",
        },

        cancellationReason: {
            type: String,
            trim: true,
            default: "",
        },

        cancellationDate: {
            type: Date,
            default: null,
        },

        cancellationPolicy: {
            type: new Schema(
                {
                    type: {
                        type: String,
                        enum: [
                            "FreeCancellation",
                            "PartialRefund",
                            "NonRefundable",
                        ],
                        required: true,
                    },

                    freeCancellationUntil: {
                        type: Date,
                        default: null,
                    },

                    rules: [
                        {
                            beforeHours: {
                                type: Number,
                                required: true,
                                min: 0,
                            },

                            refundPercentage: {
                                type: Number,
                                required: true,
                                min: 0,
                                max: 100,
                            },
                        },
                    ],
                },
                {
                    _id: false,
                }
            ),

            default: null,
        },

        isCancelled: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
    }
);

bookingSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
});

bookingSchema.set("toObject", {
    virtuals: true,
    versionKey: false,
});

bookingSchema.virtual("totalGuests").get(function () {
    console.log("Guests:", this.guests);

    if (!this.guests) {
        return 0;
    }

    return (
        (this.guests.adults || 0) +
        (this.guests.children || 0) +
        (this.guests.infants || 0)
    );
});

export const Booking = mongoose.model("Booking", bookingSchema);