import { Router } from "express";

import {
    createWishlist,
    getAllWishlist,
    getWishlistById,
    getWishlistByItem,
    searchWishlist,
    filterWishlist,
    updateWishlist,
    deleteWishlist,
} from "../controllers/wishlist.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Authentication for all wishlist routes

router.use(verifyJWT);

// Create Wishlist Item

router.post(
    "/",
    createWishlist
);

// Get All Wishlist Items

router.get(
    "/",
    getAllWishlist
);

// Search Wishlist

router.get(
    "/search",
    searchWishlist
);

// Filter Wishlist

router.get(
    "/filter",
    filterWishlist
);

// Get Wishlist By Item

router.get(
    "/item",
    getWishlistByItem
);

// Get Wishlist By ID

router.get(
    "/:wishlistId",
    getWishlistById
);

// Update Wishlist

router.patch(
    "/:wishlistId",
    updateWishlist
);

// Delete Wishlist

router.delete(
    "/:wishlistId",
    deleteWishlist
);

export default router;