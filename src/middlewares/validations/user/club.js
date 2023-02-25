import * as yup from "yup";

import ErrorResponse from "../../../error/ErrorResponse.js";
import { multipleFileUpload } from "../../fileUpload.js";

const clubSchema = yup.object().shape({
  name: yup
    .string()
    .transform((value) =>
      value !== null ? value.charAt(0).toUpperCase() + value.slice(1) : value
    )
    .trim()
    .required("Name can not be empty"),
  email: yup
    .string()
    .trim()
    .required("Email can not be empty")
    .email("Enter a valid email"),
  phone: yup
    .number()
    .typeError("Invalid phone number")
    .required("Phone number can not be empty")
    .integer("Enter a valid phone number")
    .positive("Enter a valid phone number")
    .test("isValidPhone", "Enter a valid phone number", (arg) =>
      /^[0]?[6789]\d{9}$/.test(arg)
    ),
  description: yup
    .string()
    .trim()
    .required("Description can not be empty")
    .min(200, "Too short description"),
});

const clubValidation = (req, res, next) => {
  const { name, email, phone, description } = req.body;
  clubSchema
    .validate(
      { name, email, phone, description },
      { stripUnknown: true, abortEarly: false }
    )
    .then((data) => {
      req.validData = data;
      if (req.files)
        multipleFileUpload(req.files)
          .then((result) => {
            if (result?.profile)
              req.validData.profile = result.profile.secure_url;
            if (result?.doc) req.validData.doc = result.doc.secure_url;

            next();
          })
          .catch(next);
    })
    .catch((err) => {
      const [validationErr] = err?.errors || ["Something went wrong"];
      next(ErrorResponse.badRequest(validationErr));
    });
};

export default clubValidation;
