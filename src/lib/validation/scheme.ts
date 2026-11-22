import { z } from 'zod';

export const SCHEME_STATUS_VALUES = ['draft', 'in_review', 'published', 'retired'] as const;
export type SchemeStatus = (typeof SCHEME_STATUS_VALUES)[number];

export const SOURCE_TYPE_VALUES = ['official_document', 'official_website', 'gazette', 'other'] as const;
export type SourceType = (typeof SOURCE_TYPE_VALUES)[number];

export const RULE_KIND_VALUES = ['eligibility', 'exclusion'] as const;
export type RuleKind = (typeof RULE_KIND_VALUES)[number];

export const REVIEW_DECISION_VALUES = ['approved', 'changes_requested', 'rejected'] as const;
export type ReviewDecision = (typeof REVIEW_DECISION_VALUES)[number];

/** Leaf test: compares one answer field with a value (or checks a boolean). */
export const comparisonSchema = z
  .object({
    field: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[a-z][a-zA-Z0-9_]*$/, 'Field must start with a lowercase letter and use only letters, digits or underscores'),
    op: z.enum(['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in', 'not_in', 'is_true', 'is_false']),
    value: z
      .union([
        z.string().max(200),
        z.number().finite(),
        z.boolean(),
        z.array(z.union([z.string().max(200), z.number().finite()])).max(50),
      ])
      .optional(),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (c.op === 'is_true' || c.op === 'is_false') {
      if (c.value !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: `Operator ${c.op} must not have a value`,
        });
      }
      return;
    }
    if (c.op === 'in' || c.op === 'not_in') {
      if (!Array.isArray(c.value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: `Operator ${c.op} requires an array value`,
        });
      }
      return;
    }
    if (c.value === undefined || Array.isArray(c.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: `Operator ${c.op} requires a string, number or boolean value`,
      });
    }
  });
export type ComparisonInput = z.input<typeof comparisonSchema>;
export type Comparison = z.output<typeof comparisonSchema>;

type RuleNodeOutput =
  | Comparison
  | { all: RuleNodeOutput[] }
  | { any: RuleNodeOutput[] }
  | { not: RuleNodeOutput };

/**
 * Recursive boolean rule tree. The type is written out explicitly because
 * z.lazy cannot infer a type that refers to itself.
 */
export const ruleNodeSchema: z.ZodType<RuleNodeOutput, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.union([
    comparisonSchema,
    z.object({ all: z.array(ruleNodeSchema).min(1).max(20) }).strict(),
    z.object({ any: z.array(ruleNodeSchema).min(1).max(20) }).strict(),
    z.object({ not: ruleNodeSchema }).strict(),
  ]),
);
export type RuleNodeInput = z.input<typeof ruleNodeSchema>;
export type RuleNode = z.infer<typeof ruleNodeSchema>;

/** Depth of a rule tree: a comparison is 1; all/any/not add 1 plus the deepest child. */
export function ruleDepth(node: RuleNode): number {
  if ('field' in node) return 1;
  if ('all' in node) return 1 + Math.max(...node.all.map(ruleDepth));
  if ('any' in node) return 1 + Math.max(...node.any.map(ruleDepth));
  return 1 + ruleDepth(node.not);
}

export const ruleJsonWithDepthSchema = ruleNodeSchema.refine(
  (n) => ruleDepth(n) <= 6,
  'Rule is nested too deeply',
);
export type RuleJsonWithDepthInput = z.input<typeof ruleJsonWithDepthSchema>;
export type RuleJsonWithDepth = z.output<typeof ruleJsonWithDepthSchema>;

export const schemeDraftSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/, 'Use lowercase letters, digits and hyphens'),
  name: z.string().trim().min(1).max(200),
});
export type SchemeDraftInput = z.input<typeof schemeDraftSchema>;
export type SchemeDraft = z.output<typeof schemeDraftSchema>;

export const sourceSchema = z.object({
  sourceType: z.enum(SOURCE_TYPE_VALUES),
  title: z.string().trim().min(1).max(300),
  url: z
    .union([z.literal(''), z.string().trim().max(2000).startsWith('https://', 'Source link must start with https://')])
    .transform((v) => (v === '' ? null : v)),
  publishedOn: z
    .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')])
    .transform((v) => (v === '' ? null : v)),
});
export type SourceInput = z.input<typeof sourceSchema>;
export type Source = z.output<typeof sourceSchema>;

export const ruleSchema = z.object({
  ruleKind: z.enum(RULE_KIND_VALUES),
  ruleJson: ruleJsonWithDepthSchema,
  sourceId: z.string().uuid(),
  clauseReference: z.string().trim().min(1).max(200),
});
export type RuleInput = z.input<typeof ruleSchema>;
export type Rule = z.output<typeof ruleSchema>;

export const reviewSchema = z.object({
  schemeVersionId: z.string().uuid(),
  decision: z.enum(REVIEW_DECISION_VALUES),
  comment: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => (v === '' ? null : v)),
});
export type ReviewInput = z.input<typeof reviewSchema>;
export type Review = z.output<typeof reviewSchema>;

export const publishSchema = z.object({
  schemeVersionId: z.string().uuid(),
});
export type PublishInput = z.input<typeof publishSchema>;
export type Publish = z.output<typeof publishSchema>;

export const idSchema = z.object({
  id: z.string().uuid(),
});
export type IdInput = z.input<typeof idSchema>;
export type Id = z.output<typeof idSchema>;
