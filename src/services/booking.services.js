import { Booking } from "../models/booking.models.js";
import { User } from "../models/user.models.js";
import { Trip } from "../models/trip.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Activity } from "../models/activity.models.js";
import { Traveler } from "../models/traveler.models.js";
import { ApiError } from "../utils/ApiError.js";
import { generateBookingReference } from "../utils/generateBookingReference.js";

// Populate Booking

const populateBooking = (query) => {
    return query
        .populate(
            "user",
            "fullName email avatar"
        )
        .populate(
            "trip",
            "tripName slug startDate endDate status travelers"
        )
        .populate(
            "item"
        );
};

// Validate References

const validateReferences = async (
    bookingData
) => {
    // User

    const user =
        await User.findById(
            bookingData.user
        );

    if (!user) {
        throw new ApiError(
            404,
            "User not found."
        );
    }

    // Trip

    const trip =
        await Trip.findById(
            bookingData.trip
        );

    if (!trip) {
        throw new ApiError(
            404,
            "Trip not found."
        );
    }

    // Item

    if (
        !bookingData.item
    ) {
        throw new ApiError(
            400,
            "Booking item is required."
        );
    }

    // Hotel

    if (
        bookingData.itemModel ===
        "Hotel"
    ) {
        const hotel =
            await Hotel.findById(
                bookingData.item
            );

        if (!hotel) {
            throw new ApiError(
                404,
                "Hotel not found."
            );
        }
    }

    // Activity

    if (
        bookingData.itemModel ===
        "Activity"
    ) {
        const activity =
            await Activity.findById(
                bookingData.item
            );

        if (!activity) {
            throw new ApiError(
                404,
                "Activity not found."
            );
        }
    }

    // Flight

    if (
        bookingData.itemModel ===
        "Flight"
    ) {
        // Your current Trip model stores
        // selectedFlight as an embedded object
        // rather than a Flight document.

        if (
            !trip.selectedFlight
        ) {
            throw new ApiError(
                404,
                "Selected flight not found in trip."
            );
        }
    }
};

// Create Passenger Snapshots

const createPassengerSnapshots = async ({
    travelerIds,
    user,
}) => {

    if (
        !travelerIds ||
        travelerIds.length === 0
    ) {
        return [];
    }

    // Remove duplicate IDs

    const uniqueTravelerIds = [
        ...new Set(
            travelerIds.map(
                (id) => String(id)
            )
        ),
    ];

    // Fetch active travelers
    // belonging to current user

    const travelers =
        await Traveler.find({
            _id: {
                $in: uniqueTravelerIds,
            },

            user,

            isActive: true,
        });

    if (
        travelers.length !==
        uniqueTravelerIds.length
    ) {
        throw new ApiError(
            404,
            "One or more travelers were not found."
        );
    }

    return travelers.map(
        (traveler) => ({
            traveler:
                traveler._id,

            firstName:
                traveler.firstName,

            lastName:
                traveler.lastName,

            dateOfBirth:
                traveler.dateOfBirth,

            gender:
                traveler.gender,

            nationality:
                traveler.nationality,

            email:
                traveler.email,

            phone:
                traveler.phone,

            travelerType:
                traveler.travelerType,

            passport:
                traveler.passport
                    ? {
                        passportNumber:
                            traveler.passport
                                .passportNumber,

                        issueDate:
                            traveler.passport
                                .issueDate,

                        expiryDate:
                            traveler.passport
                                .expiryDate,

                        issuingCountry:
                            traveler.passport
                                .issuingCountry,
                    }
                    : null,
        })
    );
};

// Create Booking

const createBooking = async (
    bookingData
) => {
    // Validate references

    await validateReferences(
        bookingData
    );

    // Create traveler snapshots
    // only when travelerIds are supplied

    const passengers =
        await createPassengerSnapshots({
            travelerIds:
                bookingData.travelerIds,
            user:
                bookingData.user,
        });

    // Generate booking reference

    let bookingReference;

    do {
        bookingReference =
            generateBookingReference();

    } while (
        await Booking.exists({
            bookingReference,
        })
    );

    // Remove travelerIds because
    // they are not part of the current
    // Booking schema

    const {
        travelerIds,
        ...bookingFields
    } = bookingData;

    // IMPORTANT:
    //
    // The current Booking model does NOT
    // have "bookingReference" or
    // "passengers".
    //
    // Therefore we do not spread
    // those old fields into Booking.

    const booking =
        await Booking.create({
            ...bookingFields,

            // Convert passenger snapshots
            // into metadata because the current
            // model has travelers/guestDetails,
            // not passengers.

            metadata: {
                ...(bookingFields.metadata || {}),

                passengerSnapshots:
                    passengers,
            },

            status:
                bookingFields.status ||
                "Selected",
        });

    return await populateBooking(
        Booking.findById(
            booking._id
        )
    );
};

// Get All Bookings

