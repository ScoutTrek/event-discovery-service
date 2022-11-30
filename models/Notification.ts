import { modelOptions, prop as Property } from '@typegoose/typegoose';
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
	@Property()
	public title!: string;

	@Field()
	@Property()
	public type!: string;

	@Field()
	@Property()
	public eventType!: string;

	@Field()
	@Property()
	public eventID!: string;

	@Field({nullable: true})
	createdAt?: Date;
  
	@Field({nullable: true})
	updatedAt?: Date;
}
