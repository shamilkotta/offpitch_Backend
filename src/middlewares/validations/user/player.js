import * as yup from "yup";

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
  profile: yup
    .string()
    .trim()
    .url("Profile image can not be empty")
    .required("Profile image can not be empty"),
});

const playerValidation = (req, res, next) => {
  const { name, date_of_birth: dob, imageData: profile } = req.body;
  playerSchema
    .validate(
      { name, date_of_birth: dob, profile },
      { stripUnknown: true, abortEarly: false }
    )
    .then((data) => {
      req.validData = data;
      next();
    })
    .catch((err) => {
      const [validationErr] = err.errors;
      next(ErrorResponse.badRequest(validationErr));
    });
};

export default playerValidation;
