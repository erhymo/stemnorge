import { afterEach, describe, expect, it } from "vitest";

import {
  EnvironmentConfigurationError,
  getAdminSessionSecret,
  getJwtSecret,
  getSmsCodeSecret,
} from "./env";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_JWT_SECRET = process.env.JWT_SECRET;
const ORIGINAL_ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;
const ORIGINAL_SMS_CODE_SECRET = process.env.SMS_CODE_SECRET;

function setNodeEnv(value: string | undefined) {
  Reflect.set(process.env, "NODE_ENV", value);
}

afterEach(() => {
  setNodeEnv(ORIGINAL_NODE_ENV);
  process.env.JWT_SECRET = ORIGINAL_JWT_SECRET;
  process.env.ADMIN_SESSION_SECRET = ORIGINAL_ADMIN_SESSION_SECRET;
  process.env.SMS_CODE_SECRET = ORIGINAL_SMS_CODE_SECRET;
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

  it("lar admin- og SMS-secret arve JWT_SECRET", () => {
    setNodeEnv("production");
    process.env.JWT_SECRET = "veldig-hemmelig";
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.SMS_CODE_SECRET;

    expect(getAdminSessionSecret()).toBe("veldig-hemmelig");
    expect(getSmsCodeSecret()).toBe("veldig-hemmelig");
  });
});