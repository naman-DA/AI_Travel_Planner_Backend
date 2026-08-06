import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { otpService } from "../services/otp.services.js";
import { emailService } from "../services/email.services.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary
} from "../utils/cloudinary.js";

// Generate Access and Refresh tokens

const generateAccessAndRefreshTokens = async (userId) => {
  try{
    const user = await User.findById(userId).select("+refreshToken");

    if(!user){
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    await user.save({validateBeforeSave: false,});

    return {
      accessToken,
      refreshToken,
    };
  }

  catch(error){
    throw new ApiError(500, "Failed to generate authentication tokens");
  }
};

// Register User

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, password } = req.body;

  // Validation

  if(!fullName?.trim()){
    throw new ApiError(400, "Full name is required");
  }

  if(!email && !phoneNumber){
    throw new ApiError(400, "Email or phone number is required");
  }

  if(!password){
    throw new ApiError(400, "Password is required"); 
  }

  // Strong Password Validation

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

  if(!passwordRegex.test(password)){
    throw new ApiError(400, "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.");
  }

  // Existing User

  let existingUser = null;

  if(email){
    existingUser = await User.findOne({ email: email.toLowerCase(), });
  }

  if(!existingUser && phoneNumber){
    existingUser = await User.findOne({ phoneNumber, });
  }

  if(existingUser){
    if(email && existingUser.email === email.toLowerCase()){
      throw new ApiError(409, "Email is already registered");
    }

    if(phoneNumber && existingUser.phoneNumber === phoneNumber){
      throw new ApiError(409, "Phone number is already registered");
    }
  }

  // Create User

  const user = await User.create({
    fullName,
    email: email?.toLowerCase(),
    phoneNumber,
    password
  });
  
  // Generate OTP

  const { otp } = await otpService.createOTP({

      userId: user._id,

      email: user.email,

      phoneNumber: user.phoneNumber,

      purpose: "REGISTER"

  });

  console.log("Registration OTP :", otp);

  // TODO
  // Send OTP

    await emailService.sendOTP({
        email: user.email,
        otp,
        purpose: "Registration"
    });
    
    // Response

    return res.status(201).json(
        new ApiResponse(
            201, 
            {
                userId: user._id,
                email: user.email,
                phoneNumber: user.phoneNumber
            },

            "Registration successful. Please verify OTP."
        )
    );
});

// Verify OTP

