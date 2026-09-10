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
                limit: 10,
                apiKey: GEOAPIFY_API_KEY,
            },
        });

        console.log(
            "Geoapify airport response:",
            JSON.stringify(response.data, null, 2)
        );

        return response.data;

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

export {
    findNearestAirport,
};