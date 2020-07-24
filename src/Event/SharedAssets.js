const { gql } = require("apollo-server");
const { pipeline } = require("stream");
const { authenticated, authorized } = require("../utils/Auth");

const { Storage } = require("@google-cloud/storage");

const gcs = new Storage();

const bucketName = "shared_assets";
const bucket = gcs.bucket(bucketName);

function getPublicUrl(filename) {
  return "https://storage.googleapis.com/" + bucketName + "/" + filename;
}

export const typeDefs = gql`
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
    uploadImage: authenticated(async (_, { file }, __) => {
      const { createReadStream, filename, mimetype } = await file;

      const newFile = bucket.file(filename);

      await new Promise((res) => {
        const gStream = newFile.createWriteStream({
          metadata: {
            contentType: mimetype,
          },
        });
        pipeline(createReadStream(), gStream, (err) => {
          console.log("Error ", err);
        });

        gStream.on("error", (err) => {
          console.log(err);
        });

        gStream.on("finish", () => {
          res();
        });
      });

      return getPublicUrl(filename);
    }),
  },
};