const verifyOTP = asyncHandler(async (req, res) => {

    const { email, phoneNumber, otp } = req.body;

    if ((!email && !phoneNumber) || !otp) {
        throw new ApiError(
            400,
            "Email/Phone Number and OTP are required"
        );
    }

    const user = await User.findOne({
        $or: [
            ...(email ? [{ email: email.toLowerCase() }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : [])
        ]
    });

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    const otpRecord = await otpService.verifyOTP({

        userId: user._id,

        otp,

        purpose: "REGISTER"

    });

    if (user.email && !user.isEmailVerified) {
        user.isEmailVerified = true;
    }

    if (user.phoneNumber && !user.isPhoneVerified) {
        user.isPhoneVerified = true;
    }

    await user.save({
        validateBeforeSave: false,
    });

    otpRecord.isUsed = true;

    await otpRecord.save({
        validateBeforeSave: false
    });

    return res.status(200).json(

        new ApiResponse(

            200,

            {},

            "Account verified successfully"

        )

    );

});  

// Resend OTP

const resendOTP = asyncHandler(async (req, res) => {

    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        throw new ApiError(
            400,
            "Email or Phone Number is required"
        );
    }

    const user = await User.findOne({
        $or: [
            ...(email ? [{ email: email.toLowerCase() }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : [])
        ]
    });

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    const { otp } = await otpService.resendOTP({

        userId: user._id,

        email: user.email,

        phoneNumber: user.phoneNumber,

        purpose: "REGISTER"

    });

    console.log("Resent OTP:", otp);

    await emailService.sendOTP({
        email: user.email,
        otp,
        purpose: "Registration"
    });

    return res.status(200).json(

        new ApiResponse(

            200,

            {},

            "OTP sent successfully"

        )

    );

});

// Login User

const loginUser = asyncHandler(async (req, res) => {

    const { email, phoneNumber, password } = req.body;

    if ((!email && !phoneNumber) || !password) {
        throw new ApiError(
            400,
            "Email/Phone Number and Password are required"
        );
    }

    const user = await User.findOne({

        $or: [

            ...(email ? [{ email: email.toLowerCase() }] : []),

            ...(phoneNumber ? [{ phoneNumber }] : [])

        ]

    }).select("+password +refreshToken");

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    if (user.accountStatus !== "active") {
        throw new ApiError(
            403,
            "Your account is inactive"
        );
    }

    if (
        (user.email && !user.isEmailVerified) ||
        (user.phoneNumber && !user.isPhoneVerified)
    ) {
        throw new ApiError(
            403,
            "Please verify your account before logging in."
        );
    }

    const isPasswordCorrect =
        await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(
            401,
            "Invalid credentials"
        );
    }

    const {
        accessToken,
        refreshToken
    } = await generateAccessAndRefreshTokens(
        user._id
    );

    await User.findByIdAndUpdate(
        user._id,
        {
            lastLogin: new Date(),
        }
    );

    const cookieOptions = {

        httpOnly: true,

        secure: process.env.NODE_ENV === "production",

        sameSite: "strict",

        maxAge: 7 * 24 * 60 * 60 * 1000

    };

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie(
            "accessToken",
            accessToken,
            cookieOptions
        )
        .cookie(
            "refreshToken",
            refreshToken,
            cookieOptions
        )
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "Login successful"
            )
        );

});

// Logout User

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
    req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        {
            new: true
        }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    };

    return res.status(200)
    .clearCookie(
        "accessToken",
        cookieOptions
    )
    .clearCookie(
        "refreshToken",
        cookieOptions
    )
    .json(
        new ApiResponse(
            200,
            {},
            "Logout successful"
        )
    );
});

// Refresh Access Token

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        
        const user = await User.findById(decodedToken._id).select("+refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token expired");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        };

        return res.status(200)
        .cookie(
            "accessToken",
            accessToken,
            cookieOptions
        )
        .cookie(
            "refreshToken",
            refreshToken,
            cookieOptions
        )
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken
                },
                "Access token refreshed successfully"
            )
        );
    }

    catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// Forgot Password

const forgotPassword = asyncHandler(async (req, res) => {
    const {
        email,

        phoneNumber

    } = req.body;

    if (!email && !phoneNumber) {

        throw new ApiError(

            400,

            "Email or Phone Number is required"

        );

    }

    const user = await User.findOne({

        $or: [

            ...(email
                ? [{ email: email.toLowerCase() }]
                : []),

            ...(phoneNumber
                ? [{ phoneNumber }]
                : [])

        ]

    });

    if (!user) {

        throw new ApiError(

            404,

            "User not found"

        );

    }

    const { otp } = await otpService.createOTP({

        userId: user._id,

        email: user.email,

        phoneNumber: user.phoneNumber,

        purpose: "FORGOT_PASSWORD"

    });

    console.log(

        "Forgot Password OTP:",

        otp

    );

    await emailService.sendForgotPasswordEmail({
        email: user.email,
        otp
    });

    return res.status(200).json(

        new ApiResponse(

            200,

            {},

            "OTP sent successfully"

        )
    );
});

// Verify Forgot Password OTP

const verifyForgotPasswordOTP = asyncHandler(async (req, res) => {

    const { email, phoneNumber, otp } = req.body;

    if ((!email && !phoneNumber) || !otp) {
        throw new ApiError(
            400,
            "Email/Phone Number and OTP are required"
        );
    }

    const user = await User.findOne({
        $or: [
            ...(email ? [{ email: email.toLowerCase() }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : [])
        ]
    });

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    const otpRecord = await otpService.verifyOTP({

        userId: user._id,

        otp,

        purpose: "FORGOT_PASSWORD"

    });

    await otpService.deleteOTP(
        otpRecord._id
    );

    const resetToken = jwt.sign(
        {
            _id: user._id,
            purpose: "RESET_PASSWORD"
        },
        process.env.RESET_PASSWORD_SECRET,
        {
            expiresIn: "10m"
        }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                resetToken
            },
            "OTP verified successfully"
        )
    );
});