const getAllBookings = async ({
    page = 1,
    limit = 10,
    user,
} = {}) => {
    page = Number(page);
    limit = Number(limit);

    const skip =
        (page - 1) * limit;

    const [
        bookings,
        total,
    ] = await Promise.all([

        populateBooking(
            Booking.find({
                user,
            })
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
        ),

        Booking.countDocuments({
            user,
        }),
    ]);

    return {
        bookings,

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

// Get Booking By ID

const getBookingById = async ({
    bookingId,
    user,
}) => {
    const booking =
        await populateBooking(
            Booking.findOne({
                _id: bookingId,
                user,
            })
        );

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found."
        );
    }

    return booking;
};

// Search Bookings

const searchBookings = async (
    keyword,
    user
) => {
    if (!keyword) {
        return [];
    }

    return await populateBooking(
        Booking.find({
            user,

            $or: [
                {
                    provider: {
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

                {
                    status: {
                        $regex: keyword,
                        $options: "i",
                    },
                },

                {
                    externalItemId: {
                        $regex: keyword,
                        $options: "i",
                    },
                },

                {
                    providerBookingId: {
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

// Filter Bookings

const filterBookings = async ({
    user,
    status,
    type,
    provider,
    bookingMode,
} = {}) => {
    const query = {
        user,
    };

    if (status) {
        query.status = status;
    }

    if (type) {
        query.type = type;
    }

    if (provider) {
        query.provider = provider;
    }

    if (bookingMode) {
        query.bookingMode =
            bookingMode;
    }

    return await populateBooking(
        Booking.find(query)
            .sort({
                createdAt: -1,
            })
    );
};

// Update Booking

const updateBooking = async ({
    bookingId,
    bookingData,
    user,
}) => {
    const booking =
        await Booking.findOne({
            _id: bookingId,
            user,
        });

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found."
        );
    }

    // Validate references if changed

    if (
        bookingData.trip ||
        bookingData.item ||
        bookingData.itemModel
    ) {
        await validateReferences({

            user:
                booking.user,

            trip:
                bookingData.trip ||
                booking.trip,

            item:
                bookingData.item ||
                booking.item,

            itemModel:
                bookingData.itemModel ||
                booking.itemModel,
        });
    }

    // Update only supplied fields

    Object.entries(
        bookingData
    ).forEach(
        ([key, value]) => {

            if (
                value !== undefined &&
                value !== null
            ) {
                booking[key] =
                    value;
            }
        }
    );

    await booking.save();

    return await populateBooking(
        Booking.findById(
            booking._id
        )
    );
};

// Initiate External Booking

const initiateExternalBooking = async ({
    bookingId,
    user,
}) => {
    const booking =
        await Booking.findOne({
            _id: bookingId,
            user,
        });

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found."
        );
    }

    if (
        booking.bookingMode !==
        "ExternalRedirect"
    ) {
        throw new ApiError(
            400,
            "This booking does not use external redirect."
        );
    }

    if (
        !booking.bookingUrl
    ) {
        throw new ApiError(
            400,
            "Booking URL is not available."
        );
    }

    if (
        booking.status ===
        "Cancelled"
    ) {
        throw new ApiError(
            400,
            "Cancelled booking cannot be initiated."
        );
    }

    booking.status =
        "BookingInitiated";

    await booking.save();

    booking.status =
        "Redirected";

    booking.redirectedAt =
        new Date();

    await booking.save();

    return await populateBooking(
        Booking.findById(
            booking._id
        )
    );
};

// Confirm Booking

const confirmBooking = async ({
    bookingId,
    user,
    providerBookingId,
}) => {
    const booking =
        await Booking.findOne({
            _id: bookingId,
            user,
        });

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found."
        );
    }

    if (
        booking.status !==
            "Redirected" &&
        booking.status !==
            "BookingInitiated"
    ) {
        throw new ApiError(
            400,
            "Booking cannot be confirmed from its current status."
        );
    }

    booking.status =
        "Confirmed";

    booking.providerBookingId =
        providerBookingId || "";

    booking.confirmedAt =
        new Date();

    await booking.save();

    return await populateBooking(
        Booking.findById(
            booking._id
        )
    );
};

// Cancel Booking

const cancelBooking = async ({
    bookingId,
    user,
}) => {
    const booking =
        await Booking.findOne({
            _id: bookingId,
            user,
        });

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found."
        );
    }

    if (
        booking.status ===
        "Cancelled"
    ) {
        throw new ApiError(
            400,
            "Booking is already cancelled."
        );
    }

    booking.status =
        "Cancelled";

    booking.cancelledAt =
        new Date();

    await booking.save();

    return await populateBooking(
        Booking.findById(
            booking._id
        )
    );
};

// Delete Booking

const deleteBooking = async ({
    bookingId,
    user,
}) => {
    const booking =
        await Booking.findOne({
            _id: bookingId,
            user,
        });

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found."
        );
    }

    // Soft delete using metadata
    // because current schema does not
    // have an isActive field.

    booking.metadata = {
        ...(booking.metadata || {}),
        isDeleted: true,
        deletedAt:
            new Date(),
    };

    await booking.save();
};

// Export Booking Service

export const bookingService = {
    createBooking,
    getAllBookings,
    getBookingById,
    searchBookings,
    filterBookings,
    updateBooking,
    initiateExternalBooking,
    confirmBooking,
    cancelBooking,
    deleteBooking,
};