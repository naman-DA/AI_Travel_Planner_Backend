import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import {
    validateSelectFlightOffer,
    validateFlightOfferId,
} from "../validators/flightOffer.validators.js";

import {
    flightOfferService,
} from "../services/flightOffer.services.js";

/**
 * Search and save flight offers
 */
const searchAndSaveFlightOffers =
    asyncHandler(async (req, res) => {
        const {
            trip,
            departureIata,
            arrivalIata,
            outboundDate,
            adults = 1,
            travelClass = "ECONOMY",
            currency = "INR",
        } = req.body;

        if (!departureIata) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    null,
                    "Departure IATA code is required."
                )
            );
        }

        if (!arrivalIata) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    null,
                    "Arrival IATA code is required."
                )
            );
        }

        if (!outboundDate) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    null,
                    "Outbound date is required."
                )
            );
        }

        const result =
            await flightOfferService
                .searchAndSaveFlightOffers({
                    user: req.user._id,
                    trip,
                    departureIata,
                    arrivalIata,
                    outboundDate,
                    adults,
                    travelClass,
                    currency,
                });

        return res.status(200).json(
            new ApiResponse(
                200,
                result,
                "Flight offers fetched successfully."
            )
        );
    });


/**
 * Get one flight offer
 */
const getFlightOfferById =
    asyncHandler(async (req, res) => {
        const { flightOfferId } =
            req.params;

        validateFlightOfferId(
            flightOfferId
        );

        const offer =
            await flightOfferService
                .getFlightOfferById({
                    flightOfferId,
                    user: req.user._id,
                });

        return res.status(200).json(
            new ApiResponse(
                200,
                offer,
                "Flight offer fetched successfully."
            )
        );
    });


/**
 * Select flight offer
 */
const selectFlightOffer =
    asyncHandler(async (req, res) => {
        validateSelectFlightOffer(
            req.body
        );

        const {
            flightOfferId,
            trip,
        } = req.body;

        const offer =
            await flightOfferService
                .selectFlightOffer({
                    flightOfferId,
                    user: req.user._id,
                    trip,
                });

        return res.status(200).json(
            new ApiResponse(
                200,
                offer,
                "Flight offer selected successfully."
            )
        );
    });


/**
 * Get booking details
 */
const getSelectedFlightBookingDetails =
    asyncHandler(async (req, res) => {
        const { flightOfferId } =
            req.params;

        validateFlightOfferId(
            flightOfferId
        );

        const result =
            await flightOfferService
                .getSelectedFlightBookingDetails({
                    flightOfferId,
                    user: req.user._id,
                });

        return res.status(200).json(
            new ApiResponse(
                200,
                result,
                "Flight booking details fetched successfully."
            )
        );
    });


/**
 * Get external booking URL
 */
const getSelectedFlightBookingUrl =
    asyncHandler(async (req, res) => {
        const { flightOfferId } =
            req.params;

        validateFlightOfferId(
            flightOfferId
        );

        const result =
            await flightOfferService
                .getSelectedFlightBookingUrl({
                    flightOfferId,
                    user: req.user._id,
                });

        return res.status(200).json(
            new ApiResponse(
                200,
                result,
                "Flight booking URL generated successfully."
            )
        );
    });


export {
    searchAndSaveFlightOffers,
    getFlightOfferById,
    selectFlightOffer,
    getSelectedFlightBookingDetails,
    getSelectedFlightBookingUrl,
};