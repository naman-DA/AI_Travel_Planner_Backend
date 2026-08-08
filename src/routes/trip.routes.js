import { Router } from "express";
import {
    createTrip,
    getAllTrips,
    getTripById,
    updateTrip,
    deleteTrip,
    searchTrips,
    filterTrips,
} from "../controllers/trip.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Public Routes

router.get(
    "/",
    verifyJWT,
    getAllTrips
);

router.get(
    "/search",
    verifyJWT,
    searchTrips
);

router.get(
    "/filter",
    verifyJWT,
    filterTrips
);

router.get(
    "/:tripId",
    verifyJWT,
    getTripById
);

// Protected Routes

router.post(
    "/",
    verifyJWT,
    createTrip
);

router.patch(
    "/:tripId",
    verifyJWT,
    updateTrip
);

router.delete(
    "/:tripId",
    verifyJWT,
    deleteTrip
);

export default router;