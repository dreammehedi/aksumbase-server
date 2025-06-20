import Stripe from "stripe";
import { StripePaymentConfig } from "../models/siteConfiguration.model.js";

const stripeConfig = async () => {
  try {
    // Fetch Stripe configuration from the database
    const stripeConfigData = await StripePaymentConfig.findOne();

    if (!stripeConfigData || !stripeConfigData.stripeSecret) {
      throw new Error("Stripe secret key not found in database.");
    }

    // Initialize Stripe instance
    return new Stripe(stripeConfigData.stripeSecret);
  } catch (error) {
    throw new Error("Failed to initialize Stripe.");
  }
};

export default stripeConfig;
