import { config } from "../config.js";

export class TestRailError extends Error {
  constructor(message: string, public statusCode?: number, public cause?: Error) {
    super(message);
    this.name = "TestRailError";
  }
}

export class TestRailConnectionError extends TestRailError {
  constructor(message: string, cause?: Error) {
    super(message, undefined, cause);
    this.name = "TestRailConnectionError";
  }
}

export class TestRailAuthError extends TestRailError {
  constructor(message: string, statusCode?: number) {
    super(message, statusCode);
    this.name = "TestRailAuthError";
  }
}

export class TestRailAPIError extends TestRailError {
  constructor(message: string, statusCode: number, public responseBody?: any) {
    super(message, statusCode);
    this.name = "TestRailAPIError";
  }
}

export class TestRailClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor() {
    this.baseUrl = config.testRail.host.endsWith("/")
      ? config.testRail.host
      : `${config.testRail.host}/`;

    this.authHeader = this.createBasicAuthHeader(config.testRail.username, config.testRail.apiKey);

    this.timeout = config.http.timeout;
    this.retryAttempts = config.http.retryAttempts;
    this.retryDelay = config.http.retryDelay;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = new URL(`index.php?/api/v2/${endpoint}`, this.baseUrl);

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url.toString(), requestOptions);

        await this.handleResponseErrors(response);

        const data = await response.json();

        return data;
      } catch (error) {
        lastError = error as Error;

        if (
          error instanceof TestRailAuthError ||
          (error instanceof TestRailAPIError && error.statusCode && error.statusCode < 500)
        ) {
          throw error;
        }

        if (attempt === this.retryAttempts) {
          break;
        }

        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }

    throw new TestRailConnectionError(
      `Failed to complete request after ${this.retryAttempts + 1} attempts: ${
        lastError?.message || "Unknown error"
      }`,
      lastError
    );
  }

  private async handleResponseErrors(response: Response): Promise<void> {
    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      const errorMessage = this.extractErrorMessage(errorBody, response.status);

      switch (response.status) {
        case 401:
          throw new TestRailAuthError(`Authentication failed: ${errorMessage}`, response.status);
        case 403:
          throw new TestRailAuthError(`Access forbidden: ${errorMessage}`, response.status);
        case 404:
          throw new TestRailAPIError(
            `Resource not found: ${errorMessage}`,
            response.status,
            errorBody
          );
        case 429:
          throw new TestRailAPIError(
            `Rate limit exceeded: ${errorMessage}`,
            response.status,
            errorBody
          );
        default:
          throw new TestRailAPIError(
            `API error (${response.status}): ${errorMessage}`,
            response.status,
            errorBody
          );
      }
    }
  }

  private extractErrorMessage(errorBody: any, statusCode: number): string {
    if (typeof errorBody === "string") {
      return errorBody || `HTTP ${statusCode}`;
    }

    if (errorBody && typeof errorBody === "object") {
      return errorBody.error || errorBody.message || `HTTP ${statusCode}`;
    }

    return `HTTP ${statusCode}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createBasicAuthHeader(username: string, apiKey: string): string {
    const credentials = Buffer.from(`${username}:${apiKey}`).toString("base64");
    return `Basic ${credentials}`;
  }
}

export const testRailClient = new TestRailClient();
