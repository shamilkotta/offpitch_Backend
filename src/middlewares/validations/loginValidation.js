import * as yup from "yup";
import ErrorResponse from "../../error/ErrorResponse.js";

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required("Email can not be empty")
    .email("Enter a valid email"),
  password: yup
    .string()
    .trim()
    .required("Password can not be empty")
    .min(8, "Too short password")
    .max(16, "Too long password"),
});

const loginValidation = (req, res, next) => {
  const { email, password } = req.body;
  loginSchema
    .validate({ email, password }, { stripUnknown: true })
    .then((data) => {
      req.validData = data;
      next();
    })
    .catch((err) => {
      const [validationErr] = err.errors;
      next(ErrorResponse.badRequest(validationErr));
    });
};

export default loginValidation;
