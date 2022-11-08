import { getModelForClass } from "@typegoose/typegoose";
import { User } from "./User";
import { Patrol, Troop } from "./TroopAndPatrol";
import { Event } from "./Event";

export const UserModel = getModelForClass(User);
export const PatrolModel = getModelForClass(Patrol);
export const TroopModel = getModelForClass(Troop);
export const EventModel = getModelForClass(Event);