export class SmsConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmsConfigurationError";
  }
}

export async function sendSmsMessage({ to, message }: { to: string; message: string }) {
  const provider = process.env.SMS_PROVIDER?.trim() || "mock";

  if (provider === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new SmsConfigurationError("SMS_PROVIDER=mock kan ikke brukes i production.");
    }

    console.info(`[sms:mock] to=${to} message=${message}`);
    return { provider, accepted: true };
  }

  throw new SmsConfigurationError("SMS-provider er ikke konfigurert ennå.");
}

export function canExposeDevSmsCode() {
  const provider = process.env.SMS_PROVIDER?.trim() || "mock";
  return process.env.NODE_ENV !== "production" && provider === "mock";
}