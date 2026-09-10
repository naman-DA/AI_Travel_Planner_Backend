import { geoapifyClient, GEOAPIFY_API_KEY } from "../config/geoapify.js";
import { ApiError } from "../utils/ApiError.js";

const findNearestAirport = async ({ latitude, longitude }) => {
    if (
        latitude === undefined ||
        longitude === undefined ||
        Number.isNaN(Number(latitude)) ||
        Number.isNaN(Number(longitude))
    ) {
        throw new ApiError(400, "Valid latitude and longitude are required.");
    }

    try {
        const response = await geoapifyClient.get("/v2/places", {
            params: {
                categories: "airport",
                filter: `circle:${Number(longitude)},${Number(latitude)},200000`,
                limit: 20,
                apiKey: GEOAPIFY_API_KEY,
            },
        });

        const features = response.data?.features || [];

        if (!features.length) {
            return null;
        }

        const airports = features
            .map((feature) => {
                const properties = feature.properties || {};

                const [airportLongitude, airportLatitude] =
                    feature.geometry?.coordinates || [];

                const airportCode =
                    properties.airport?.iata ||
                    properties.datasource?.raw?.iata ||
                    null;

                return {
                    airportName:
                        properties.name ||
                        properties.formatted ||
                        "",

                    airportCode,

                    icaoCode:
                        properties.airport?.icao ||
                        properties.datasource?.raw?.icao ||
                        null,

                    distance: properties.distance || null,

                    latitude: airportLatitude ?? null,

                    longitude: airportLongitude ?? null,

                    formatted: properties.formatted || "",

                    placeId: properties.place_id || null,
                };
            })
            .filter((airport) => airport.airportCode);

        if (!airports.length) {
            return null;
        }

        airports.sort(
            (a, b) =>
                (a.distance ?? Infinity) -
                (b.distance ?? Infinity)
        );

        return airports[0];
    } catch (error) {
        console.error(
            "Airport lookup failed:",
            error.response?.data || error.message
        );

        throw new ApiError(
            502,
            "Failed to find nearby airport."
        );
    }
};

export { findNearestAirport };