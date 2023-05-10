import { getClass } from '@typegoose/typegoose';
import { Document } from 'mongoose';
import { MiddlewareFn } from 'type-graphql';

export const TypegooseMiddleware: MiddlewareFn = async (_, next) => {
  const result = await next();

  if (Array.isArray(result)) {
    return result.map(item => (item instanceof Document ? convertDocument(item) : item));
  }

  if (result instanceof Document) {
    return convertDocument(result);
  }

  return result;
};

function convertDocument(doc: Document) {
  const convertedDocument = doc.toObject();
  const DocumentClass = getClass(doc)!;
  Object.setPrototypeOf(convertedDocument, DocumentClass.prototype);
  return convertedDocument;
}