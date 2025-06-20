import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all configurations
export const getStripeConfiguration = async (req, res) => {
  try {
    const stripeConfigurations = await prisma.stripeConfiguration.findMany();

    res.status(200).json({
      success: true,
      message: "Stripe configuration data was successfully retrieved.",
      payload: stripeConfigurations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE a configuration (PUT with ID in body)
export const updateStripeConfiguration = async (req, res) => {
  try {
    const { id, ...otherFields } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid stripe configuration ID!",
      });
    }

    // Check if the config exists
    const existingConfig = await prisma.stripeConfiguration.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      return res.status(404).json({
        success: false,
        message: "Stripe configuration not found!",
      });
    }

    // Prepare update data
    const updateData = { ...otherFields };

    // Update using Prisma
    await prisma.stripeConfiguration.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Stripe configuration updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error.message ||
        "An error occurred while updating the stripe configuration.",
    });
  }
};
