import { Router } from "express";

import {
    createDestination,
    getAllDestinations,
    getDestinationById,
    updateDestination,
    deleteDestination,
    searchDestinations,
    filterDestinations,
    saveExternalDestination,
} from "../controllers/destination.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

import { upload } from "../middlewares/multer.middlewares.js";

import { authorize } from "../middlewares/admin.middlewares.js";

const router = Router();

// Public Routes

router.get(
    "/",
    getAllDestinations
);

router.get(
    "/search",
    searchDestinations
);

router.get(
    "/filter",
    filterDestinations
);

router.get(
    "/:destinationId",
    getDestinationById
);

// Protected Routes

router.post(
    "/select",
    verifyJWT,
    saveExternalDestination
);

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
    createDestination
);

router.patch(
    "/:destinationId",
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
    updateDestination
);

router.delete(
    "/:destinationId",
    verifyJWT,
    authorize("admin"),
    deleteDestination
);

export default router;