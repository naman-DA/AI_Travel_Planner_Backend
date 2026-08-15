import { FlightOffer } from "../models/flightOffer.models.js";
import { Trip } from "../models/trip.models.js";
import { ApiError } from "../utils/ApiError.js";
import {
    googleFlightsProvider,
} from "./googleFlightsProvider.services.js";

/**
 * Convert provider date/time into a JavaScript Date.
 *
 * Google Flights provider returns values such as:
 * "2026-9-15 13:00"
 */
const parseProviderDate = (value) => {
    if (!value) {
        return null;
    }

    // Already a Date
    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? null
            : value;
    }

    // Handle provider format:
    // "15-09-2026 09:30 AM"
    // "15-09-2026 03:55 PM"
    if (typeof value === "string") {
        const match = value.match(
            /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i
        );

        if (match) {
            const [
                ,
                day,
                month,
                year,
                hour,
                minute,
                meridiem,
            ] = match;

            let hours = Number(hour);

            if (meridiem.toUpperCase() === "PM" && hours !== 12) {
                hours += 12;
            }

            if (meridiem.toUpperCase() === "AM" && hours === 12) {
                hours = 0;
            }

            const parsedDate = new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                hours,
                Number(minute),
                0,
                0
            );

            if (!Number.isNaN(parsedDate.getTime())) {
                return parsedDate;
            }
        }

        // Handle provider segment format:
        // "2026-9-15 13:00"
        const segmentMatch = value.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})$/
        );

        if (segmentMatch) {
            const [
                ,
                year,
                month,
                day,
                hours,
                minutes,
            ] = segmentMatch;

            const parsedDate = new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hours),
                Number(minutes),
                0,
                0
            );

            if (!Number.isNaN(parsedDate.getTime())) {
                return parsedDate;
            }
        }

        // Final fallback
        const fallback = new Date(value);

        if (!Number.isNaN(fallback.getTime())) {
            return fallback;
        }
    }

    return null;
};

/**
 * Normalize one Google Flights itinerary
 * into our FlightOffer schema.
 */
const normalizeFlightOffer = ({
    itinerary,
    user,
    trip = null,
    currency = "INR",
    searchId = null,
}) => {
    if (!itinerary) {
        return null;
    }
    
    const FLIGHT_OFFER_FRESHNESS_MS =
    10 * 60 * 1000;

    const firstFlight =
        Array.isArray(itinerary.flights) &&
        itinerary.flights.length > 0
            ? itinerary.flights[0]
            : null;

    if (!firstFlight) {
        return null;
    }

    const departureTime =
        parseProviderDate(
            itinerary.departure_time
        );

    const arrivalTime =
        parseProviderDate(
            itinerary.arrival_time
        );

    if (!departureTime || !arrivalTime) {
        console.warn(
            "Skipping itinerary because date parsing failed:",
            {
                departure_time:
                    itinerary.departure_time,

                arrival_time:
                    itinerary.arrival_time,

                flight_number:
                    firstFlight?.flight_number,
            }
        );

        return null;
    }

    const flights =
        Array.isArray(itinerary.flights)
            ? itinerary.flights.map(
                  (flight) => ({
                      departureAirport: {
                          airportName:
                              flight
                                  ?.departure_airport
                                  ?.airport_name ||
                              null,

                          airportCode:
                              flight
                                  ?.departure_airport
                                  ?.airport_code ||
                              null,

                          time:
                              parseProviderDate(
                                  flight
                                      ?.departure_airport
                                      ?.time
                              ),
                      },

                      arrivalAirport: {
                          airportName:
                              flight
                                  ?.arrival_airport
                                  ?.airport_name ||
                              null,

                          airportCode:
                              flight
                                  ?.arrival_airport
                                  ?.airport_code ||
                              null,

                          time:
                              parseProviderDate(
                                  flight
                                      ?.arrival_airport
                                      ?.time
                              ),
                      },

                      durationMinutes:
                          flight
                              ?.duration
                              ?.raw ??
                          null,

                      durationText:
                          flight
                              ?.duration
                              ?.text ||
                          null,

                      airline:
                          flight?.airline ||
                          null,

                      airlineLogo:
                          flight
                              ?.airline_logo ||
                          null,

                      flightNumber:
                          flight
                              ?.flight_number ||
                          null,

                      aircraft:
                          flight?.aircraft ||
                          null,

                      seat:
                          flight?.seat ||
                          null,

                      legroom:
                          flight?.legroom ||
                          null,

                      extensions:
                          Array.isArray(
                              flight?.extensions
                          )
                              ? flight.extensions
                              : [],
                  })
              )
            : [];

    const layovers =
        Array.isArray(
            itinerary.layovers
        )
            ? itinerary.layovers.map(
                  (layover) => ({
                      airportCode:
                          layover
                              ?.airport_code ||
                          null,

                      airportName:
                          layover
                              ?.airport_name ||
                          null,

                      durationMinutes:
                          layover
                              ?.duration ??
                          null,

                      durationText:
                          layover
                              ?.duration_label ||
                          null,

                      city:
                          layover?.city ||
                          null,
                  })
              )
            : [];

    return {
        user,
        trip,

        provider:
            "GoogleFlights",

        departureAirport:
            firstFlight
                ?.departure_airport
                ?.airport_code ||
            null,

        arrivalAirport:
            firstFlight
                ?.arrival_airport
                ?.airport_code ||
            null,

        departureTime,

        arrivalTime,

        durationMinutes:
            itinerary
                ?.duration
                ?.raw ??
            null,

        durationText:
            itinerary
                ?.duration
                ?.text ||
            null,

        flights,

        delay: {
            values:
                itinerary?.delay?.values ??
                false,

            text:
                Number(
                    itinerary?.delay?.text
                ) || 0,
        },

        selfTransfer:
            Boolean(
                itinerary?.self_transfer
            ),

        layovers,

        bags: itinerary?.bags
            ? {
                  carryOn:
                      itinerary.bags
                          .carry_on ??
                      null,

                  checked:
                      itinerary.bags
                          .checked ??
                      null,
              }
            : null,

        carbonEmissions:
            itinerary?.carbon_emissions
                ? {
                      differencePercent:
                          itinerary
                              .carbon_emissions
                              ?.difference_percent ??
                          null,

                      co2e:
                          itinerary
                              .carbon_emissions
                              ?.CO2e ??
                          null,

                      typicalForRoute:
                          itinerary
                              .carbon_emissions
                              ?.typical_for_this_route ??
                          null,

                      higher:
                          itinerary
                              .carbon_emissions
                              ?.higher ??
                          null,
                  }
                : null,

        price:
            Number(itinerary?.price) || 0,

        currency:
            currency.toUpperCase(),

        stops:
            Number(itinerary?.stops) || 0,

        airlineLogo:
            itinerary?.airline_logo ||
            null,

        bookingToken:
            itinerary?.booking_token ||
            null,

        searchId,
        expiresAt: new Date(
            Date.now() +
                FLIGHT_OFFER_FRESHNESS_MS
        ),
        isSelected: false,

        isActive: true,
    };
};


