import mongoose from "mongoose";

export const rosterSchema = mongoose.Schema(
  {
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Troop",
        required: [
          true,
          "You must associate your event with at least one group.",
        ],
      },
    ],
    patrols: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patrol",
        type: String,
      },
    ],
    individuals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);
