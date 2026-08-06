import mongoose, { Schema } from "mongoose";

// Reusable Schemas

// Flight Schema

const flightSchema = new Schema(
  {
    provider: String,

    airline: String,

    flightNumber: String,

    departureAirport: String,

    arrivalAirport: String,

    departureTime: Date,

    arrivalTime: Date,

    duration: String,

    cabinClass: String,

    baggage: String,

    stops: Number,

    price: Number,

    currency: {
      type: String,
      default: "INR",
    },

    bookingURL: String,
  },
  { _id: false }
);

// Hotel Schema

const hotelSchema = new Schema(
  {
    provider: String,

    hotelName: String,

    rating: Number,

    address: String,

    latitude: Number,

    longitude: Number,

    roomType: String,

    checkIn: Date,

    checkOut: Date,

    amenities: [String],

    pricePerNight: Number,

    totalPrice: Number,

    bookingURL: String,
  },
  { _id: false }
);

// Activity Schema

const activitySchema = new Schema(
  {
    name: String,

    category: String,

    description: String,

    location: String,

    latitude: Number,

    longitude: Number,

    startTime: String,

    endTime: String,

    duration: String,

    estimatedCost: Number,

    bookingRequired: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Weather Schema

const weatherSchema = new Schema(
  {
    date: Date,

    temperature: Number,

    feelsLike: Number,

    humidity: Number,

    windSpeed: Number,

    condition: String,

    icon: String,
  },
  { _id: false }
);

// Meal Schema

const mealSchema = new Schema(
  {
    breakfast: String,

    lunch: String,

    dinner: String,
  },
  { _id: false }
);

// Transport Schema

const transportSchema = new Schema(
  {
    mode: String,

    from: String,

    to: String,

    estimatedCost: Number,
  },
  { _id: false }
);

// Daily Plan Schema

const dailyPlanSchema = new Schema(
  {
    day: Number,

    date: Date,

    activities: [activitySchema],

    meals: mealSchema,

    transportation: transportSchema,

    estimatedCost: Number,
  },
  { _id: false }
);

// Location Schema

const locationSchema = new Schema(
  {
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
    },

    airportCode: {
      type: String,
      uppercase: true,
      trim: true,
    },

    latitude: Number,

    longitude: Number,

    address: String,
  },
  {
    _id: false,
  }
);

// Trip Schema

const tripSchema = new Schema(
  {
    // User

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Trip Details

    tripTitle: {
        type: String,
        trim: true,
        default: function () {
          return `${this.destination.city} Trip`;
        }
    },

    tripType: {
      type: String,
      enum: ["AI", "Manual"],
      default: "AI",
    },

    aiPrompt: {
      type: String,
      trim: true,
    },

    source: {
      type: locationSchema,
      required: true,
    },

    destination: {
      type: locationSchema,
      required: true,
    },

    destinationRef: {
      type: Schema.Types.ObjectId,
      ref: "Destination",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    duration: Number,

    // Travellers

    travelers: {
      adults: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
      },

      children: {
        type: Number,
        default: 0,
        min: 0,
      },

      infants: {
        type: Number,
        default: 0,
        min: 0,        
      },
    },

    // Budget

    budget: {

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
            default: "INR",
        },

        estimatedBreakdown: {

            flights: {
                type: Number,
                default: 0,
            },

            hotels: {
                type: Number,
                default: 0,
            },

            food: {
                type: Number,
                default: 0,
            },

            transportation: {
                type: Number,
                default: 0,
            },

            activities: {
                type: Number,
                default: 0,
            },

            miscellaneous: {
                type: Number,
                default: 0,
            },

            total: {
                type: Number,
                default: 0,
            }

        }

    },

    //  User Preferences

    preferences: {

      accommodation: String,

      transportation: String,

      foodPreference: String,

      travelStyle: String,

      destinationType: String,

      preferredWeather: String,

    },

    // Flights

    flightOptions: [flightSchema],

    selectedFlight: flightSchema,

    // Hotels

    hotelOptions: [hotelSchema],

    selectedHotel: hotelSchema,

    // Weather Forecast

    weatherForecast: [weatherSchema],

    // AI Generated Daily Itinerary

    dailyPlans: [dailyPlanSchema],

    // Booking Links

    bookingLinks: {

      flight: String,

      hotel: String,

      package: String,

    },

    // Estimated Cost Summary

    estimatedCost: {

      flights: {
        type: Number,
        default: 0,
      },

      hotels: {
        type: Number,
        default: 0,
      },

      food: {
        type: Number,
        default: 0,
      },

      transportation: {
        type: Number,
        default: 0,
      },

      activities: {
        type: Number,
        default: 0,
      },

      miscellaneous: {
        type: Number,
        default: 0,
      },

      total: {
        type: Number,
        default: 0,
      },

    },

    // AI Metadata

    aiMetadata: {

      modelUsed: {
        type: String,
        default: "gemini",
      },

      generatedAt: Date,

      regeneratedCount: {
        type: Number,
        default: 0,
      },

      promptTokens: Number,

      completionTokens: Number,

    },

    // Booking Status

    bookingStatus: {

      type: String,

      enum: [

        "planning",

        "partially_booked",

        "booked",

        "completed",

        "cancelled",

      ],

      default: "planning",

    },

    // Trip Status

    status: {

      type: String,

      enum: [

        "draft",

        "upcoming",

        "ongoing",

        "completed",

        "cancelled",

      ],

      default: "draft",

    },

    // Visibility

    isPublic: {

      type: Boolean,

      default: false,

    },

    // User Notes

    notes: {

      type: String,

      trim: true,

    },

  },

  {

    timestamps: true,

  }

);

// Indexes

tripSchema.index({
  user: 1,
  createdAt: -1,
});

tripSchema.index({
  "destination.country": 1,
  "destination.city": 1,
});

tripSchema.index({
  startDate: 1,
  endDate: 1,
});

tripSchema.index({
  bookingStatus: 1,
});

tripSchema.index({
  status: 1,
});

// Model

export const Trip = mongoose.model(
  "Trip",
  tripSchema
);