/**
 * Search and persist flight offers
 */
const searchAndSaveFlightOffers = async ({
    user,
    trip = null,
    departureIata,
    arrivalIata,
    outboundDate,
    adults = 1,
    travelClass = "ECONOMY",
    currency = "INR",
}) => {
    const result =
        await googleFlightsProvider.searchFlights({
            departureIata,
            arrivalIata,
            outboundDate,
            adults,
            travelClass,
            currency,
        });

    /*
     * Use the same deterministic search identity
     * as the provider/cache layer.
     */
    const searchId = [
        user,
        trip || "NO_TRIP",
        departureIata.toUpperCase(),
        arrivalIata.toUpperCase(),
        outboundDate,
        Number(adults),
        travelClass.toUpperCase(),
        currency.toUpperCase(),
    ].join("-");

    /*
     * If this search came from Redis, check whether
     * we already have active offers for this exact
     * search session.
     */
    const existingOffers =
        await FlightOffer.find({
            user,
            searchId,
            isActive: true,
            $or: [
                { expiresAt: null },
                {
                    expiresAt: {
                        $gt: new Date(),
                    },
                },
            ],
        }).sort({
            price: 1,
        });

    if (
        existingOffers.length > 0
    ) {
        return {
            searchId,
            provider: "GoogleFlights",
            offers: existingOffers,
            totalOffers:
                existingOffers.length,
            source:
                result?.source || "cache",
        };
    }

    const allItineraries = [
        ...(Array.isArray(
            result?.itineraries?.topFlights
        )
            ? result.itineraries.topFlights
            : []),

        ...(Array.isArray(
            result?.itineraries?.otherFlights
        )
            ? result.itineraries.otherFlights
            : []),
    ];

    if (!allItineraries.length) {
        return {
            searchId,
            provider: "GoogleFlights",
            offers: [],
            totalOffers: 0,
            source:
                result?.source || "provider",
        };
    }

    const normalizedOffers =
        allItineraries
            .map((itinerary) =>
                normalizeFlightOffer({
                    itinerary,
                    user,
                    trip,
                    currency,
                    searchId,
                })
            )
            .filter(Boolean);

    if (!normalizedOffers.length) {
        return {
            searchId,
            provider: "GoogleFlights",
            offers: [],
            totalOffers: 0,
            source:
                result?.source || "provider",
        };
    }

    /*
     * This search is genuinely new.
     *
     * Deactivate older active offers for the same
     * user/trip context before inserting the new session.
     */
    await FlightOffer.updateMany(
        {
            user,
            isActive: true,
            ...(trip
                ? { trip }
                : {}),
            searchId: {
                $ne: searchId,
            },
        },
        {
            $set: {
                isActive: false,
            },
        }
    );

    const offers =
        await FlightOffer.insertMany(
            normalizedOffers
        );

    return {
        searchId,
        provider: "GoogleFlights",
        offers,
        totalOffers:
            offers.length,
        source:
            result?.source || "provider",
    };
};

