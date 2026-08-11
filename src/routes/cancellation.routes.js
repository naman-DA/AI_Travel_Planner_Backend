import { Router } from "express";

import {
    createCancellation,
    getAllCancellations,
    getCancellationById,
} from "../controllers/cancellation.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Authentication for all cancellation routes

router.use(verifyJWT);

// Create Cancellation

router.post(
    "/",
    createCancellation
);

// Get All Cancellations

router.get(
    "/",
    getAllCancellations
);

// Get Cancellation By ID

router.get(
    "/:cancellationId",
    getCancellationById
);

export default router;