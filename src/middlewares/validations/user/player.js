import * as yup from "yup";

import { multipleFileUpload } from "../../fileUpload.js";
import ErrorResponse from "../../../error/ErrorResponse.js";

const playerSchema = yup.object().shape({
  name: yup
    .string()
    .transform((value) =>
      value !== null ? value.charAt(0).toUpperCase() + value.slice(1) : value
    )
    .trim()
    .required("Name can not be empty"),
  date_of_birth: yup
    .date()
    .typeError("Please add valid date of birth")
    .required("Date of birth can not be empty"),
});

const playerValidation = (req, res, next) => {
  const { name, date_of_birth: dob } = req.body;
  playerSchema
    .validate(
      { name, date_of_birth: dob },
      { stripUnknown: true, abortEarly: false }
    )
    .then((data) => {
      req.validData = data;
      if (req.files)
        multipleFileUpload(req.files)
          .then((result) => {
            req.validData.profile = result.profile.secure_url;
            req.validData.doc = result.doc.secure_url;

            next();
          })
          .catch(next);
      else if (req.body.profile) {
        req.validData.profile = req.body.profile;
        req.validData.doc = req.body.doc;
        next();
      } else next(ErrorResponse.badRequest("Profile is required"));
    })
    .catch((err) => {
      const [validationErr] = err?.errors || ["Something went wrong"];
      next(ErrorResponse.badRequest(validationErr));
    });
};

export default playerValidation;
