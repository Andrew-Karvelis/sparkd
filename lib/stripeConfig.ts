import Stripe from "stripe";

export const subscriptionPrices = {
  starter: "price_1S5EeyQBpo5RZe2SEr5TzAxY",
  pro: "price_1S5EfHQBpo5RZe2SSVMXZ5w7",
  premium: "price_1S5EfXQBpo5RZe2ShVY6PkR1",
};

export const creditPrices = {
  5: "price_1S5EggQBpo5RZe2SKOGpRcX4",
  15: "price_1S5EgzQBpo5RZe2ShgaOkoMB",
  25: "price_1S5EhGQBpo5RZe2SkMDNNHbf",
  50: "price_1S5EhWQBpo5RZe2ScMWEehC7",
};


export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});