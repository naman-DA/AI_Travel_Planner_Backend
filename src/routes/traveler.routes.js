import { Router } from "express";

import {
    createTraveler,
    getAllTravelers,
    getTravelerById,
    updateTraveler,
    deleteTraveler,
    setPrimaryTraveler,
    searchTravelers,
} from "../controllers/traveler.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// All traveler operations require authentication

router.use(verifyJWT);

// Search must come before /:travelerId

router.get(
    "/search",
    searchTravelers
);

// Create Traveler

router.post(
    "/",
    createTraveler
);

// Get All Travelers

router.get(
    "/",
    getAllTravelers
);

// Get Traveler By ID

router.get(
    "/:travelerId",
    getTravelerById
);

// Update Traveler

router.patch(
    "/:travelerId",
    updateTraveler
);

// Delete Traveler

router.delete(
    "/:travelerId",
    deleteTraveler
);

// Set Primary Traveler

router.patch(
    "/:travelerId/primary",
    setPrimaryTraveler
);

export default router;