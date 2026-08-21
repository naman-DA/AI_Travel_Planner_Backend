import { Router } from "express";
import {
    createHotel,
    getAllHotels,
    getHotelById,
    updateHotel,
    deleteHotel,
    searchHotels,
    searchExternalHotels,
    saveExternalHotel,
    getHotelBookingUrl,
    filterHotels,
} from "../controllers/hotel.controllers.js";

import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorize } from "../middlewares/admin.middlewares.js";

const router = Router();

// Public Routes

router.get(
    "/",
    getAllHotels
);

router.get(
    "/search",
    searchHotels
);

router.get(
    "/search-external",
    searchExternalHotels
);

router.get(
    "/filter",
    filterHotels
);

router.post(
    "/select",
    verifyJWT,
    saveExternalHotel
);

// Dynamic route MUST come after all fixed routes

router.get(
    "/:hotelId/booking-url",
    getHotelBookingUrl
);

router.get(
    "/:hotelId",
    getHotelById
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
    createHotel
);

router.patch(
    "/:hotelId",
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
    updateHotel
);

router.delete(
    "/:hotelId",
    verifyJWT,
    authorize("admin"),
    deleteHotel
);

export default router;