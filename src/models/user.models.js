import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    // Basic Information

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    profileImage: {
      type: String,
      default: "",
    },

    profileImagePublicId: {
      type: String,
      default: "",
    },

    // Role

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Verification

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // Address

    country: String,
    state: String,
    city: String,
    timezone: String,

    // Travel Preferences

    preferences: {
      preferredCurrency: {
        type: String,
        default: "INR",
      },

      language: {
        type: String,
        default: "English",
      },

      travelStyle: {
        type: String,
        enum: [
          "Luxury",
          "Budget",
          "Adventure",
          "Business",
          "Family",
          "Solo",
          "Romantic",
        ],
        default: "Budget",
      },

      accommodationType: {
        type: String,
        enum: [
          "Hotel",
          "Hostel",
          "Apartment",
          "Villa",
          "Resort",
          "Any",
        ],
        default: "Any",
      },

      foodPreference: {
        type: String,
        enum: [
          "Veg",
          "Non-Veg",
          "Vegan",
          "Jain",
          "Halal",
          "No Preference",
        ],
        default: "No Preference",
      },

      preferredSeat: {
        type: String,
        enum: [
          "Window",
          "Middle",
          "Aisle",
        ],
        default: "Window",
      },
    },

    // Passport

    passport: {
      passportNumber: String,
      nationality: String,
      expiryDate: Date,
    },

    // Emergency Contact

    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },

    // Wishlist

    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: "Destination",
      },
    ],

    // Recent Searches

    recentSearches: [
      {
        query: String,
        destination: String,
        searchedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Notification Preferences

    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },

      push: {
        type: Boolean,
        default: true,
      },
    },

    // Security

    refreshToken: {
      type: String,
      select: false,
    },

    lastLogin: Date,

    accountStatus: {
      type: String,
      enum: [
        "active",
        "blocked",
        "suspended",
      ],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// // Indexes

// userSchema.index({email: 1,});

// userSchema.index({phoneNumber: 1,});

// Password Hashing

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// Password Verification

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(
    password,
    this.password
  );
};

// Access Token

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: this.role,
    },

    process.env.ACCESS_TOKEN_SECRET,

    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Refresh Token

userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    {
      _id: this._id,
    },

    process.env.REFRESH_TOKEN_SECRET,

    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);