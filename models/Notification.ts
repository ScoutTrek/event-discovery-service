import { modelOptions, prop } from "@typegoose/typegoose";

@modelOptions({
	schemaOptions: {
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
		timestamps: true
	}
})
export class Notification {
	@prop()
	public title?: string;

	@prop()
	public type?: string;

	@prop()
	public eventType?: string;

	@prop()
	public eventID?: string;
}