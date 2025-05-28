import { MCPServer, MCPServerConfig } from "mcp-framework";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { config } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageFile = fs.readFileSync(resolve(__dirname, "../package.json"), "utf8");
const packageJson = JSON.parse(packageFile);
const version = packageJson.version;

async function main() {
  try {
    console.error(`🔧 TestRail MCP Server v${version}`);
    console.error("📋 Initializing server for QA workflow enhancement...");

    const transport: MCPServerConfig["transport"] =
      config.mcp.transport === "stdio"
        ? { type: "stdio" }
        : {
            type: "http-stream",
            options: {
              port: config.mcp.port,
              cors: { allowOrigin: "*" },
              responseMode: "stream",
            },
          };

    const server = new MCPServer({
      name: "testrail-mcp",
      version,
      transport,
      basePath: resolve(__dirname, "index.js"),
    });

    await server.start();

    setupGracefulShutdown(server);
  } catch (error) {
    console.error("❌ Failed to start TestRail MCP Server");

    if (error instanceof Error) {
      console.error(`💥 Error: ${error.message}`);
      if (config.env.nodeEnv === "development" && error.stack) {
        console.error("📚 Stack trace:", error.stack);
      }
    } else {
      console.error("💥 Unknown error:", error);
    }

    process.exit(1);
  }
}

function setupGracefulShutdown(server: MCPServer) {
  const gracefulShutdown = async (signal: string) => {
    console.error(`\n🛑 Received ${signal}. Shutting down gracefully...`);

    try {
      await server.stop();
      console.error("✅ TestRail MCP Server shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // For nodemon

  process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught Exception:", error);
    gracefulShutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled Rejection:", reason);
    gracefulShutdown("unhandledRejection");
  });
}

main().catch((error) => {
  console.error("💥 Fatal error in main():", error);
  process.exit(1);
});
