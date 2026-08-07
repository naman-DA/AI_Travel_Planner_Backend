import mongoose from "mongoose";
import slugify from "slugify";
import { Activity } from "../models/activity.models.js";
import { Destination } from "../models/destination.models.js";
import { ApiError } from "../utils/ApiError.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";

// Helper Functions

// Generate Activity Slug

const generateSlug = (
    name,
    city,
    country
) => {
    return slugify(
        `${name}-${city}-${country}`,
        {
            lower: true,
            strict: true,
        }
    );
};

// Upload Gallery Images

const uploadGalleryImages = async (
    galleryImages
) => {
    const uploadedImages = [];

    for (const image of galleryImages) {
        const uploaded =
            await uploadOnCloudinary(
                image.path,
                "ai-travel-planner/activities"
            );

        if (!uploaded) {
            throw new ApiError(
                500,
                "Failed to upload gallery image."
            );
        }

        uploadedImages.push({
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            caption: "",
        });
    }

    return uploadedImages;
};

// Delete Gallery Images

const deleteGalleryImages = async (
    galleryImages
) => {
    if (
        !galleryImages ||
        galleryImages.length === 0
    ) {
        return;
    }

    for (const image of galleryImages) {
        if (image.publicId) {
            await deleteFromCloudinary(
                image.publicId
            );
        }
    }
};

// Create Activity

const createActivity = async ({
    activityData,
    coverImage,
    galleryImages = [],
}) => {
    // Verify Destination

    const destination =
        await Destination.findById(
            activityData.destination
        );

    if (!destination) {
        throw new ApiError(
            404,
            "Destination not found."
        );
    }

    // Generate Slug

    const slug = generateSlug(
        activityData.name,
        activityData.city,
        activityData.country
    );

    let uploadedCoverImage = null;
    let uploadedGalleryImages = [];

    try {
        // Upload Cover Image
      
        if (coverImage) {
            const response =
                await uploadOnCloudinary(
                    coverImage.path,
                    "ai-travel-planner/activities/cover"
                );

            if (!response) {
                throw new ApiError(
                    500,
                    "Failed to upload cover image."
                );
            }

            uploadedCoverImage = {
                url: response.secure_url,
                publicId: response.public_id,
                caption: activityData.name,
            };
        }

        // Upload Gallery Images
        
        if (galleryImages.length > 0) {
            uploadedGalleryImages =
                await uploadGalleryImages(
                    galleryImages
                );
        }
        // Create Activity
        
        const activity =
            await Activity.create({
                ...activityData,
                slug,
                coverImage:
                    uploadedCoverImage,
                galleryImages:
                    uploadedGalleryImages,
            });

        return activity;
    }

    catch (error) {
        if (
            uploadedCoverImage?.publicId
        ) {
            await deleteFromCloudinary(
                uploadedCoverImage.publicId
            );
        }

        await deleteGalleryImages(
            uploadedGalleryImages
        );

        throw error;
    }
};

// Get All Activities

const getAllActivities = async ({
    page = 1,
    limit = 10,
    search = "",
    destination,
    city,
    country,
    category,
    difficulty,
    minRating,
    minPrice,
    maxPrice,
    isFeatured,
    sort = "newest",
}) => {
    page = Number(page);
    limit = Number(limit);

    const query = {
        isActive: true,
    };

    // Search
    
    if (search) {
        query.$or = [
            {
                name: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                city: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                country: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                description: {
                    $regex: search,
                    $options: "i",
                },
            },
        ];
    }

    // Filters
    
    if (destination) {
        query.destination = destination;
    }

    if (city) {
        query.city = city;
    }

    if (country) {
        query.country = country;
    }

    if (category) {
        query.category = category;
    }

    if (difficulty) {
        query.difficulty = difficulty;
    }

    if (minRating) {
        query.averageRating = {
            $gte: Number(minRating),
        };
    }

    if (minPrice || maxPrice) {
        query.price = {};

        if (minPrice) {
            query.price.$gte =
                Number(minPrice);
        }

        if (maxPrice) {
            query.price.$lte =
                Number(maxPrice);
        }
    }

    if (isFeatured !== undefined) {
        query.isFeatured =
            isFeatured === "true";
    }

    // Sorting
    
    let sortOption = {
        createdAt: -1,
    };

    switch (sort) {
        case "priceLow":
            sortOption = {
                price: 1,
            };

            break;

        case "priceHigh":
            sortOption = {
                price: -1,
            };

            break;

        case "rating":
            sortOption = {
                averageRating: -1,
            };

            break;

        case "popularity":
            sortOption = {
                popularityScore: -1,
            };

            break;

        case "alphabetical":
            sortOption = {
                name: 1,
            };

            break;

        case "oldest":
            sortOption = {
                createdAt: 1,
            };

            break;

        default:
            sortOption = {
                createdAt: -1,
            };
    }

    const skip =
        (page - 1) * limit;

    const [activities, total] =
        await Promise.all([
            Activity.find(query)
                .select("-__v")
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate(
                    "destination",
                    "name city state country slug"
                )
                .lean(),

            Activity.countDocuments(query),
        ]);

    return {
        activities,
        pagination: {
            page,
            limit,
            total,
            totalPages:
                Math.ceil(total / limit),
        },
    };
};

// Get Activity By ID

const getActivityById = async (
    activityId
) => {
    if (
        !mongoose.Types.ObjectId.isValid(
            activityId
        )
    ) {
        throw new ApiError(
            400,
            "Invalid activity ID."
        );
    }

    const activity =
        await Activity.findById(
            activityId
        )
            .select("-__v")
            .populate(
                "destination",
                "name city state country slug"
            )
            .lean();

    if (!activity) {
        throw new ApiError(
            404,
            "Activity not found."
        );
    }

    return activity;
};

