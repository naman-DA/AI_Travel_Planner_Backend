import mongoose, { Schema } from "mongoose";

/* ==========================================================
                    Reusable Schemas
========================================================== */

// Attraction Schema
const attractionSchema = new Schema(
  {
    name: String,

    category: String,

    description: String,

    rating: Number,

    estimatedVisitTime: String,

    entryFee: Number,

    location: String,

    image: String,
  },
  {
    _id: false,
  }
);

// Restaurant Schema
const restaurantSchema = new Schema(
  {
    name: String,

    cuisine: String,

    rating: Number,

    priceRange: String,

    address: String,

    openingHours: String,
  },
  {
    _id: false,
  }
);

// Hotel Schema
const hotelSchema = new Schema(
  {
    name: String,

    stars: Number,

    rating: Number,

    priceRange: String,

    amenities: [String],
  },
  {
    _id: false,
  }
);

// Airport Schema
const airportSchema = new Schema(
  {
    airportName: String,

    airportCode: String,

    distance: Number,
  },
  {
    _id: false,
  }
);

/* ==========================================================
                    Destination Schema
========================================================== */

const destinationSchema = new Schema(

  {

    // ======================================================
    // Basic Information
    // ======================================================

    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    continent: String,

    destinationCode: {
      type: String,
      unique: true,
      uppercase: true,
    },

    // ======================================================
    // Description
    // ======================================================

    description: {
      type: String,
      trim: true,
    },

    // ======================================================
    // Destination Categories
    // ======================================================

    destinationType: [

      {

        type: String,

        enum: [

          "Beach",

          "Mountain",

          "Hill Station",

          "City",

          "Adventure",

          "Wildlife",

          "Desert",

          "Forest",

          "Island",

          "Snow",

          "Religious",

          "Historical",

          "Luxury",

          "Nature"

        ]

      }

    ],

    // ======================================================
    // Geo Location
    // ======================================================

    location: {

      type: {

        type: String,

        enum: ["Point"],

        default: "Point"

      },

      coordinates: {

        type: [Number], // [longitude, latitude]

        required: true

      }

    },

    timezone: String,

    nearbyAirports: [airportSchema],

    // ======================================================
    // Climate
    // ======================================================

    climate: {

      averageTemperature: Number,

      summerSeason: String,

      winterSeason: String,

      rainySeason: String

    },

    bestMonths: [

      String

    ],

    // ======================================================
    // Budget
    // ======================================================

    averageDailyBudget: {

      budget: Number,

      midRange: Number,

      luxury: Number

    },

    currency: {

      type: String,

      default: "INR"

    },

    // ======================================================
    // Activities
    // ======================================================

    popularActivities: [

      String

    ],

    famousFor: [

      String

    ],

    // ======================================================
    // Suitable For
    // ======================================================

    suitableFor: [

      {

        type: String,

        enum: [

          "Solo",

          "Couple",

          "Family",

          "Friends",

          "Business",

          "Honeymoon"

        ]

      }

    ],

    travelStyles: [

      {

        type: String,

        enum: [

          "Budget",

          "Luxury",

          "Adventure",

          "Backpacking",

          "Relaxation",

          "Business"

        ]

      }

    ],

    // ======================================================
    // Attractions
    // ======================================================

    attractions: [attractionSchema],

    // ======================================================
    // Restaurants
    // ======================================================

    restaurants: [restaurantSchema],

    // ======================================================
    // Hotels
    // ======================================================

    hotels: [hotelSchema],

    // ======================================================
    // Transport
    // ======================================================

    transportation: {

      airportTransfer: Boolean,

      metro: Boolean,

      bus: Boolean,

      taxi: Boolean,

      bikeRental: Boolean

    },

    // ======================================================
    // Travel Information
    // ======================================================

    visaRequired: {

      type: Boolean,

      default: false

    },

    languages: [

      String

    ],

    emergencyContacts: {

      police: String,

      ambulance: String,

      fire: String,

      touristHelpline: String

    },

    // ======================================================
    // AI Scores
    // ======================================================

    aiScores: {

      family: {

        type: Number,

        default: 0

      },

      solo: {

        type: Number,

        default: 0

      },

      honeymoon: {

        type: Number,

        default: 0

      },

      adventure: {

        type: Number,

        default: 0

      },

      luxury: {

        type: Number,

        default: 0

      },

      budget: {

        type: Number,

        default: 0

      }

    },

    // ======================================================
    // Ratings
    // ======================================================

    averageRating: {

      type: Number,

      default: 0,

      min: 0,

      max: 5

    },

    popularityScore: {

      type: Number,

      default: 0

    },

    // ======================================================
    // Images
    // ======================================================

    images: [

      {

        url: String,

        caption: String

      }

    ],

    // ======================================================
    // Status
    // ======================================================

    isActive: {

      type: Boolean,

      default: true

    }

  },

  {

    timestamps: true

  }

);

/* ==========================================================
                    Indexes
========================================================== */

destinationSchema.index({
  location: "2dsphere",
});

destinationSchema.index({
  country: 1,
  city: 1,
});

destinationSchema.index({
  destinationType: 1,
});

destinationSchema.index({
  popularityScore: -1,
});

/* ==========================================================
                    Model
========================================================== */

export const Destination = mongoose.model(
  "Destination",
  destinationSchema
);