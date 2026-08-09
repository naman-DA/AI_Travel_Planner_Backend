import { Router } from "express";

import {
    createPayment,
    getAllPayments,
    getPaymentById,
    searchPayments,
    filterPayments,
    updatePayment,
    markPaymentAsPaid,
    markPaymentAsFailed,
    refundPayment,
    deletePayment,
} from "../controllers/payment.controllers.js";

import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT);

// Create Payment
router.post(
    "/",
    createPayment
);

// Get All Payments
router.get(
    "/",
    getAllPayments
);

// Search Payments
router.get(
    "/search",
    searchPayments
);

// Filter Payments
router.get(
    "/filter",
    filterPayments
);

// Get Payment By ID
router.get(
    "/:paymentId",
    getPaymentById
);

// Update Payment
router.patch(
    "/:paymentId",
    updatePayment
);

// Mark Payment As Paid
router.patch(
    "/:paymentId/paid",
    markPaymentAsPaid
);

// Mark Payment As Failed
router.patch(
    "/:paymentId/failed",
    markPaymentAsFailed
);

// Refund Payment
router.patch(
    "/:paymentId/refund",
    refundPayment
);

// Delete Payment
router.delete(
    "/:paymentId",
    deletePayment
);

export default router;