// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const { status = 500 } = err;
  let { message = "Something went wrong" } = err;
  if (status === 404) message = "Not found";
  if (status === 401) message = "Unauthorized";
  return res.status(status).json({ success: false, status, message });
};

export default errorHandler;
