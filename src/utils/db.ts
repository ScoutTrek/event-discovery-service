import { isDocument, isRefType, Ref } from "@typegoose/typegoose";
import { Types } from "mongoose";

export function getIdFromRef<T>(ref: Ref<T, Types.ObjectId | undefined>) : Types.ObjectId {
    if (isRefType(ref, Types.ObjectId)) {
        return ref as Types.ObjectId;
    } else if (isDocument(ref)) {
        return ref._id;
    } else {
        throw new Error();
    }
}