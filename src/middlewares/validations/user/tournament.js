import * as yup from "yup";

import ErrorResponse from "../../../error/ErrorResponse.js";
import fileUpload from "../../fileUpload.js";

const stepOneSchema = yup.object().shape({
  title: yup
    .string()
    .trim()
    .required("Title can not be empty")
    .min(10, "Too short title, Atleast 10 characters"),
  short_description: yup
    .string()
    .trim()
    .required("Description can not be empty")
    .min(200, "Description should be 200 characters long"),
  start_date: yup
    .date()
    .typeError("Please add valid starting date")
    .min(new Date(), "Enter a valid starting date")
    .required("Starting date can not be empty"),
  location: yup.string().trim().required("Location can not be empty"),
  description: yup
    .string()
    .trim()
    .required("About section can not be empty")
    .min(500, "About should be 500 characters long"),
});

const stepTwoSchema = yup.object().shape({
  instruction: yup
    .string()
    .trim()
    .required("Instructions can not be empty")
    .min(500, "Instruction should be 500 characters long"),
  no_teams: yup
    .number("Enter no of teams that can be registerd")
    .typeError("Enter no of teams that can be registerd")
    .required("No of teams can not be empty")
    .min(4, "Atleast 4 teams needed")
    .max(64, "Can only register upto 64 teams max"),
  registration: yup.object().shape({
    last_date: yup
      .date()
      .typeError("Please add last date for registration")
      .min(new Date(), "Enter a last date for registration")
      .required("Last date can not be empty"),
    fee: yup
      .object()
      .shape({
        is: yup
          .boolean("Choose valid registration option")
          .typeError("Choose valid registration option")
          .required("Choose valid registration option")
          .default(false),
        amount: yup
          .number("Enter a valid registration amount")
          .typeError("Enter a valid registration amount")
          .when("is", {
            is: true,
            then: (schema) =>
              schema
                .required("Enter a valid registration amount")
                .min(1, "Enter a valid registration amount"),
          }),
      })
      .typeError("Choose a valid registraion type"),
  }),
  min_no_players: yup
    .number("Enter valid no of min players")
    .typeError("Enter valid no of min players")
    .required("Min no of players can not be empty")
    .min(3, "3-a-side is the minimum match")
    .max(11, "Allowed only upto 11-a-side match"),
  max_no_players: yup
    .number("Enter valid no of players")
    .typeError("Enter valid no of players")
    .required("No of players can not be empty")
    .min(3, "3-a-side the minimum match")
    .max(18, "Allowed only max upto 18 players")
    .test(
      "Valid no",
      "Maximum no. can't be less than min no. players",
      // eslint-disable-next-line func-names
      function (value) {
        return value >= this.parent.min_no_players;
      }
    ),
});

const stepThreeSchema = yup.object().shape({
  ticket: yup
    .object()
    .shape({
      is: yup
        .boolean("choose a valid ticket option")
        .typeError("Choose valid ticket option"),
      amount: yup
        .number("Enter a valid ticket amount")
        .typeError("Enter a valid ticket amount")
        .when("is", {
          is: true,
          then: (schema) =>
            schema
              .required("Enter a valid ticket amount")
              .min(1, "Enter a valid ticket amount"),
        }),
      total: yup
        .number("Enter total tickets count")
        .typeError("Enter total tickets count")
        .when("is", {
          is: true,
          then: (schema) =>
            schema
              .required("Enter total tickets count")
              .min(1, "Enter total tickets count"),
        }),
    })
    .typeError("Choose a valid ticket type"),
});

const stepFourSchema = yup.object().shape({
  tournament_type: yup
    .string()
    .oneOf(["t1", "t2", "t3", "t4"], "Choose valid tournament type")
    .required("Choose valid tournament type"),
});

const currentSchema = (step = 0) => {
  switch (step) {
    case 1:
      return stepOneSchema;
    case 2:
      return stepTwoSchema;
    case 3:
      return stepThreeSchema;
    default:
      return yup.object().shape({
        ...stepOneSchema.fields,
        ...stepTwoSchema.fields,
        ...stepThreeSchema.fields,
        ...stepFourSchema.fields,
      });
  }
};

const tournamentValidation = (req, res, next) => {
  const formData = req.body;
  const step = parseInt(req.body?.step, 10);
  formData.step = step;
  const schema = currentSchema(formData?.step);

  schema
    .validate(formData, { stripUnknown: true, abortEarly: false })
    .then((data) => {
      req.validData = data;
      req.validData.status = formData.step > 3 ? "active" : "draft";
      if (formData.step === 2)
        req.validData.registration.status = "not started";
      else if (formData.step > 3) req.validData.registration.status = "open";

      // for first step
      if (formData.step === 1) {
        if (req.file)
          fileUpload(req.file)
            .then((result) => {
              req.validData.cover = result.secure_url;
              next();
            })
            .catch(next);
        else if (req.body.cover) {
          req.validData.cover = req.body.cover;
          next();
        } else next(ErrorResponse.badRequest("Cover image is required"));

        // for last step
      } else if (formData.step === 4) {
        if (req.body.cover) {
          req.validData.cover = req.body.cover;
          next();
        } else {
          next(ErrorResponse.badRequest("Cover image is required"));
        }
      } else next();
    })
    .catch((err) => {
      const [validationErr] = err?.errors || ["Something went wrong"];
      next(ErrorResponse.badRequest(validationErr));
    });
};

export default tournamentValidation;
