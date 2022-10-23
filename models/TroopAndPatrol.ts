import { Schema, Types, model } from "mongoose";

import { IPoint, pointSchema } from "./Event";

export interface IMembership {
  troopID: {
    type: Types.ObjectId;
    ref: string;
  };
  troopNumber: {
    type: string;
  };
  patrolID: {
    type: Types.ObjectId;
    ref: string;
  };
  role: {
    type: string;
    enum: "SCOUTMASTER"
    | "ASST_SCOUTMASTER"
    | "SENIOR_PATROL_LEADER"
    | "ASST_PATROL_LEADER"
    | "PATROL_LEADER"
    | "SCOUT"
    | "PARENT"
    | "ADULT_VOLUNTEER";
  }
}

export const membershipSchema = new Schema<IMembership>({
  troopID: {
    type: Types.ObjectId,
    ref: "Troop",
  },
  troopNumber: {
    type: String,
  },
  patrolID: {
    type: Schema.Types.ObjectId,
    ref: "Patrol",
  },
  role: {
    type: String,
    enum: [
      "SCOUTMASTER",
      "ASST_SCOUTMASTER",
      "SENIOR_PATROL_LEADER",
      "ASST_PATROL_LEADER",
      "PATROL_LEADER",
      "SCOUT",
      "PARENT",
      "ADULT_VOLUNTEER",
    ],
  },
});

export interface IPatrol {
  name: {
    type: string;
    required: boolean;
  };
  members: {
    type: Types.ObjectId[];
    ref: string;
  };
  events: {
    type: Types.ObjectId[];
    ref: string;
  };
}

const patrolSchema = new Schema<IPatrol>({
  name: {
    type: String,
    required: true,
  },
  members: {
    type: [Schema.Types.ObjectId],
    ref: "User",
  },
  events: {
    type: [Schema.Types.ObjectId],
    ref: "Event",
  },
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

export interface ITroop {
  council: {
    type: string;
    required: boolean;
  };
  state: {
    type: string;
    required: boolean;
  };
  unitNumber: {
    type: number;
    required: boolean;
  };
  city: string;
  scoutMaster: string;
  meetLocation: IPoint;
  patrols: IPatrol[];
  events: {
    type: Types.ObjectId;
    ref: string;
  };
}

const troopSchema = new Schema<ITroop>({
  council: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  unitNumber: {
    type: Number,
    required: true,
  },
  city: String,
  scoutMaster: String,
  meetLocation: pointSchema,
  patrols: [patrolSchema],
  events: {
    type: [Schema.Types.ObjectId],
    ref: "Event",
  },
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

export const Patrol = model("Patrol", patrolSchema);
const Troop = model("Troop", troopSchema);

export default Troop;
