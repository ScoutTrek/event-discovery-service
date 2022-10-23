import { Schema, Types, model, StringExpression } from "mongoose";
import { IRoster, rosterSchema } from "./Roster";

export interface IPoint {
  type: {
    type: string;
    enum: string[];
    required: boolean;
  },
  coordinates: {
    type: number[];
    required: boolean;
  },
  address: {
    type: string;
  }
}

export const pointSchema = new Schema<IPoint>({
  type: {
    type: String,
    enum: ["Point"],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
  address: {
    type: String,
  },
});

export interface IMessageUser {
  name: {
    type: string;
    required: boolean
  }
}

export const messageUserSchema = new Schema<IMessageUser>({
  name: {
    type: String,
    required: true,
  },
});

export interface IMessage {
  text: {
    type: string;
  },
  image: {
    type: string;
  },
  createdAt: {
    type: Date;
    default: number;
  },
  user: IMessageUser;
}

export const messageSchema = new Schema<IMessage>({
  text: {
    type: String,
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: messageUserSchema,
});

interface IEvent {
  type: {
    type: string;
    required: boolean;
  };
  troop: {
    type: Types.ObjectId;
    ref: string;
    required: boolean;
  };
  patrol: {
    type: Types.ObjectId;
    ref: string;
    required: boolean;
  };
  title: {
    type: string;
    required: [boolean, string];
  };
  description: string;
  date: Date;
  endDate: Date;
  startTime: Date;
  uniqueMeetLocation: string;
  meetTime: Date;
  leaveTime: Date;
  pickupTime: Date;
  endTime: Date;
  location: IPoint;
  meetLocation: IPoint;
  messages: IMessage[];
  invited: IRoster;
  attending: IRoster;
  day: {
    type: string;
    enum: "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  };
  distance: number;
  shakedown: boolean;
  published: boolean;
  creator: {
    type: Types.ObjectId;
    ref: string;
  };
  notification: Date;
}

const eventSchema = new Schema<IEvent>({
  type: {
    type: String,
    required: true,
  },
  troop: {
    type: Types.ObjectId,
    ref: "Troop",
    required: true,
  },
  patrol: {
    type: Types.ObjectId,
    ref: "Patrol",
    required: true,
  },
  title: {
    type: String,
    required: [true, "An event cannot have a blank title."],
  },
  description: String,
  date: Date,
  endDate: Date,
  startTime: Date,
  uniqueMeetLocation: String,
  meetTime: Date,
  leaveTime: Date,
  pickupTime: Date,
  endTime: Date,

  location: pointSchema,
  meetLocation: pointSchema,
  messages: [messageSchema],
  invited: rosterSchema,
  attending: rosterSchema,
  day: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
  },
  distance: Number,
  shakedown: Boolean,
  published: Boolean,
  creator: {
    type: Types.ObjectId,
    ref: "User",
  },
  notification: Date,
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

eventSchema.virtual("time").get(function (this: IEvent) {
  let date = new Date(this.date);
  const formattedDate =
    date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  return formattedDate;
});

const Event = model("Event", eventSchema);

export default Event;
