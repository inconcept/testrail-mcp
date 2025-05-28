import { z } from "zod";

export const ConfigSchema = z.object({
  testRail: z.object({
    host: z.string().url("TestRail host must be a valid URL"),
    username: z.string().email("TestRail username must be a valid email"),
    apiKey: z.string().min(1, "TestRail API key is required"),
  }),
  mcp: z.object({
    transport: z.enum(["stdio", "http"]).default("stdio"),
    port: z.number().int().positive().default(3100),
  }),
  http: z.object({
    timeout: z.number().int().positive().default(30000),
    retryAttempts: z.number().int().min(0).default(3),
    retryDelay: z.number().int().positive().default(1000),
  }),
  logging: z.object({
    level: z.enum(["debug", "info", "warn", "error"]).default("info"),
    format: z.enum(["json", "pretty"]).default("json"),
  }),
  env: z.object({
    nodeEnv: z.enum(["development", "production", "test"]).default("development"),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export class ConfigError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = "ConfigError";
  }
}

export function loadConfig(): Config {
  try {
    const rawConfig = {
      testRail: {
        host: process.env.TESTRAIL_HOST,
        username: process.env.TESTRAIL_USERNAME,
        apiKey: process.env.TESTRAIL_API_KEY,
      },
      mcp: {
        transport: process.env.MCP_TRANSPORT,
        port: process.env.MCP_PORT ? Number(process.env.MCP_PORT) : undefined,
      },
      http: {
        timeout: process.env.HTTP_TIMEOUT ? Number(process.env.HTTP_TIMEOUT) : undefined,
        retryAttempts: process.env.HTTP_RETRY_ATTEMPTS
          ? Number(process.env.HTTP_RETRY_ATTEMPTS)
          : undefined,
        retryDelay: process.env.HTTP_RETRY_DELAY ? Number(process.env.HTTP_RETRY_DELAY) : undefined,
      },
      logging: {
        level: process.env.LOG_LEVEL,
        format: process.env.LOG_FORMAT,
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
      },
    };

    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new ConfigError(`Configuration validation failed:\n${errorMessages}`, error);
    }
    throw new ConfigError("Failed to load configuration", error as Error);
  }
}

export const config = loadConfig();
