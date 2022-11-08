import { prop } from "@typegoose/typegoose";
import type { Ref } from "@typegoose/typegoose";
import { Roster } from "./Roster";
import { Troop, Patrol } from "./TroopAndPatrol";
import { User } from "./User";

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export class Point {
  @prop({ required: true, enum: ["Point"] as const })
  public type!: string;

  @prop({ required: true, type: () => [Number] })
  public coordinates!: number[];

  @prop()
  public address?: string;
}

export class MessageUser {
  @prop({ required: true })
  public name!: string;
}

export class Message {
  @prop()
  public text?: string;

  @prop()
  public image?: string;

  @prop({ default: Date.now })
  public createdAt?: Date;

  @prop()
  public user?: MessageUser;
}

export class Event {
  @prop({ required: true })
  public type!: string;

  @prop({ required: true, ref: () => Troop })
  public troop!: Ref<Troop>;

  @prop({ required: true, ref: () => Patrol })
  public patrol!: Ref<Patrol>;

  @prop({ required: [true, "An event cannot have a blank title."] })
  public title!: string;

  @prop()
  public description?: string;

  @prop()
  public date?: Date;

  @prop()
  public startTime?: Date;

  @prop()
  public uniqueMeetLocation?: string;

  @prop()
  public meetTime?: Date;

  @prop()
  public leaveTime?: Date;

  @prop()
  public pickupTime?: Date;

  @prop()
  public endTime?: Date;

  @prop()
  public location?: Point;

  @prop()
  public meetLocation?: Point;

  @prop({ required: true, type: () => [Message], default: [] })
  public messages!: Message[];

  @prop()
  public invited?: Roster;

  @prop()
  public attending?: Roster;

  @prop({ enum: DAYS_OF_WEEK })
  public day?: string;

  @prop()
  public distance?: number;

  @prop()
  public shakedown?: boolean;

  @prop()
  public published?: boolean;

  @prop({ ref: () => User })
  public creator?: Ref<User>;

  @prop()
  public notification?: Date;

  /**
   * TODO
   */
  public get time(): string {
    let date = new Date(this.date ?? Date.now());
    const formattedDate = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    return formattedDate;
  }
}
