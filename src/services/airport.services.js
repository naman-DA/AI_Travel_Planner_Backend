import { geoapifyClient, GEOAPIFY_API_KEY } from "../config/geoapify.js";
import { ApiError } from "../utils/ApiError.js";

const findNearestAirport = async ({
    latitude,
    longitude,
}) => {
    if (
        latitude === undefined ||
        longitude === undefined
    ) {
        throw new ApiError(
            400,
            "Latitude and longitude are required."
        );
    }

    try {
        const response = await geoapifyClient.get(
            "/v2/places",
            {
                params: {
                    categories: "airport",
                    filter: `circle:${longitude},${latitude},200000`,
                    limit: 10,
                    apiKey: GEOAPIFY_API_KEY,
                },
            }
        );

        const features =
            response.data?.features || [];

        if (!features.length) {
            return null;
        }

        const airports = features
            .map((feature) => {
                const properties =
                    feature.properties || {};

                const [airportLongitude, airportLatitude] =
                    feature.geometry?.coordinates || [];

                return {
                    airportName:
                        properties.name ||
                        properties.formatted ||
                        "",

                    airportCode:
                        properties.iata ||
                        null,

                    distance:
                        properties.distance || null,

                    latitude: airportLatitude,

                    longitude: airportLongitude,

                    formatted:
                        properties.formatted || "",
                };
            })
            .filter(
                (airport) =>
                    airport.airportCode
            );

        if (!airports.length) {
            return null;
        }

        airports.sort(
            (a, b) =>
                (a.distance || Infinity) -
                (b.distance || Infinity)
        );

        return airports[0];

    } catch (error) {
        console.error(
            "Airport lookup failed:",
            error.response?.data ||
            error.message
        );

        throw new ApiError(
            502,
            "Failed to find nearby airport."
        );
    }
};

export {
    findNearestAirport,
};