import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getWeather } from "../services/weather.services.js";

const getWeatherData = asyncHandler(async (req, res) => {
    const { city, lat, lon, days } = req.query;

    const weather = await getWeather({
        city,
        lat: lat !== undefined ? Number(lat) : undefined,
        lon: lon !== undefined ? Number(lon) : undefined,
        days: days !== undefined ? Number(days) : 5
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            weather,
            "Weather fetched successfully"
        )
    );
});

export { getWeatherData };