/**
 * Get user's flight offer by ID
 */
const getFlightOfferById = async ({
    flightOfferId,
    user,
}) => {
    const offer = await FlightOffer.findOne({
        _id: flightOfferId,
        user,
        isActive: true,
    }).exec();

    if (!offer) {
        throw new ApiError(
            404,
            "Flight offer not found."
        );
    }

    return offer;
};

/**
 * Select a flight offer
 */
const selectFlightOffer = async ({
    flightOfferId,
    user,
    trip = null,
}) => {
    const offer = await FlightOffer.findOne({
        _id: flightOfferId,
        user,
        isActive: true,
        $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
        ],
    })
        .select("+bookingToken")
        .exec();

    if (!offer) {
        throw new ApiError(
            410,
            "Flight offer has expired or is no longer available."
        );
    }

    if (trip) {
        const tripDocument = await Trip.findOne({
            _id: trip,
            user,
            isActive: true,
        });

        if (!tripDocument) {
            throw new ApiError(
                404,
                "Trip not found."
            );
        }

        offer.trip = tripDocument._id;
    }

    await FlightOffer.updateMany(
        {
            user,
            isActive: true,
            ...(offer.trip
                ? { trip: offer.trip }
                : {}),
            _id: {
                $ne: offer._id,
            },
        },
        {
            $set: {
                isSelected: false,
            },
        }
    );

    offer.isSelected = true;

    await offer.save();

    const responseOffer = offer.toObject();

    delete responseOffer.bookingToken;

    return responseOffer;
};

/**
 * Get booking details for selected offer
 */
const getSelectedFlightBookingDetails =
    async ({
        flightOfferId,
        user,
    }) => {
        const offer =
            await FlightOffer.findOne({
                _id: flightOfferId,
                user,
                isActive: true,
                $or: [
                    { expiresAt: null },
                    {
                        expiresAt: {
                            $gt: new Date(),
                        },
                    },
                ],
            })
                .select("+bookingToken")
                .exec();

        if (!offer) {
            throw new ApiError(
                410,
                "Flight offer has expired or is no longer available."
            );
        }

        if (!offer.bookingToken) {
            throw new ApiError(
                500,
                "Booking token is missing from the stored flight offer."
            );
        }

        return await googleFlightsProvider
            .getBookingDetails(
                offer.bookingToken
            );
};

/**
 * Get external booking URL for selected offer
 */
const getSelectedFlightBookingUrl =
    async ({
        flightOfferId,
        user,
    }) => {
        const offer =
            await FlightOffer.findOne({
                _id: flightOfferId,
                user,
                isActive: true,
                $or: [
                    { expiresAt: null },
                    {
                        expiresAt: {
                            $gt: new Date(),
                        },
                    },
                ],
            })
                .select("+bookingToken")
                .exec();

        if (!offer) {
            throw new ApiError(
                410,
                "Flight offer has expired or is no longer available."
            );
        }

        if (!offer.bookingToken) {
            throw new ApiError(
                500,
                "Booking token is missing from the stored flight offer."
            );
        }

        const bookingDetails =
            await googleFlightsProvider
                .getBookingDetails(
                    offer.bookingToken
                );

        const bookings =
            bookingDetails?.bookings || [];

        if (!bookings.length) {
            throw new ApiError(
                404,
                "No booking provider was returned for this flight."
            );
        }

        const providerToken =
            bookings[0]?.token;

        if (!providerToken) {
            throw new ApiError(
                502,
                "Provider booking token was not returned."
            );
        }

        return await googleFlightsProvider
            .getBookingUrl(
                providerToken
            );
};

export const flightOfferService = {
    searchAndSaveFlightOffers,
    getFlightOfferById,
    selectFlightOffer,
    getSelectedFlightBookingDetails,
    getSelectedFlightBookingUrl,
};