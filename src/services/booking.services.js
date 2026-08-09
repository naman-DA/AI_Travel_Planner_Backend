import { Booking } from "../models/booking.models.js";
import { User } from "../models/user.models.js";
import { Trip } from "../models/trip.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Activity } from "../models/activity.models.js";
import { ApiError } from "../utils/ApiError.js";
import { generateBookingReference } from "../utils/generateBookingReference.js";

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
            "hotel",
            "name starRating pricePerNight coverImage"
        )
        .populate(
            "activities",
            "name category price coverImage"
        );
};

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

    // Hotel

    if (bookingData.hotel) {
        const hotel =
            await Hotel.findById(
                bookingData.hotel
            );

        if (!hotel) {
            throw new ApiError(
                404,
                "Hotel not found."
            );
        }
    }

    // Activities

    if (
        Array.isArray(
            bookingData.activities
        )
    ) {
        const count =
            await Activity.countDocuments({
                _id: {
                    $in: bookingData.activities,
                },
            });

        if (
            count !==
            bookingData.activities.length
        ) {
            throw new ApiError(
                404,
                "One or more activities not found."
            );
        }
    }
};

const createBooking = async (
    bookingData
) => {
    // Validate References

    await validateReferences(
        bookingData
    );

    // Generate Unique Booking Reference

    let bookingReference;
    do {
        bookingReference = generateBookingReference();
    } 
    while (
        await Booking.exists({
            bookingReference,
        })
    );

    // Create Booking

    const booking = await Booking.create({
        ...bookingData,
        bookingReference,
    });

    const populatedBooking = await populateBooking(
        Booking.findById(booking._id)
    );

    console.log("Booking Guests:", populatedBooking.guests);
    console.log("Booking:", populatedBooking);

    return populatedBooking;
};

// Get All Bookings

const getAllBookings = async ({
    page = 1,
    limit = 10,
    user,
} = {}) => {
    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const [
        bookings,
        total,
    ] = await Promise.all([
        populateBooking(
            Booking.find({
                user,
                isActive: true,
            })
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
        ),

        Booking.countDocuments({
            user,
            isActive: true,
        }),
    ]);

    return {
        bookings,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(
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
                isActive: true,
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
            isActive: true,
            $or: [
                {
                    bookingReference: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    bookingType: {
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
    bookingStatus,
    paymentStatus,
    bookingType,
    isCancelled,
} = {}) => {
    const query = {
        user,
        isActive: true,
    };

    if (bookingStatus) {
        query.bookingStatus =
            bookingStatus;
    }

    if (paymentStatus) {
        query.paymentStatus =
            paymentStatus;
    }

    if (bookingType) {
        query.bookingType =
            bookingType;
    }

    if (
        isCancelled !==
        undefined
    ) {
        query.isCancelled =
            isCancelled;
    }

    return await populateBooking(
        Booking.find(query).sort({
            createdAt: -1,
        })
    );
};

// Update Booking

const updateBooking = async ({
    bookingId,
    bookingData,
    user
}) => {
    const booking =
        await Booking.findOne({
            _id: bookingId,
            user,
            isActive: true,
        });

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found."
        );
    }

    // Validate References

    if (
        bookingData.trip ||
        bookingData.hotel ||
        bookingData.activities
    ) {
        await validateReferences({
            user: booking.user,
            trip: bookingData.trip || booking.trip,
            hotel: bookingData.hotel || booking.hotel,
            activities: bookingData.activities || booking.activities,
        });
    }

    // Update Fields

    Object.entries(
        bookingData
    ).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null
        ) {
            booking[key] = value;
        }

    });

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
    cancellationReason
}) => {
    const booking =
        await Booking.findOne({
            _id: bookingId,
            user,
            isActive: true,
        });

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found."
        );
    }

    booking.bookingStatus =
        "Cancelled";

    booking.isCancelled = true;

    booking.cancellationReason =
        cancellationReason;

    booking.cancellationDate =
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
    user
}) => {
    const booking =
        await Booking.findOne({
            _id: bookingId,
            user,
            isActive: true,
        });

    if (!booking) {
        throw new ApiError(
            404,
            "Booking not found."
        );
    }

    booking.isActive = false;

    await booking.save();
};

export const bookingService = {
    createBooking,
    getAllBookings,
    getBookingById,
    searchBookings,
    filterBookings,
    updateBooking,
    cancelBooking,
    deleteBooking,
};