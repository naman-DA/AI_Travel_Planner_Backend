import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8000;

import { emailService } from "./services/email.services.js";

connectDB()
    .then(async () => {

        await emailService.verifyTransporter();

        app.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        });

    });