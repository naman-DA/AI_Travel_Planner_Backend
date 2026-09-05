import axios from "axios";
import { ApiError } from "../utils/ApiError.js";

const WEATHER_BASE_URL = "https://api.weatherapi.com/v1";

const getWeather = async ({ city, lat, lon, days = 5 }) => {
    if (!city && (lat === undefined || lon === undefined)) {
        throw new ApiError(400, "City or latitude and longitude are required");
    }

    const query = city || `${lat},${lon}`;

    try {
        const response = await axios.get(
            `${WEATHER_BASE_URL}/forecast.json`,
            {
                params: {
                    key: process.env.WEATHER_API_KEY,
                    q: query,
                    days,
                    aqi: "no",
                    alerts: "yes"
                },
                timeout: 10000
            }
        );

        const data = response.data;

        return {
            location: {
                name: data.location.name,
                region: data.location.region,
                country: data.location.country,
                latitude: data.location.lat,
                longitude: data.location.lon,
                localTime: data.location.localtime
            },

            current: {
                temperatureC: data.current.temp_c,
                feelsLikeC: data.current.feelslike_c,
                humidity: data.current.humidity,
                windKph: data.current.wind_kph,
                condition: data.current.condition.text,
                icon: data.current.condition.icon.startsWith("//")
    ? `https:${data.current.condition.icon}`
    : data.current.condition.icon
            },

            forecast: data.forecast.forecastday.map((day) => ({
                date: day.date,
                maxTempC: day.day.maxtemp_c,
                minTempC: day.day.mintemp_c,
                avgTempC: day.day.avgtemp_c,
                maxWindKph: day.day.maxwind_kph,
                precipitationMm: day.day.totalprecip_mm,
                condition: day.day.condition.text,
                icon: day.day.condition.icon.startsWith("//")
    ? `https:${day.day.condition.icon}`
    : day.day.condition.icon,
                sunrise: day.astro.sunrise,
                sunset: day.astro.sunset
            }))
        };

    } catch (error) {
        const providerMessage =
            error.response?.data?.error?.message ||
            "Failed to fetch weather data";

        throw new ApiError(
            error.response?.status === 404 ? 404 : 502,
            providerMessage
        );
    }
};

export { getWeather };