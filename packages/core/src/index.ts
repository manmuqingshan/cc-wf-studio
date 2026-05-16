/**
 * @cc-wf-studio/core — public API barrel.
 *
 * Re-exports the bulk of the pure workflow logic. A few modules are namespaced
 * (`McpNode`, `SlackWorkflowValidator`) because they declare identifiers that
 * collide with `workflow-definition` / `validate-workflow`. Resolving those
 * collisions is a follow-up refactor; for now consumers reach those types via
 * the namespace re-exports.
 */

// Primary workflow types and validation rules.
export * from './types/workflow-definition';
export * from './types/ai-metrics';
export * from './types/sample-workflow';

// Built-in sub-agent metadata.
export * from './constants/built-in-sub-agents';

// Pure formatters / generators.
export * from './services/workflow-prompt-generator';
export * from './services/workflow-overview-formatter';

// Pure validation, migration, schema parsing.
export * from './utils/validate-workflow';
export * from './utils/migrate-workflow';
export * from './utils/schema-parser';

// Namespaced re-exports to side-step duplicate identifiers with the modules above.
// - `McpNode.McpNodeData` / `McpNode.ToolParameter` (collide with workflow-definition)
// - `SlackWorkflowValidator.ValidationResult` (collides with validate-workflow)
export * as McpNode from './types/mcp-node';
export * as SlackWorkflowValidator from './utils/workflow-validator';
