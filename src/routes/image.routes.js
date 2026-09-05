import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";

import {
    uploadImageController,
    deleteImageController,
} from "../controllers/image.controllers.js";

const router = Router();

router.post(
    "/upload",
    verifyJWT,
    upload.single("image"),
    uploadImageController
);

router.delete(
    "/",
    verifyJWT,
    deleteImageController
);

export default router;