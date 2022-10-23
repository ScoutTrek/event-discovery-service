import { Schema, Types } from "mongoose";

export interface IRoster {
  groups: {
    type: Types.ObjectId;
    ref: string;
    required: [boolean, string];
  }[];
  patrols: {
    type: Types.ObjectId;
    ref: string;
  }[];
  individuals: {
    type: Types.ObjectId;
    ref: string;
  }[];
}

export const rosterSchema = new Schema<IRoster>({
  groups: [
    {
      type: Types.ObjectId,
      ref: "Troop",
      required: [
        true,
        "You must associate your event with at least one group.",
      ],
    },
  ],
  patrols: [
    {
      type: Types.ObjectId,
      ref: "Patrol",
    },
  ],
  individuals: [
    {
      type: Types.ObjectId,
      ref: "User",
    },
  ],
},
  {
    timestamps: true,
  }
);
