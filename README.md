# TestRail MCP Integration

This project provides a Model Context Protocol (MCP) server for integrating with TestRail, allowing to automate test cases using LLM.

## Prerequisites

- Node.js 20 or later
- pnpm 10.7.0 or later
- TestRail instance with API access

## Usage

### Running the server

The server can be run directly using the installed script:

```bash
npx testrail-mcp
```

This will start the MCP server in stdio mode, which can be used with MCP clients that support stdio communication.

### Using with Cursor

In cursor add `.cursor/msp.json` file with the following configuration

```json
{
  "mcpServers": {
    "testrail-mcp": {
      "name": "TestRail MCP",
      "command": "npx",
      "args": ["testrail-mcp"],
      "env": {
        "TESTRAIL_HOST": "https://your-instance.testrail.io",
        "TESTRAIL_USERNAME": "your-email@example.com",
        "TESTRAIL_API_KEY": "your-api-key"
      }
    }
  }
}
```

## License

MIT
