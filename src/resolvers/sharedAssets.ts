import { Storage } from '@google-cloud/storage';
import { ReadStream } from 'fs-capacitor';
import { Arg, Authorized, Ctx, Field, InputType, Mutation, Resolver } from 'type-graphql';

import type { ContextType } from '../context';

const gcs = new Storage();

const bucketName = process.env.GCLOUD_STORAGE_BUCKET;
const bucket = gcs.bucket(bucketName ?? "");

function getPublicUrl(filename: string): string {
  return "https://storage.googleapis.com/" + bucketName + "/" + filename;
}

@InputType()
class Upload {
  @Field(type => String)
  filename: string;

  @Field(type => String)
  mimetype: string;

  @Field(type => String) // this is a lie i have no clue what's happening rn
  // this will throw an error or this is definitely wrong in some way shape or form
  createReadStream: (_: any) => ReadStream;
}

@Resolver()
export class SharedAssetsResolver {

  @Authorized()
  @Mutation(returns => String)
  async uploadImage(
    @Arg("file") file: Upload,
    @Ctx() ctx: ContextType,
  ): Promise<string> {
    const { createReadStream, filename, mimetype } = await file;

      const newFile = bucket.file(filename);

      await new Promise((resolves, rejects) =>
        createReadStream({
          metadata: {
            contentType: mimetype,
          },
        })
          .pipe(
            newFile.createWriteStream({
              resumable: false,
            })
          )
          .on("error", (err: any) => rejects(err)) // reject on error
          .on("finish", resolves)
      );

      const newPhoto = getPublicUrl(filename);

      await ctx.UserModel.findByIdAndUpdate(ctx.user?._id, {
        userPhoto: newPhoto,
      });

      return newPhoto;
  }
}