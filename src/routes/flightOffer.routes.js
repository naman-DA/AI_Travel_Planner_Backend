import { Router } from "express";

import {
    searchAndSaveFlightOffers,
    getFlightOfferById,
    selectFlightOffer,
    getSelectedFlightBookingDetails,
    getSelectedFlightBookingUrl,
} from "../controllers/flightOffer.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.post(
    "/search",
    verifyJWT,
    searchAndSaveFlightOffers
);

router.post(
    "/select",
    verifyJWT,
    selectFlightOffer
);

router.get(
    "/:flightOfferId/booking-details",
    verifyJWT,
    getSelectedFlightBookingDetails
);

router.get(
    "/:flightOfferId/booking-url",
    verifyJWT,
    getSelectedFlightBookingUrl
);

router.get(
    "/:flightOfferId",
    verifyJWT,
    getFlightOfferById
);

export default router;