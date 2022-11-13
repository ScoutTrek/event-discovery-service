import { modelOptions, prop } from "@typegoose/typegoose";
import { Field, ID, ObjectType } from "type-graphql";
import { ObjectId } from "mongodb"

@modelOptions({
	schemaOptions: {
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		timestamps: true
	}
})
@ObjectType()
export class Notification {
	@Field(type => ID)
	readonly _id: ObjectId;

	@Field()
	@prop()
	public title!: string;

	@Field()
	@prop()
	public type!: string;

	@prop()
	public eventType!: string;

	@Field()
	@prop()
	public eventID!: string;
}
