import { Schema } from "mongoose";

export interface INotification {
  title?: string;
  type?: string;
  eventType?: string;
  eventID?: string;
}

export const notificationSchema = new Schema<INotification>(
  {
    title: String,
    type: String,
    eventType: String,
    eventID: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);
