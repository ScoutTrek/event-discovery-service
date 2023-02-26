import { Storage } from '@google-cloud/storage';
import multer from 'multer';

import { getTokenFromReq, getUserFromToken } from '../utils/Auth';

import type { Express } from 'express';

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

const gcs = new Storage();
const bucketName = process.env.GCLOUD_STORAGE_BUCKET;
const bucket = gcs.bucket(bucketName ?? '');

function getPublicUrl(filename: string): string {
  return 'https://storage.googleapis.com/' + bucketName + '/' + filename;
}

function getFileName(publicUrl: string): string | undefined {
  return publicUrl.split(
    'https://storage.googleapis.com/' + bucketName + '/'
  )[1];
}
export function uploadPhotoRoute(app: Express) {
  app.post('/upload', upload.single('photo'), async (req, res) => {
    const token = getTokenFromReq(req);
    if (!token) {
      return res.status(401).send({ message: 'Unauthorized' });
    }
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).send({ message: 'Unauthorized' });
    }
    if (!req.file) {
      return res.status(400).send({ message: 'Please upload a file!' });
    }
    const filename = req.file.originalname;
    try {
      const newFile = bucket.file(filename);
      await new Promise((resolves, rejects) => {
        newFile
          .createWriteStream({ resumable: false })
          .on('finish', resolves)
          .on('error', rejects)
          .end(req.file!.buffer); // Write the input buffer to the file and end
      });
      const newPhoto = getPublicUrl(filename);
      const oldFile = getFileName(user.userPhoto);
      if (oldFile) bucket.file(oldFile).delete();

      user.userPhoto = newPhoto;
      await user.save();
      res.status(200).send({ url: newPhoto });
    } catch (err) {
      return res.status(500).send({
        message: `Could not upload the file: ${filename}. ${err}`,
      });
    }
  });
}
