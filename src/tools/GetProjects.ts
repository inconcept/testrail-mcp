import { MCPTool } from "mcp-framework";
import { validateProjectsResponse } from "../testrail/schemas/project.js";
import { testRailClient } from "../testrail/client.js";

interface GetProjectsInput {}

class GetProjectsTool extends MCPTool<GetProjectsInput> {
  name = "testrail_get_projects";
  description =
    "Retrieve all accessible TestRail projects. This tool helps QA engineers discover available projects for test case management.";

  schema = {};

  async execute() {
    const response = await testRailClient.request("get_projects");

    const validatedProjects = validateProjectsResponse(response);

    return validatedProjects;
  }
}

export default GetProjectsTool;
