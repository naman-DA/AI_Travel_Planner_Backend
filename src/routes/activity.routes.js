import { Router } from "express";
import {
    createActivity,
    getAllActivities,
    getActivityById,
    updateActivity,
    deleteActivity,
    searchActivities,
    filterActivities,
    searchExternalActivities,
    saveExternalActivity,
} from "../controllers/activity.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { authorize } from "../middlewares/admin.middlewares.js";

const router = Router();

// Public Routes

router.get("/", getAllActivities);

router.get("/search", searchActivities);

router.get("/search-external", searchExternalActivities);

router.get("/filter", filterActivities);

router.post(
    "/select",
    verifyJWT,
    saveExternalActivity);

router.get("/:activityId", getActivityById);

// Admin Routes

router.post(
    "/",
    verifyJWT,
    authorize("admin"),
    upload.fields([
        {
            name: "coverImage",
            maxCount: 1,
        },
        {
            name: "galleryImages",
            maxCount: 10,
        },
    ]),
    createActivity
);

router.patch(
    "/:activityId",
    verifyJWT,
    authorize("admin"),
    upload.fields([
        {
            name: "coverImage",
            maxCount: 1,
        },
        {
            name: "galleryImages",
            maxCount: 10,
        },
    ]),
    updateActivity
);

router.delete(
    "/:activityId",
    verifyJWT,
    authorize("admin"),
    deleteActivity
);

export default router;