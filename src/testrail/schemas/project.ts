import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  announcement: z.string().nullable(),
  show_announcement: z.boolean(),
  is_completed: z.boolean(),
  completed_on: z.number().int().nullable(),
  suite_mode: z.number().int(),
  default_role_id: z.number().int().positive().nullable(),
  url: z.string().optional(),
});

export const ProjectsResponseSchema = z
  .object({
    projects: z.array(ProjectSchema),
    offset: z.number().int().min(0).optional(),
    limit: z.number().int().positive().optional(),
    size: z.number().int().min(0).optional(),
    _links: z
      .object({
        next: z.string().nullable().optional(),
        prev: z.string().nullable().optional(),
      })
      .optional(),
  })
  .or(z.array(ProjectSchema))
  .transform((data) => {
    if (Array.isArray(data)) {
      return {
        projects: data,
        totalCount: data.length,
        offset: 0,
        limit: data.length,
      };
    }

    const projects = data.projects || [];
    return {
      projects,
      totalCount: data.size || projects.length,
      offset: data.offset || 0,
      limit: data.limit || projects.length,
    };
  });

export type ProjectsResponseData = z.infer<typeof ProjectsResponseSchema>;

export function validateProjectsResponse(data: unknown): ProjectsResponseData {
  return ProjectsResponseSchema.parse(data);
}
