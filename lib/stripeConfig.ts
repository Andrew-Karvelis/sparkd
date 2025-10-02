import Stripe from "stripe";

// Localhost prices
// export const subscriptionPrices = {
//   starter: "price_1S5EeyQBpo5RZe2SEr5TzAxY",
//   pro: "price_1S5EfHQBpo5RZe2SSVMXZ5w7",
//   premium: "price_1S5EfXQBpo5RZe2ShVY6PkR1",
// };

// export const creditPrices = {
//   5: "price_1S5EggQBpo5RZe2SKOGpRcX4",
//   15: "price_1S5EgzQBpo5RZe2ShgaOkoMB",
//   25: "price_1S5EhGQBpo5RZe2SkMDNNHbf",
//   50: "price_1S5EhWQBpo5RZe2ScMWEehC7",
// };

// Production Prices
export const subscriptionPrices = {
  starter: "price_1SDjlB9gPusNFaJpeY1xDm6z",
  pro: "price_1SDjla9gPusNFaJpMi25qYDP",
  premium: "price_1SDjlq9gPusNFaJprmHWm2K8",
};

export const creditPrices = {
  5: "price_1SDjmO9gPusNFaJpHjxDtqFk",
  15: "price_1SDjme9gPusNFaJpSm8VsHFR",
  25: "price_1SDjpk9gPusNFaJpUDjRXsGh",
  50: "price_1SDjmx9gPusNFaJpvW9unJK8",
};
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});