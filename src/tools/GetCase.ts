import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { testRailClient } from "../testrail/client.js";
import { validateTestCase } from "../testrail/schemas/case.js";

interface GetCaseInput {
  caseId: number;
}

class GetCaseTool extends MCPTool<GetCaseInput> {
  name = "testrail_get_case";
  description =
    "Retrieve a specific test case by ID. Returns detailed information including steps, preconditions, and custom fields for E2E test development.";

  schema = {
    caseId: {
      type: z.number().int().positive(),
      description: "caseId to find the test case",
    },
  };

  async execute(input: GetCaseInput) {
    const response = await testRailClient.request(`get_case/${input.caseId}`);

    const validatedCase = validateTestCase(response);

    return validatedCase;
  }
}

export default GetCaseTool;
