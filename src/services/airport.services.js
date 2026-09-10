import { airports } from "../data/airports.js";
import { ApiError } from "../utils/ApiError.js";

const EARTH_RADIUS_KM = 6371;

// Maximum distance from destination to consider an airport.
const MAX_AIRPORT_DISTANCE_KM = 300;

// If airports are within this distance of each other,
// prefer the larger commercial airport.
const SIZE_PREFERENCE_DISTANCE_KM = 30;

const airportPriority = {
    large_airport: 3,
    medium_airport: 2,
    small_airport: 1,
};

const toRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
};

const calculateDistanceKm = (
    latitude1,
    longitude1,
    latitude2,
    longitude2
) => {
    const dLatitude = toRadians(latitude2 - latitude1);
    const dLongitude = toRadians(longitude2 - longitude1);

    const lat1 = toRadians(latitude1);
    const lat2 = toRadians(latitude2);

    const a =
        Math.sin(dLatitude / 2) ** 2 +
        Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLongitude / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return EARTH_RADIUS_KM * c;
};

const findNearbyAirports = async ({
    latitude,
    longitude,
    limit = 5,
}) => {
    const lat = Number(latitude);
    const lon = Number(longitude);
    const resultLimit = Number(limit);

    // --------------------------------------------------
    // Validate coordinates
    // --------------------------------------------------

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
    ) {
        throw new ApiError(
            400,
            "Valid latitude and longitude are required."
        );
    }

    if (
        !Number.isInteger(resultLimit) ||
        resultLimit < 1 ||
        resultLimit > 20
    ) {
        throw new ApiError(
            400,
            "Airport limit must be between 1 and 20."
        );
    }

    // --------------------------------------------------
    // Find airports with valid IATA + coordinates
    // --------------------------------------------------

    const nearbyAirports = airports
        .filter((airport) => {
            return (
                airport.iata &&
                Number.isFinite(Number(airport.latitude)) &&
                Number.isFinite(Number(airport.longitude))
            );
        })

        // --------------------------------------------------
        // Calculate actual distance
        // --------------------------------------------------

        .map((airport) => {
            const distanceKm = calculateDistanceKm(
                lat,
                lon,
                Number(airport.latitude),
                Number(airport.longitude)
            );

            return {
                ...airport,
                distanceKm,
            };
        })

        // --------------------------------------------------
        // Ignore airports farther than 300 km
        // --------------------------------------------------

        .filter(
            (airport) =>
                airport.distanceKm <= MAX_AIRPORT_DISTANCE_KM
        )

        // --------------------------------------------------
        // SORTING LOGIC
        //
        // Distance is PRIMARY.
        // Airport size is only a tie-breaker when airports
        // are reasonably close to each other.
        // --------------------------------------------------

        .sort((airportA, airportB) => {
            const distanceDifference =
                airportA.distanceKm - airportB.distanceKm;

            // If distance difference is significant,
            // choose the closer airport.
            if (
                Math.abs(distanceDifference) >
                SIZE_PREFERENCE_DISTANCE_KM
            ) {
                return distanceDifference;
            }

            // Airports are close enough.
            // Prefer larger commercial airport.
            const priorityA =
                airportPriority[airportA.type] || 0;

            const priorityB =
                airportPriority[airportB.type] || 0;

            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }

            // Same airport type → closer wins.
            return distanceDifference;
        })

        .slice(0, resultLimit);

    // --------------------------------------------------
    // No airport found
    // --------------------------------------------------

    if (!nearbyAirports.length) {
        return {
            primaryAirportIata: null,
            nearbyAirports: [],
        };
    }

    // --------------------------------------------------
    // Primary airport
    // --------------------------------------------------

    const primaryAirport = nearbyAirports[0];

    // --------------------------------------------------
    // Return clean data for MongoDB
    // --------------------------------------------------

    return {
        primaryAirportIata: primaryAirport.iata,

        nearbyAirports: nearbyAirports.map((airport) => ({
          airportName: airport.name || "",
          airportCode: airport.iata,
          icao: airport.icao || null,
          city: airport.city || "",
          countryCode: airport.countryCode || "",
          latitude: Number(airport.latitude),
          longitude: Number(airport.longitude),
          distance: Number(airport.distanceKm.toFixed(2)),
          type: airport.type || null,
      })),
    };
};

export {
    findNearbyAirports,
    calculateDistanceKm,
};