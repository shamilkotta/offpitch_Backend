import * as yup from "yup";
import ErrorResponse from "../../../error/ErrorResponse.js";

const verifyEmailSchema = yup.object().shape({
  otp: yup
    .number("Enter a valid otp")
    .required("Enter a valid otp")
    .test(
      "number of digits",
      "Enter 6 digit otp",
      (arg) => arg.toString().length === 6
    ),
  token: yup.string().trim().required("Token error, try again"),
});

const verifyEmailValidation = (req, res, next) => {
  const { otp, token } = req.body;

  verifyEmailSchema
    .validate({ otp, token }, { stripUnknown: true, abortEarly: false })
    .then((data) => {
      req.validData = data;
      return next();
    })
    .catch((err) => {
      const [validationErr] = err.errors;
      return next(ErrorResponse.badRequest(validationErr));
    });
};

export default verifyEmailValidation;
