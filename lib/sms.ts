import twilio from "twilio";

import { getTwilioAccountSid, getTwilioAuthToken, getTwilioFromNumber } from "@/lib/env";

export class SmsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmsConfigurationError";
  }
}

function getSmsProvider() {
  return process.env.SMS_PROVIDER?.trim() || "mock";
}

async function sendViaTwilio(to: string, message: string) {
  const accountSid = getTwilioAccountSid();
  const authToken = getTwilioAuthToken();
  const fromNumber = getTwilioFromNumber();

  if (!accountSid || !authToken || !fromNumber) {
    throw new SmsConfigurationError(
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN og TWILIO_FROM_NUMBER må alle settes for SMS_PROVIDER=twilio.",
    );
  }

  const client = twilio(accountSid, authToken);

  const result = await client.messages.create({
    to,
    from: fromNumber,
    body: message,
  });

  return { provider: "twilio" as const, accepted: true, sid: result.sid };
}

export async function sendSmsMessage({ to, message }: { to: string; message: string }) {
  const provider = getSmsProvider();

  if (provider === "twilio") {
    return sendViaTwilio(to, message);
  }

  if (provider === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new SmsConfigurationError("SMS_PROVIDER=mock kan ikke brukes i production.");
    }

    console.info(`[sms:mock] to=${to} message=${message}`);
    return { provider: "mock" as const, accepted: true };
  }

  throw new SmsConfigurationError(`Ukjent SMS-provider: "${provider}". Bruk "twilio" eller "mock".`);
}

export function canExposeDevSmsCode() {
  return process.env.NODE_ENV !== "production" && getSmsProvider() === "mock";
}