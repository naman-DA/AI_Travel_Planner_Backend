import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRouter from "./routes/auth.routes.js";
import destinationRouter from "./routes/destination.routes.js";
import hotelRouter from "./routes/hotel.routes.js";
import restaurantRouter from "./routes/restaurant.routes.js";
import activityRouter from "./routes/activity.routes.js";
import tripRouter from "./routes/trip.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import { errorHandler } from "./middlewares/error.middlewares.js";

const app = express();

// Middlewares

app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        credentials: true,
    })
);

app.use(
    express.json({
        limit: "20kb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "20kb",
    })
);

app.use(express.static("public"));

app.use(cookieParser());

app.use(morgan("dev"));

app.use("/api/v1/auth", authRouter);

app.use("/api/v1/destinations", destinationRouter);

app.use("/api/v1/hotels", hotelRouter);

app.use("/api/v1/restaurants", restaurantRouter);

app.use("/api/v1/activities", activityRouter);

app.use("/api/v1/trips", tripRouter);

app.use("/api/v1/bookings", bookingRouter);

app.use("/api/v1/payments", paymentRouter);

app.use(errorHandler);

// Health Check Route

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AI Travel Planner Backend Running 🚀",
    });
});

export { app };