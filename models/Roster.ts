import { modelOptions, prop, Ref } from "@typegoose/typegoose";
import { Patrol, Troop } from "./TroopAndPatrol";
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
  public groups!: Ref<Troop>[];

  @prop({
    required: true,
    ref: () => Patrol
  })
  public patrols!: Ref<Patrol>[];

  @prop({
    required: true,
    ref: () => User
  })
  public individuals!: Ref<User>[];
}
