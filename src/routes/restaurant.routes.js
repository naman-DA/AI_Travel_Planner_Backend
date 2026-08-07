import { Router } from "express";
import {
    createRestaurant,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant,
    searchRestaurants,
    filterRestaurants,
} from "../controllers/restaurant.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorize } from "../middlewares/admin.middlewares.js";

const router = Router();

// Public Routes

router.get(
    "/",
    getAllRestaurants
);

router.get(
    "/search",
    searchRestaurants
);

router.get(
    "/filter",
    filterRestaurants
);

router.get(
    "/:restaurantId",
    getRestaurantById
);

// Admin Routes

router.post(
    "/",
    verifyJWT,
    authorize("admin"),
    upload.fields([
        {
            name: "coverImage",
            maxCount: 1,
        },
        {
            name: "galleryImages",
            maxCount: 10,
        },
    ]),
    createRestaurant
);

router.patch(
    "/:restaurantId",
    verifyJWT,
    authorize("admin"),
    upload.fields([
        {
            name: "coverImage",
            maxCount: 1,
        },
        {
            name: "galleryImages",
            maxCount: 10,
        },
    ]),
    updateRestaurant
);

router.delete(
    "/:restaurantId",
    verifyJWT,
    authorize("admin"),
    deleteRestaurant
);

export default router;