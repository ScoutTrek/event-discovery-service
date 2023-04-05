import { isDocument, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";

// Converts a Ref to a Document if it is populated, throws an error otherwise
export function getDocument<T>(ref: Ref<T, mongoose.Types.ObjectId>): T {
    if (isDocument(ref)) {
        return ref;
    } else {
        throw new Error("Docment not populated!");
    }
}

// Converts Refs to a Documents if they are all populated, throws an error otherwise
export function getDocuments<T>(refs: Ref<T, mongoose.Types.ObjectId>[]): T[] {
    return refs.map(getDocument);
}
