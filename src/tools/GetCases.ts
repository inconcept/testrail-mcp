import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { validateTestCasesResponse } from "../testrail/schemas/case.js";
import { testRailClient } from "../testrail/client.js";

export function buildGetCasesQueryParams(input: GetCasesInput): URLSearchParams {
  const params = new URLSearchParams();

  const limit = input.limit ?? 50;
  const offset = input.offset ?? 0;

  params.append("suite_id", input.suiteId.toString());
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  if (input.sectionId !== undefined) {
    params.append("section_id", input.sectionId.toString());
  }

  return params;
}

interface GetCasesInput {
  projectId: number;
  suiteId: number;
  sectionId?: number;
  limit?: number;
  offset?: number;
}

class GetCasesTool extends MCPTool<GetCasesInput> {
  name = "testrail_get_cases";
  description =
    "Retrieve test cases from a specific project and suite with optional filtering. Supports filtering by section, dates, priority, and more for targeted test case discovery.";

  schema = {
    projectId: {
      type: z.number().int().positive(),
      description: "projectId to find the test cases",
    },
    suiteId: {
      type: z.number().int().positive(),
      description: "suiteId to find the test cases",
    },
    sectionId: {
      type: z.number().int().positive().optional(),
      description: "sectionId to find the test cases",
    },
    limit: {
      type: z.number().int().positive().optional(),
      description: "limit to find the test cases",
    },
    offset: {
      type: z.number().int().nonnegative().optional(),
      description: "offset to find the test cases",
    },
  };

  async execute(input: GetCasesInput) {
    const queryParams = buildGetCasesQueryParams(input);

    const endpoint = `get_cases/${input.projectId}`;
    const url = `${endpoint}${queryParams.toString() ? `&${queryParams.toString()}` : ""}`;

    const response = await testRailClient.request(url);

    const validatedCases = validateTestCasesResponse(response);

    return validatedCases;
  }
}

export default GetCasesTool;
