import { Trip } from "../models/trip.models.js";
import { User } from "../models/user.models.js";
import { Destination } from "../models/destination.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Restaurant } from "../models/restaurant.models.js";
import { Activity } from "../models/activity.models.js";
import { ApiError } from "../utils/ApiError.js";
import { generateSlug } from "../utils/generateSlug.js";

// Helper Functions

const populateTrip = (query) => {
    return query
        .populate(
            "user",
            "fullName username email avatar"
        )
        .populate(
            "destination",
            "name city state country slug"
        )
        .populate(
            "hotel",
            "name starRating pricePerNight coverImage"
        )
        .populate(
            "restaurants",
            "name averageCostForTwo coverImage"
        )
        .populate(
            "activities",
            "name category price coverImage"
        );
};

const validateReferences = async (
    tripData
) => {
    // User     

    const user =
        await User.findById(
            tripData.user
        );

    if (!user) {
        throw new ApiError(
            404,
            "User not found."
        );
    }

    // Destination

    const destination =
        await Destination.findById(
            tripData.destination
        );

    if (!destination) {
        throw new ApiError(
            404,
            "Destination not found."
        );
    }

    // Hotel

    if (tripData.hotel) {
        const hotel =
            await Hotel.findById(
                tripData.hotel
            );

        if (!hotel) {
            throw new ApiError(
                404,
                "Hotel not found."
            );
        }
    }

    // Restaurants

    if (
        Array.isArray(
            tripData.restaurants
        )
    ) {
        const count =
            await Restaurant.countDocuments({
                _id: {
                    $in: tripData.restaurants,
                },
        });

        if (
            count !==
            tripData.restaurants.length
        ) {
            throw new ApiError(
                404,
                "One or more restaurants not found."
            );
        }
    }

    // Activities

    if (
        Array.isArray(
            tripData.activities
        )
    ) {
        const count =
            await Activity.countDocuments({
                _id: {
                    $in: tripData.activities,
                },
        });

        if (
            count !==
            tripData.activities.length
        ) {
            throw new ApiError(
                404,
                "One or more activities not found."
            );
        }
    }
};

// Create Trip

const createTrip = async (
    tripData
) => {
    // Validate References

    await validateReferences(
        tripData
    );

    // Generate Slug

    const destination =
        await Destination.findById(
            tripData.destination
        );

    const slug = generateSlug(
        tripData.tripName,
        destination.city,
        destination.country
    );

    // Create Trip

    const trip =
        await Trip.create({
            ...tripData,
            slug,
        });

    // Return Populated Trip

    return await populateTrip(
        Trip.findById(
            trip._id
        )
    );
};

// Get All Trips

const getAllTrips = async ({
    page = 1,
    limit = 10,
    user,
} = {}) => {

    page = Number(page);
    limit = Number(limit);
    
    const skip = (page - 1) * limit;
    const [
        trips,
        total,
    ] = await Promise.all([
        populateTrip(
            Trip.find({
                user,
                isActive: true,
            })
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
        ),

        Trip.countDocuments({
            user,
            isActive: true,
        }),
    ]);

    return {
        trips,
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

// Get Trip By ID

const getTripById = async (
    tripId
) => {
    const trip =
        await populateTrip(
            Trip.findById(
                tripId
            )
        );

    if (!trip) {
        throw new ApiError(
            404,
            "Trip not found."
        );
    }

    return trip;
};

// Search Trips

const searchTrips = async (
    keyword,
    user
) => {
    if (!keyword) {
        return [];
    }

    return await populateTrip(
        Trip.find({
            user,
            isActive: true,
            $or: [
                {
                    tripName: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    description: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    aiSummary: {
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

// Filter Trips

const filterTrips = async ({
    user,
    destination,
    hotel,
    status,
    budgetType,
    isAIGenerated,
    isPublic,
} = {}) => {
    const query = {
        user,
        isActive: true,
    };

    if (destination) {
        query.destination =
            destination;
    }

    if (hotel) {
        query.hotel = hotel;
    }

    if (status) {
        query.status = status;
    }

    if (budgetType) {
        query["budget.budgetType"] =
            budgetType;
    }

    if (
        isAIGenerated !==
        undefined
    ) {
        query.isAIGenerated =
            isAIGenerated;
    }

    if (
        isPublic !==
        undefined
    ) {
        query.isPublic =
            isPublic;
    }

    return await populateTrip(
        Trip.find(query)
            .sort({
                createdAt: -1,
            })
    );
};

// Update Trip

const updateTrip = async ({
    tripId,
    tripData,
}) => {
    const trip = await Trip.findOne({
        _id: tripId,
        isActive: true,
    });

    if (!trip) {
        throw new ApiError(
            404,
            "Trip not found."
        );
    }

    // Validate References

    await validateReferences({
        user:
            trip.user,

        destination:
            tripData.destination ||
            trip.destination,

        hotel:
            tripData.hotel ||
            trip.hotel,

        restaurants:
            tripData.restaurants ||
            trip.restaurants,

        activities:
            tripData.activities ||
            trip.activities,
    });

    // Update Fields

    Object.entries(
        tripData
    ).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null
        ) {
            trip[key] = value;
        }
    });

    // Regenerate Slug

    if (
        tripData.tripName ||
        tripData.destination
    ) {
        const destination =
            await Destination.findById(
                trip.destination
            );

        trip.slug =
            generateSlug(
                trip.tripName,
                destination.city,
                destination.country
            );
    }

    await trip.save();

    return await populateTrip(
        Trip.findById(
            trip._id
        )
    );
};

// Delete Trip

const deleteTrip = async (
    tripId
) => {
    const trip = await Trip.findOne({
        _id: tripId,
        isActive: true,
    });

    if (!trip) {
        throw new ApiError(
            404,
            "Trip not found."
        );
    }

    trip.isActive = false;

    await trip.save();
};

export const tripService = {
    createTrip,
    getAllTrips,
    getTripById,
    searchTrips,
    filterTrips,
    updateTrip,
    deleteTrip,
};