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

export function getTurnstileSecretKey() {
  return readEnv("TURNSTILE_SECRET_KEY");
}

export function getOpenAiApiKey() {
  return readEnv("OPENAI_API_KEY");
}

export function getOpenAiModel() {
  return readEnv("OPENAI_MODEL") || "gpt-4.1-mini";
}