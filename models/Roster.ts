import { modelOptions, prop, Ref } from "@typegoose/typegoose";
import { Types } from "mongoose";
import { Troop } from "./TroopAndPatrol";
import { User } from "./User";

@modelOptions({
  schemaOptions: {
    timestamps: true
  }
})
export class Roster {
  @prop({
    required: [true, "You must associate your event with at least one group."],
    ref: () => Troop
  })
  public groups!: Ref<Troop>;

  @prop({ ref: () => Troop })
  public patrols?: Ref<Troop>;

  @prop({ ref: () => User })
  public individuals?: Ref<User>;
}