// Reset Password

const resetPassword = asyncHandler(async (req, res) => {
    const {
        resetToken,
        newPassword,
        confirmPassword
    } = req.body;

    if (!resetToken) {
        throw new ApiError(
            400,
            "Reset token is required"
        );

    }

    if (!newPassword || !confirmPassword) {
        throw new ApiError(
            400,
            "Both password fields are required"
        );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
        throw new ApiError(
            400,
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."
        );
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(
            400,
            "Passwords do not match"
        );
    }

    const decodedToken = jwt.verify(
        resetToken,
        process.env.RESET_PASSWORD_SECRET
    );

    const user = await User.findById(decodedToken._id).select("+password +refreshToken");

    if (!user) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    user.password = newPassword;
    user.refreshToken = undefined;

    await user.save();

    await otpService.deleteUserOTPs(
        user._id,
        "FORGOT_PASSWORD"
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password reset successfully"
        )
    );
});

// Change current Password

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {
        oldPassword,
        newPassword,
        confirmPassword
    } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(
            400,
            "All password fields are required"
        );
    }

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            throw new ApiError(
                400,
                "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."
            );
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(
            400,
            "Passwords do not match"
        );
    }

    const user = await User.findById(req.user._id).select("+password");

    const isPasswordCorrect =
        await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(
            401,
            "Old password is incorrect"
        );
    }

    user.password = newPassword;

    await user.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    );
});

// Update Account details

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {
        fullName,
        country,
        state,
        city,
        timezone,
        preferences,
        passport,
        emergencyContact,
        profileImage
    } = req.body;

    const updateFields = {};

    if (fullName !== undefined) {
        if (!fullName.trim()) {
            throw new ApiError(
                400,
                "Full name cannot be empty"
            );
        }

        updateFields.fullName = fullName.trim();
    } 

    if (country !== undefined) updateFields.country = country;
    if (state !== undefined) updateFields.state = state;
    if (city !== undefined) updateFields.city = city;
    if (timezone !== undefined) updateFields.timezone = timezone;
    if (preferences !== undefined) updateFields.preferences = preferences;
    if (passport !== undefined) updateFields.passport = passport;
    if (emergencyContact !== undefined) updateFields.emergencyContact = emergencyContact;
    if (profileImage !== undefined) updateFields.profileImage = profileImage;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: updateFields
        },
        {
            new: true,
            runValidators: true
        }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser,
            "Profile updated successfully"
        )
    );

});

// Get current user

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully"
        )
    );
});

// Upload Profile Image

const uploadProfileImage = asyncHandler(async (req, res) => {
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);

    if (!req.file) {
        throw new ApiError(400, "Profile image is required");
    }

    const cloudinaryResponse = await uploadOnCloudinary(
        req.file.path,
        "ai-travel-planner/profile-images"
    );

    if (!cloudinaryResponse) {
        throw new ApiError(500, "Failed to upload profile image");
    }

    const user = await User.findById(req.user._id);

    // Delete old image if it exists

    if (user.profileImagePublicId) {
        await deleteFromCloudinary(user.profileImagePublicId);
    }

    user.profileImage = cloudinaryResponse.secure_url;

    user.profileImagePublicId =
        cloudinaryResponse.public_id;

    await user.save({
        validateBeforeSave: false,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                profileImage: user.profileImage,
            },
            "Profile image uploaded successfully"
        )
    );
});

export {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    logoutUser,
    refreshAccessToken,
    forgotPassword,
    verifyForgotPasswordOTP,
    resetPassword,
    changeCurrentPassword,
    updateAccountDetails,
    getCurrentUser,
    uploadProfileImage,
};