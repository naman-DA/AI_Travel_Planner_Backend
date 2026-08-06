import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRouter from "./routes/auth.routes.js";

const app = express();

/* ===============================
        Middlewares
================================ */

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

/* ===============================
        Health Check Route
================================ */

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AI Travel Planner Backend Running 🚀",
    });
});

export { app };