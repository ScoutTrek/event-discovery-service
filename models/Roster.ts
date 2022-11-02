import { Schema, Types } from "mongoose";
import { createSchema } from "ts-mongoose";

export interface IRoster {
  groups: Types.ObjectId[],
  patrols?: Types.ObjectId[],
  individuals?: Types.ObjectId[],
}

export const rosterSchema = createSchema({
  groups: [
    {
      type: Schema.Types.ObjectId,
      ref: "Troop",
      required: [
        true,
        "You must associate your event with at least one group.",
      ],
    },
  ],
  patrols: [
    {
      type: Schema.Types.ObjectId,
      ref: "Patrol",
    },
  ],
  individuals: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
},
  {
    timestamps: true,
  }
);
