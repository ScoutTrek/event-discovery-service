const { gql } = require("apollo-server-express");
const { authenticated, authorized } = require("../utils/Auth");

const { Storage } = require("@google-cloud/storage");

const gcs = new Storage();

const bucketName = process.env.GCLOUD_STORAGE_BUCKET;
const bucket = gcs.bucket(bucketName);

function getPublicUrl(filename) {
  return "https://storage.googleapis.com/" + bucketName + "/" + filename;
}

export const typeDefs = gql`
  scalar Upload
  enum ASSET_TYPE {
    FILE
    IMAGE
  }
  type Asset {
    type: ASSET_TYPE!
    path: String!
    filename: String!
    mimetype: String!
  }
  input AddMetadataInput {
    type: ASSET_TYPE!
    name: String!
    extension: String!
  }
  extend type Mutation {
    uploadImage(file: Upload!): String
  }
`;

export const resolvers = {
  Mutation: {
    uploadImage: authenticated(async (_, { file }, { user, User }) => {
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
          .on("error", (err) => rejects(err)) // reject on error
          .on("finish", resolves)
      );

      const newPhoto = getPublicUrl(filename);

      await User.findByIdAndUpdate(user.id, {
        userPhoto: newPhoto,
      });

      return newPhoto;
    }),
  },
};
