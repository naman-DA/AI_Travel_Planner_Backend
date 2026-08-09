import { Router } from "express";
import {
    createBooking,
    getAllBookings,
    getBookingById,
    searchBookings,
    filterBookings,
    updateBooking,
    cancelBooking,
    deleteBooking,
} from "../controllers/booking.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorize } from "../middlewares/admin.middlewares.js";

const router = Router();

// User Routes

router.use(verifyJWT);

router.post(
    "/",
    createBooking
);

router.get(
    "/",
    getAllBookings
);

router.get(
    "/search",
    searchBookings
);

router.get(
    "/filter",
    filterBookings
);

router.get(
    "/:bookingId",
    getBookingById
);

router.patch(
    "/:bookingId",
    updateBooking
);

router.patch(
    "/:bookingId/cancel",
    cancelBooking
);

// Admin Routes

router.delete(
    "/:bookingId",
    authorize("admin"),
    deleteBooking
);

export default router;