import multer from "multer";

import ErrorResponse from "../error/ErrorResponse.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!["image/png", "image/jpg", "image/jpeg"].includes(file?.mimetype)) {
    return cb(new Error("Not a image"));
  }
  return cb(null, true);
};

const docFilter = (req, file, cb) => {
  if (
    !["image/png", "image/jpg", "image/jpeg"].includes(file?.mimetype) &&
    file?.fieldname === "profile"
  ) {
    return cb(new Error("Not a image"));
  }
  if (
    !["application/pdf"].includes(file?.mimetype) &&
    file?.fieldname === "doc"
  )
    return cb(new Error("Not a pdf"));
  return cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5242880 } }); // file size 5MB in bytes
const uploadDoc = multer({
  storage,
  fileFilter: docFilter,
  limits: { fileSize: 5242880 },
}); // file size 5MB in bytes

export const parseProfile = (req, res, next) => {
  upload.single("profile")(req, res, (err) => {
    if (err) {
      if (err.message === "Not a image")
        return next(ErrorResponse.badRequest("Please provide a valid image"));
      if (err.message === "File too large")
        return next(ErrorResponse.badRequest("File is too large"));
      return next(ErrorResponse.internalError("Something went wrong"));
    }
    return next();
  });
};

export const parseCover = (req, res, next) => {
  upload.single("cover")(req, res, (err) => {
    if (err) {
      if (err.message === "Not a image")
        return next(ErrorResponse.badRequest("Please provide a valid image"));
      if (err.message === "File too large")
        return next(ErrorResponse.badRequest("File is too large"));
      return next(ErrorResponse.internalError("Something went wrong"));
    }
    return next();
  });
};

export const parseDoc = (req, res, next) => {
  uploadDoc.fields([
    { name: "profile", maxCount: 1 },
    { name: "doc", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (err.message === "Not a image")
        return next(ErrorResponse.badRequest("Please provide a valid profile"));
      if (err.message === "Not a pdf")
        return next(
          ErrorResponse.badRequest("Please provide a valid document")
        );
      if (err.message === "File too large")
        return next(ErrorResponse.badRequest("File is too large"));
      return next(ErrorResponse.internalError("Something went wrong"));
    }
    return next();
  });
};
