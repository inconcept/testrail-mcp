import { z } from "zod";

export const TestCaseStepSchema = z.object({
  content: z.string(),
  expected: z.string(),
});

export const TestCaseSchema = z
  .object({
    id: z.number().int().positive(),
    title: z.string().min(1),
    section_id: z.number().int().positive(),
    template_id: z.number().int(),
    type_id: z.number().int(),
    priority_id: z.number().int(),
    milestone_id: z.number().int().nullable(),
    refs: z.string().nullable(),
    created_by: z.number().int().positive(),
    created_on: z.number().int().positive(),
    updated_by: z.number().int().positive(),
    updated_on: z.number().int().positive(),
    estimate: z.string().nullable(),
    estimate_forecast: z.string().nullable(),
    suite_id: z.number().int().positive(),
    custom_fields: z.record(z.unknown()).optional(),
    custom_steps_separated: z.array(TestCaseStepSchema).optional(),
    custom_preconds: z.string().nullable().optional(),
    custom_steps: z.string().nullable().optional(),
    custom_expected: z.string().nullable().optional(),
  })
  .passthrough();

export const TestCasesResponseSchema = z
  .object({
    cases: z.array(TestCaseSchema),
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
  .transform((data) => ({
    cases: data.cases,
    totalCount: data.size || data.cases.length,
    offset: data.offset || 0,
    limit: data.limit || data.cases.length,
  }));

export const TestCaseResponseSchema = TestCaseSchema;

export type TestCaseData = z.infer<typeof TestCaseSchema>;
export type TestCasesResponseData = z.infer<typeof TestCasesResponseSchema>;

export function validateTestCase(data: unknown): TestCaseData {
  return TestCaseSchema.parse(data);
}

export function validateTestCasesResponse(data: unknown): TestCasesResponseData {
  return TestCasesResponseSchema.parse(data);
}
