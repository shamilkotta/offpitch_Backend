import * as yup from "yup";
import ErrorResponse from "../../../error/ErrorResponse.js";

const resetPasswordSchema = yup.object().shape({
  token: yup.string().trim().required("Token error, try again"),
  password: yup
    .string()
    .trim()
    .required("Password can not be empty")
    .min(8, "Too short password")
    .max(16, "Too long password")
    .test("isPerfectPasswrod", "Enter a strong password", (arg) =>
      /((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W])(?!.*\s).{8,16})/.test(arg)
    ),
});

const resetPasswordValidation = (req, res, next) => {
  const { token, password } = req.body;
  resetPasswordSchema
    .validate({ token, password }, { stripUnknown: true, abortEarly: false })
    .then((data) => {
      req.validData = data;
      next();
    })
    .catch((err) => {
      const [validationErr] = err.errors;
      next(ErrorResponse.badRequest(validationErr));
    });
};

export default resetPasswordValidation;
