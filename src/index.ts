import { expressMiddleware } from '@apollo/server/express4';
import { json } from 'body-parser';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { Storage } from '@google-cloud/storage';

import contextFn from './context';
import apolloServer from './server';
import * as authFns from '../src/utils/Auth';
import { UserModel } from '../models/models';

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

const gcs = new Storage();
const bucketName = process.env.GCLOUD_STORAGE_BUCKET;
const bucket = gcs.bucket(bucketName ?? "");

function getPublicUrl(filename: string): string {
  return "https://storage.googleapis.com/" + bucketName + "/" + filename;
}

async function startServer() {
  let server = await apolloServer;
  if (server === undefined) {
    return;
  }
  await server.start();

  const app = express();
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: contextFn,
    })
  );

  const port = process.env.PORT || 4000;

  app.post("/upload", upload.single('photo'), async (req, res) => {
    const token = authFns.getTokenFromReq(req);
    if (!token) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    const user = await authFns.getUserFromToken(token);
    if (!user) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).send({ message: "Please upload a file!" });
    }
    try {
      const filename = req.file.originalname;
      const newFile = bucket.file(filename);
      await new Promise((resolves, rejects) => {
        const blobStream = newFile.createWriteStream({
          resumable: false,
        }).on("error", (err: Error) => {
          rejects(res.status(500).send({ message: err.message }));
        }).on("finish", resolves);
        blobStream.end(req.file!.buffer);
      });
      const newPhoto = getPublicUrl(filename);
      await UserModel.findByIdAndUpdate(user._id, {
        userPhoto: newPhoto,
      });
      res.status(200).send({url: newPhoto});
    } catch (err) {
      return res.status(500).send({
        message: `Could not upload the file: ${req.file.originalname}. ${err}`,
      });
    }
  });

  await new Promise((resolve) => {
    const serverResponse = app.listen(port);
    resolve(serverResponse);
  });
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
}

startServer();
