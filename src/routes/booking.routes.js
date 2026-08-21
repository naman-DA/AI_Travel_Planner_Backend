import { Router } from "express";
import {
    createBooking,
    getAllBookings,
    getBookingById,
    searchBookings,
    filterBookings,
    updateBooking,
    initiateExternalBooking,
    confirmBooking,
    cancelBooking,
    deleteBooking,
} from "../controllers/booking.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorize } from "../middlewares/admin.middlewares.js";

const router = Router();

// All booking routes require authentication

router.use(verifyJWT);

// Create

router.post(
    "/",
    createBooking
);

// Get all

router.get(
    "/",
    getAllBookings
);

// Search

router.get(
    "/search",
    searchBookings
);

// Filter

router.get(
    "/filter",
    filterBookings
);

// External booking redirect
// MUST come before /:bookingId

router.post(
    "/:bookingId/redirect",
    initiateExternalBooking
);

// Future provider confirmation

router.post(
    "/:bookingId/confirm",
    confirmBooking
);

// Get by ID

router.get(
    "/:bookingId",
    getBookingById
);

// Update

router.patch(
    "/:bookingId",
    updateBooking
);

// Cancel

router.patch(
    "/:bookingId/cancel",
    cancelBooking
);

// Admin delete

router.delete(
    "/:bookingId",
    authorize("admin"),
    deleteBooking
);

export default router;