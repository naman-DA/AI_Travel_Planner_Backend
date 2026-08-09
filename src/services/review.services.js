import { Review } from "../models/review.models.js";
import { User } from "../models/user.models.js";
import { Trip } from "../models/trip.models.js";
import { Hotel } from "../models/hotel.models.js";
import { Activity } from "../models/activity.models.js";
import { Restaurant } from "../models/restaurant.models.js";
import { ApiError } from "../utils/ApiError.js";

// Populate Review

const populateReview = (query) => {
    return query
        .populate(
            "user",
            "fullName email avatar"
        );
};

// Validate User

const validateUser = async (
    userId
) => {
    const user =
        await User.findById(
            userId
        );

    if (!user) {
        throw new ApiError(
            404,
            "User not found."
        );
    }

    return user;
};

// Validate Review Reference

const validateReference = async ({
    reviewType,
    referenceId,
    user,
}) => {
    let document;

    switch (reviewType) {
        case "Trip":
            document =
                await Trip.findOne({
                    _id: referenceId,
                    user,
                    isActive: true,
                });
            break;

        case "Hotel":
            document =
                await Hotel.findOne({
                    _id: referenceId,
                    isActive: true,
                });
            break;

        case "Activity":
            document =
                await Activity.findOne({
                    _id: referenceId,
                    isActive: true,
                });
            break;

        case "Restaurant":
            document =
                await Restaurant.findOne({
                    _id: referenceId,
                    isActive: true,
                });
            break;

        default:
            throw new ApiError(
                400,
                "Invalid review type."
            );
    }

    if (!document) {
        throw new ApiError(
            404,
            `${reviewType} not found.`
        );
    }

    return document;
};

// Create Review

const createReview = async (
    reviewData
) => {
    // Validate User

    await validateUser(
        reviewData.user
    );

    // Validate Reference

    await validateReference({
        reviewType:
            reviewData.reviewType,
        referenceId:
            reviewData.referenceId,
        user: reviewData.user,
    });

    // Prevent Duplicate Review

    const existingReview =
        await Review.findOne({
            user: reviewData.user,
            reviewType:
                reviewData.reviewType,
            referenceId:
                reviewData.referenceId,
            isActive: true,
        });

    if (existingReview) {
        throw new ApiError(
            409,
            "You have already reviewed this item."
        );
    }

    // Create Review

    let review;

    try {
        review = await Review.create(
            reviewData
        );
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(
                409,
                "You have already reviewed this item."
            );
        }

        throw error;
    }

    return await populateReview(
        Review.findById(
            review._id
        )
    );
};

// Get All Reviews

const getAllReviews = async ({
    page = 1,
    limit = 10,
    user,
} = {}) => {
    page = Number(page);
    limit = Number(limit);

    const skip =
        (page - 1) * limit;

    const [
        reviews,
        total,
    ] = await Promise.all([
        populateReview(
            Review.find({
                user,
                isActive: true,
            })
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
        ),

        Review.countDocuments({
            user,
            isActive: true,
        }),
    ]);

    return {
        reviews,
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

// Get Review By ID

const getReviewById = async ({
    reviewId,
    user,
}) => {
    const review =
        await populateReview(
            Review.findOne({
                _id: reviewId,
                user,
                isActive: true,
            })
        );

    if (!review) {
        throw new ApiError(
            404,
            "Review not found."
        );
    }

    return review;
};

// Get Reviews For Entity

const getReviewsForEntity = async ({
    reviewType,
    referenceId,
}) => {
    const reviews =
        await populateReview(
            Review.find({
                reviewType,
                referenceId,
                isActive: true,
            }).sort({
                createdAt: -1,
            })
        );

    return reviews;
};

// Search Reviews

const searchReviews = async (
    keyword,
    user
) => {
    if (!keyword) {
        return [];
    }

    return await populateReview(
        Review.find({
            user,
            isActive: true,
            $or: [
                {
                    title: {
                        $regex: keyword,
                        $options: "i",
                    },
                },
                {
                    comment: {
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

// Filter Reviews

const filterReviews = async ({
    user,
    reviewType,
    rating,
    isVerified,
} = {}) => {
    const query = {
        user,
        isActive: true,
    };

    if (reviewType) {
        query.reviewType =
            reviewType;
    }

    if (rating !== undefined) {
        query.rating =
            Number(rating);
    }

    if (
        isVerified !== undefined
    ) {
        query.isVerified =
            isVerified === true ||
            isVerified === "true";
    }

    return await populateReview(
        Review.find(query).sort({
            createdAt: -1,
        })
    );
};

// Update Review

const updateReview = async ({
    reviewId,
    reviewData,
    user,
}) => {
    const review =
        await Review.findOne({
            _id: reviewId,
            user,
            isActive: true,
        });

    if (!review) {
        throw new ApiError(
            404,
            "Review not found."
        );
    }

    // Validate Reference If Changed

    if (
        reviewData.reviewType ||
        reviewData.referenceId
    ) {
        await validateReference({
            reviewType:
                reviewData.reviewType ||
                review.reviewType,

            referenceId:
                reviewData.referenceId ||
                review.referenceId,

            user,
        });
    }

    // Check Duplicate If Reference Changes

    const newReviewType =
        reviewData.reviewType ||
        review.reviewType;

    const newReferenceId =
        reviewData.referenceId ||
        review.referenceId;

    if (
        newReviewType !==
            review.reviewType ||
        String(newReferenceId) !==
            String(review.referenceId)
    ) {
        const existingReview =
            await Review.findOne({
                user,
                reviewType:
                    newReviewType,
                referenceId:
                    newReferenceId,
                isActive: true,
                _id: {
                    $ne: reviewId,
                },
            });

        if (existingReview) {
            throw new ApiError(
                409,
                "You have already reviewed this item."
            );
        }
    }

    // Update Fields

    Object.entries(
        reviewData
    ).forEach(([key, value]) => {
        if (
            value !== undefined &&
            value !== null
        ) {
            review[key] = value;
        }
    });

    review.isEdited = true;

    await review.save();

    return await populateReview(
        Review.findById(
            review._id
        )
    );
};

// Delete Review

const deleteReview = async ({
    reviewId,
    user,
}) => {
    const review =
        await Review.findOne({
            _id: reviewId,
            user,
            isActive: true,
        });

    if (!review) {
        throw new ApiError(
            404,
            "Review not found."
        );
    }

    review.isActive = false;

    await review.save();
};

export const reviewService = {
    createReview,
    getAllReviews,
    getReviewById,
    getReviewsForEntity,
    searchReviews,
    filterReviews,
    updateReview,
    deleteReview,
};