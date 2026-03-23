export class EnvironmentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentConfigurationError";
  }
}

const INSECURE_DEFAULT_SECRET = "supersecret";

function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function readSecret(primaryName: string, fallbackNames: string[] = []) {
  const names = [primaryName, ...fallbackNames];

  for (const name of names) {
    const value = readEnv(name);

    if (!value) {
      continue;
    }

    if (isProductionEnvironment() && value === INSECURE_DEFAULT_SECRET) {
      throw new EnvironmentConfigurationError(`${name} kan ikke bruke standardverdien i production.`);
    }

    return value;
  }

  if (isProductionEnvironment()) {
    throw new EnvironmentConfigurationError(`${names.join(" eller ")} må settes i production.`);
  }

  return INSECURE_DEFAULT_SECRET;
}

export function getJwtSecret() {
  return readSecret("JWT_SECRET");
}

export function getAdminSessionSecret() {
  return readSecret("ADMIN_SESSION_SECRET", ["JWT_SECRET"]);
}

export function getSmsCodeSecret() {
  return readSecret("SMS_CODE_SECRET", ["JWT_SECRET"]);
}

export function getTwilioAccountSid() {
  return readEnv("TWILIO_ACCOUNT_SID");
}

export function getTwilioAuthToken() {
  return readEnv("TWILIO_AUTH_TOKEN");
}

export function getTwilioFromNumber() {
  return readEnv("TWILIO_FROM_NUMBER");
}

export function getOpenAiApiKey() {
  return readEnv("OPENAI_API_KEY");
}

export function getOpenAiModel() {
  return readEnv("OPENAI_MODEL") || "gpt-4.1-mini";
}