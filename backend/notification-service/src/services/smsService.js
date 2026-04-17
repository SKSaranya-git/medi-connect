import twilio from "twilio";

/**
 * Twilio SMS client.
 * For development: if credentials are not set, SMS is logged to console instead.
 */

const isConfigured = () =>
  Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_ACCOUNT_SID !== "your_account_sid"
  );

const getClient = () => {
  if (!isConfigured()) {
    return null;
  }

  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

/**
 * Send an SMS message.
 * @param {string} to - Recipient phone number (with country code, e.g., +94712345678)
 * @param {string} message - SMS body text
 * @returns {{ success: boolean, sid?: string, error?: string }}
 */
export const sendSMS = async (to, message) => {
  if (!isConfigured()) {
    console.log(`\n📱 [SMS STUB] To: ${to}`);
    console.log(`   Message: ${message}`);
    return { success: true, sid: `stub-${Date.now()}` };
  }

  try {
    const client = getClient();

    if (!client) {
      return { success: false, error: "Twilio client is not configured." };
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log(`📱 SMS sent to ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`📱 SMS failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default { sendSMS };
