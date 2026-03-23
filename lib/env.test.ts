import { afterEach, describe, expect, it } from "vitest";

import {
  EnvironmentConfigurationError,
  getAdminSessionSecret,
  getJwtSecret,
  getOpenAiApiKey,
  getOpenAiModel,
} from "./env";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;
const ORIGINAL_ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ORIGINAL_OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ORIGINAL_OPENAI_MODEL = process.env.OPENAI_MODEL;

function setNodeEnv(value: string | undefined) {
  Reflect.set(process.env, "NODE_ENV", value);
}

afterEach(() => {
  setNodeEnv(ORIGINAL_NODE_ENV);
  process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
  process.env.ADMIN_SESSION_SECRET = ORIGINAL_ADMIN_SESSION_SECRET;
  process.env.OPENAI_API_KEY = ORIGINAL_OPENAI_API_KEY;
  process.env.OPENAI_MODEL = ORIGINAL_OPENAI_MODEL;
});

describe("env", () => {
  it("tillater dev-fallback utenfor production", () => {
    setNodeEnv("test");
    delete process.env.JWT_SECRET;

    expect(getJwtSecret()).toBe("supersecret");
  });

  it("krever JWT_SECRET i production", () => {
    setNodeEnv("production");
    delete process.env.JWT_SECRET;

    expect(() => getJwtSecret()).toThrow(EnvironmentConfigurationError);
  });

  it("avviser standardsecret i production", () => {
    setNodeEnv("production");
    process.env.JWT_SECRET = "supersecret";

    expect(() => getJwtSecret()).toThrow("JWT_SECRET kan ikke bruke standardverdien i production.");
  });

  it("lar admin-secret arve JWT_SECRET", () => {
    setNodeEnv("production");
    process.env.JWT_SECRET = "veldig-hemmelig";
    delete process.env.ADMIN_SESSION_SECRET;

    expect(getAdminSessionSecret()).toBe("veldig-hemmelig");
  });

  it("leser OpenAI-oppsett uten å kreve det i production", () => {
    setNodeEnv("production");
    delete process.env.OPENAI_API_KEY;
    process.env.OPENAI_MODEL = "gpt-4.1-mini";

    expect(getOpenAiApiKey()).toBeNull();
    expect(getOpenAiModel()).toBe("gpt-4.1-mini");
  });

  it("bruker standardmodell når OPENAI_MODEL mangler", () => {
    delete process.env.OPENAI_MODEL;

    expect(getOpenAiModel()).toBe("gpt-4.1-mini");
  });
});