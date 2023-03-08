import Razorpay from "razorpay";

const razInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const generateRazorpayOrder = (amountInInr) => {
  const amount = parseInt(amountInInr, 10) * 100;
  const options = {
    amount,
    currency: "INR",
  };
  return new Promise((resolve, reject) => {
    razInstance.orders.create(options, (err, order) => {
      if (err) reject(err);
      else
        resolve({
          success: true,
          order,
        });
    });
  });
};

export default generateRazorpayOrder;
