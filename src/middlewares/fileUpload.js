import DataURIParser from "datauri/parser.js";
import path from "path";
import cloudinary from "../config/cloudinary.js";

const dUri = new DataURIParser();

export const multipleFileUpload = async (files) => {
  const promises = Object.entries(files).map(([, value]) => {
    const file = dUri.format(
      path.extname(value[0].originalname).toString(),
      value[0].buffer
    );

    return cloudinary.uploader.upload(file.content, {
      folder: "offpitch",
    });
  });

  const results = await Promise.all(promises);

  return Object.fromEntries(
    results.map((result, index) => [Object.keys(files)[index], result])
  );
};

export default async (raw) => {
  const file = await dUri.format(
    path.extname(raw.originalname).toString(),
    raw.buffer
  );
  const result = await cloudinary.uploader.upload(file.content, {
    folder: "offpitch",
  });
  return result;
};
