// stripeConfig.js
import Stripe from "stripe";
import prisma from "../lib/prisma.js";

const stripeConfig = async () => {
  const config = await prisma.stripeConfiguration.findFirst(); // your custom DB config

  console.log(config, "congi");
  if (!config || !config.stripeSecret) {
    throw new Error("Stripe secret key not found in DB");
  }

  return new Stripe(config.stripeSecret, {
    apiVersion: "2024-04-10", // or latest Stripe API version
  });
};

export default stripeConfig;
