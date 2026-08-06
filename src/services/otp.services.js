import crypto from "crypto";
import { OTP } from "../models/otp.models.js";
import { ApiError } from "../utils/ApiError.js";

// Generate 6 Digit OTP

export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Generate Expiry Time

export const generateOTPExpiry = (minutes = 5) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

// Check Active OTP

export const hasActiveOTP = async (userId, purpose) => {
  return await OTP.exists({
    user: userId,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });
};

// Create OTP

export const createOTP = async ({
  userId,
  email,
  phoneNumber,
  purpose
}) => {
  await OTP.deleteMany({
    user: userId,
    purpose
  });

  const otp = generateOTP();
  const otpDocument = await OTP.create({
        user: userId,

        email,

        phoneNumber,

        otp,

        purpose,

        expiresAt: generateOTPExpiry()

    });

    return {

        otp,

        otpDocument

    };

};

/* ==========================================================
                    Verify OTP
========================================================== */

export const verifyOTP = async ({

    userId,

    otp,

    purpose

}) => {

    const otpRecord = await OTP.findOne({

        user: userId,

        otp,

        purpose,

        isUsed: false

    });

    if (!otpRecord) {

        throw new ApiError(
            400,
            "Invalid OTP"
        );

    }

    if (
        otpRecord.expiresAt < new Date()
    ) {

        throw new ApiError(
            400,
            "OTP has expired"
        );

    }

    return otpRecord;

};

/* ==========================================================
                    Delete OTP
========================================================== */

export const deleteOTP = async (
    otpId
) => {

    return await OTP.findByIdAndDelete(
        otpId
    );

};

/* ==========================================================
                    Delete All OTPs
========================================================== */

export const deleteUserOTPs = async (
    userId,
    purpose
) => {

    return await OTP.deleteMany({

        user: userId,

        purpose

    });

};

/* ==========================================================
                    Resend OTP
========================================================== */

export const resendOTP = async ({

    userId,

    email,

    phoneNumber,

    purpose

}) => {

    await deleteUserOTPs(
        userId,
        purpose
    );

    return await createOTP({

        userId,

        email,

        phoneNumber,

        purpose

  });
};

export const otpService = {
    createOTP,
    verifyOTP,
    resendOTP,
    deleteOTP,
    deleteUserOTPs,
};