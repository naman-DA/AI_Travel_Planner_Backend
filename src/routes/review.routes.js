import { Router } from "express";

import {
    createReview,
    getAllReviews,
    getReviewById,
    getReviewsForEntity,
    searchReviews,
    filterReviews,
    updateReview,
    deleteReview,
} from "../controllers/review.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Authentication for all review routes

router.use(verifyJWT);

// Create Review

router.post(
    "/",
    createReview
);

// Get All Reviews

router.get(
    "/",
    getAllReviews
);

// Search Reviews

router.get(
    "/search",
    searchReviews
);

// Filter Reviews

router.get(
    "/filter",
    filterReviews
);

// Get Reviews For Entity

router.get(
    "/entity",
    getReviewsForEntity
);

// Get Review By ID

router.get(
    "/:reviewId",
    getReviewById
);

// Update Review

router.patch(
    "/:reviewId",
    updateReview
);

// Delete Review

router.delete(
    "/:reviewId",
    deleteReview
);

export default router;