// Search Activities

const searchActivities = async (
    keyword
) => {
    if (!keyword) {
        return [];
    }

    return await Activity.find({
        isActive: true,
        $or: [
            {
                name: {
                    $regex: keyword,
                    $options: "i",
                },
            },
            {
                city: {
                    $regex: keyword,
                    $options: "i",
                },
            },
            {
                country: {
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
                category: {
                    $regex: keyword,
                    $options: "i",
                },
            },
            {
                included: {
                    $in: [
                        new RegExp(
                            keyword,
                            "i"
                        ),
                    ],
                },
            },
        ],
    })
        .select("-__v")
        .populate(
            "destination",
            "name city state country slug"
        )
        .sort({
            popularityScore: -1,
        })
        .limit(20)
        .lean();
};

// Filter Activities

const filterActivities = async ({
    destination,
    city,
    country,
    category,
    difficulty,
    minPrice,
    maxPrice,
    minRating,
}) => {
    const query = {
        isActive: true,
    };

    if (destination) {
        query.destination = destination;
    }

    if (city) {
        query.city = city;
    }

    if (country) {
        query.country = country;
    }

    if (category) {
        query.category = category;
    }

    if (difficulty) {
        query.difficulty = difficulty;
    }

    if (minPrice || maxPrice) {
        query.price = {};

        if (minPrice) {
            query.price.$gte =
                Number(minPrice);
        }

        if (maxPrice) {
            query.price.$lte =
                Number(maxPrice);
        }
    }

    if (minRating) {
        query.averageRating = {
            $gte: Number(minRating),
        };
    }

    return await Activity.find(query)
        .select("-__v")
        .populate(
            "destination",
            "name city state country slug"
        )
        .sort({
            popularityScore: -1,
        })
        .lean();
};

// Update Activity

const updateActivity = async ({
    activityId,
    activityData,
    coverImage,
    galleryImages = [],
}) => {
    if (
        !mongoose.Types.ObjectId.isValid(
            activityId
        )
    ) {
        throw new ApiError(
            400,
            "Invalid activity ID."
        );
    }

    const activity =
        await Activity.findById(
            activityId
        );

    if (!activity) {
        throw new ApiError(
            404,
            "Activity not found."
        );
    }

    // Verify Destination (if changed)

    if (activityData.destination) {
        const destination =
            await Destination.findById(
                activityData.destination
            );

        if (!destination) {
            throw new ApiError(
                404,
                "Destination not found."
            );
        }

    }

    const oldCoverImage =
        activity.coverImage;

    const oldGalleryImages =
        activity.galleryImages;

    let uploadedCoverImage = null;
    let uploadedGalleryImages = [];

    try {
        // Upload Cover

        if (coverImage) {
            const response =
                await uploadOnCloudinary(
                    coverImage.path,
                    "ai-travel-planner/activities/cover"
                );

            if (!response) {
                throw new ApiError(
                    500,
                    "Failed to upload cover image."
                );
            }

            uploadedCoverImage = {
                url: response.secure_url,
                publicId: response.public_id,
                caption:
                    activityData.name ||
                    activity.name,
            };

            activity.coverImage =
                uploadedCoverImage;
        }

        // Upload Gallery

        if (galleryImages.length > 0) {
            uploadedGalleryImages =
                await uploadGalleryImages(
                    galleryImages
                );

            activity.galleryImages =
                uploadedGalleryImages;
        }

        // Update Fields

        Object.entries(activityData)
            .forEach(([key, value]) => {
                if (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                ) {
                    activity[key] = value;
                }
            });
        // Regenerate Slug

        if (
            activityData.name ||
            activityData.city ||
            activityData.country
        ) {
            activity.slug =
                generateSlug(
                    activityData.name ||
                        activity.name,

                    activityData.city ||
                        activity.city,

                    activityData.country ||
                        activity.country
                );
        }

        await activity.save();

        // Delete Old Cover

        if (
            coverImage &&
            oldCoverImage?.publicId
        ) {
            await deleteFromCloudinary(
                oldCoverImage.publicId
            );
        }

        // Delete Old Gallery

        if (
            galleryImages.length > 0
        ) {
            await deleteGalleryImages(
                oldGalleryImages
            );
        }

        return activity;
    }

    catch (error) {
        if (
            uploadedCoverImage?.publicId
        ) {
            await deleteFromCloudinary(
                uploadedCoverImage.publicId
            );
        }

        await deleteGalleryImages(
            uploadedGalleryImages
        );

        throw error;
    }
};

// Delete Activity

const deleteActivity = async (
    activityId
) => {
    if (
        !mongoose.Types.ObjectId.isValid(
            activityId
        )
    ) {
        throw new ApiError(
            400,
            "Invalid activity ID."
        );
    }

    const activity =
        await Activity.findById(
            activityId
        );

    if (!activity) {
        throw new ApiError(
            404,
            "Activity not found."
        );
    }

    if (
        activity.coverImage?.publicId
    ) {
        await deleteFromCloudinary(
            activity.coverImage.publicId
        );
    }

    await deleteGalleryImages(
        activity.galleryImages
    );

    await activity.deleteOne();

    return true;
};

export const activityService = {
    createActivity,
    getAllActivities,
    getActivityById,
    searchActivities,
    filterActivities,
    updateActivity,
    deleteActivity,
};