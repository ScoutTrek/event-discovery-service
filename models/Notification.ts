import { modelOptions, prop } from '@typegoose/typegoose';
import mongoose from 'mongoose';
import { Field, ID, ObjectType } from 'type-graphql';

@modelOptions({
	schemaOptions: {
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		timestamps: true
	}
})
@ObjectType()
export class Notification {
	@Field(type => ID, {name: "id"})
	readonly _id: mongoose.Types.ObjectId;

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
