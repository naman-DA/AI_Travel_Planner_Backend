import "dotenv/config";

import connectDB from "./db/index.js";
import { app } from "./app.js";
import { emailService } from "./services/email.services.js";

const PORT = process.env.PORT || 8000;

connectDB()
    .then(async () => {
        try {
            await emailService.verifyTransporter();

            console.log(
                "✅ Email transporter verified."
            );

            app.listen(PORT, () => {
                console.log(
                    `Server running on ${PORT}`
                );
            });
        } catch (error) {
            console.error(
                "❌ Startup dependency failed:",
                error.message
            );

            process.exit(1);
        }
    })
    .catch((error) => {
        console.error(
            "❌ MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    });