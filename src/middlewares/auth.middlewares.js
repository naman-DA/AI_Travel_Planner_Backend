import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Verify JWT Middleware

export const verifyJWT = asyncHandler(async(req, _, next) => {
  try{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if(!token){
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if(!user){
      throw new ApiError(401, "Invalid Access Token");
    }

    // Account Status Check

    if(user.accountStatus !== "active"){
      throw new ApiError(403, "Your account is currently inactive");
    }

    // Email verification

    if(user.email && !user.isEmailVerified){
      throw new ApiError(403, "Please verify your email first");
    }

    // Phone number verification

    if(user.phoneNumber && !user.isPhoneVerified){
      throw new ApiError(403, "Please verify your phone number first");
    }

    req.user = user;
    next()
  }

  catch(error){
    throw new ApiError(401, error?.message || "Invalid access token")
  }
});