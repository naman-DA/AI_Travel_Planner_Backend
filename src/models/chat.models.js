import mongoose, { Schema } from "mongoose";

// Message Schema

const messageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["system", "user", "assistant", "tool"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    toolName: String,

    toolResponse: {
      type: Schema.Types.Mixed,
    },

    tokenUsage: {
      promptTokens: Number,
      completionTokens: Number,
      totalTokens: Number,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

// Extracted Preference Schema

const preferenceSchema = new Schema(
  {
    budget: Number,
    currency: {
      type: String,
      default: "INR",
    },

    destinationType: [String],
    travelStyle: String,
    foodPreference: String,
    accommodationType: String,
    transportation: String,
    preferredSeason: String,
    travelers: {
      adults: Number,
      children: Number,
      infants: Number,
    },
  },
  {
    _id: false,
  }
);

// Tool Call Schema

const toolCallSchema = new Schema(
  {
    toolName: {
      type: String,
      required: true,
    },

    provider: String,
    request: Schema.Types.Mixed,
    response: Schema.Types.Mixed,
    status: {
      type: String,
      enum: [
        "Pending",
        "Success",
        "Failed",
      ],
      default: "Success",
    },

    executionTime: Number,
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Chat Schema

const chatSchema = new Schema(
  {
    // References

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
    },

    // Conversation

    title: {
      type: String,
      default: "New Conversation",
    },

    messages: [messageSchema],

    summary: {
      type: String,
    },

    // AI Memory

    extractedPreferences: preferenceSchema,

    context: {
      destination: String,
      currentStep: String,

      planningStage: {
        type: String,
        enum: [
          "Preference Collection",
          "Destination Selection",
          "Flight Search",
          "Hotel Search",
          "Itinerary Generation",
          "Booking",
          "Completed",
        ],
        default: "Preference Collection",
      },
    },

    // Tool Calls

    toolCalls: [toolCallSchema],

    // AI Metadata

    aiProvider: {
      type: String,
      enum: [
        "Gemini",
        "OpenAI",
        "Claude",
        "Groq",
        "Other",
      ],
      default: "Gemini",
    },

    model: {
      type: String,
      default: "gemini-2.5-flash",
    },

    totalTokens: {
      type: Number,
      default: 0,
    },

    totalCost: {
      type: Number,
      default: 0,
    },

    // Status

    status: {
      type: String,
      enum: [
        "Active",
        "Archived",
      ],
      default: "Active",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

  },
  {
    timestamps: true,
  }
);

// Indexes

// chatSchema.index({user: 1, lastMessageAt: -1,});
// chatSchema.index({trip: 1,});
// chatSchema.index({status: 1,});

// Middleware

chatSchema.pre("save", function (next) {
  this.lastMessageAt = new Date();
  next();
});

// Model

export const Chat = mongoose.model("Chat", chatSchema);