/**
 * Claude Code Workflow Studio - Export Service
 *
 * Handles workflow export to .claude format
 * Based on: /specs/001-cc-wf-studio/spec.md Export Format Details
 */

import type { Workflow, WorkflowNode, Connection, SubAgentNode, AskUserQuestionNode } from '../../shared/types/workflow-definition';
import { FileService } from './file-service';
import * as path from 'path';

/**
 * Export workflow to .claude format
 *
 * @param workflow - Workflow to export
 * @param fileService - File service instance
 * @returns Array of exported file paths
 */
export async function exportWorkflow(
  workflow: Workflow,
  fileService: FileService
): Promise<string[]> {
  const exportedFiles: string[] = [];
  const workspacePath = fileService.getWorkspacePath();

  // Create .claude directories if they don't exist
  const agentsDir = path.join(workspacePath, '.claude', 'agents');
  const commandsDir = path.join(workspacePath, '.claude', 'commands');

  await fileService.createDirectory(path.join(workspacePath, '.claude'));
  await fileService.createDirectory(agentsDir);
  await fileService.createDirectory(commandsDir);

  // Export Sub-Agent nodes
  const subAgentNodes = workflow.nodes.filter((node) => node.type === 'subAgent') as SubAgentNode[];
  for (const node of subAgentNodes) {
    const fileName = nodeNameToFileName(node.name);
    const filePath = path.join(agentsDir, `${fileName}.md`);
    const content = generateSubAgentFile(node);
    await fileService.writeFile(filePath, content);
    exportedFiles.push(filePath);
  }

  // Export SlashCommand
  const commandFileName = nodeNameToFileName(workflow.name);
  const commandFilePath = path.join(commandsDir, `${commandFileName}.md`);
  const commandContent = generateSlashCommandFile(workflow);
  await fileService.writeFile(commandFilePath, commandContent);
  exportedFiles.push(commandFilePath);

  return exportedFiles;
}

/**
 * Convert node name to filename
 *
 * @param name - Node name
 * @returns Filename (lowercase, spaces to hyphens)
 */
export function nodeNameToFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');
}

/**
 * Generate Sub-Agent configuration file content
 *
 * @param node - Sub-Agent node
 * @returns Markdown content with YAML frontmatter
 */
function generateSubAgentFile(node: SubAgentNode): string {
  const { name, data } = node;
  const agentName = nodeNameToFileName(name);

  // YAML frontmatter
  const frontmatter = [
    '---',
    `name: ${agentName}`,
    `description: ${data.description || name}`,
  ];

  // Add optional fields
  if (data.tools && data.tools.length > 0) {
    frontmatter.push(`tools: ${data.tools}`);
  }

  if (data.model) {
    frontmatter.push(`model: ${data.model}`);
  } else {
    frontmatter.push('model: sonnet');
  }

  frontmatter.push('---');
  frontmatter.push('');

  // Prompt body
  const prompt = data.prompt || '';

  return frontmatter.join('\n') + prompt;
}

/**
 * Generate SlashCommand file content
 *
 * @param workflow - Workflow definition
 * @returns Markdown content with YAML frontmatter
 */
function generateSlashCommandFile(workflow: Workflow): string {
  // YAML frontmatter
  const frontmatter = [
    '---',
    `description: ${workflow.description || workflow.name}`,
    'allowed-tools: Task,AskUserQuestion',
    '---',
    '',
  ].join('\n');

  // Workflow execution logic
  const executionLogic = generateWorkflowExecutionLogic(workflow);

  return frontmatter + executionLogic;
}

/**
 * Generate workflow execution logic
 *
 * @param workflow - Workflow definition
 * @returns Markdown text with execution instructions
 */
function generateWorkflowExecutionLogic(workflow: Workflow): string {
  const { nodes, connections } = workflow;
  const instructions: string[] = [];

  // Find start node (node with no incoming connections)
  const targetNodeIds = new Set(connections.map((conn) => conn.to));
  const startNodes = nodes.filter((node) => !targetNodeIds.has(node.id));

  if (startNodes.length === 0) {
    return 'エラー: 開始ノードが見つかりません。';
  }

  // Build execution flow from start node
  const visited = new Set<string>();
  const queue = [...startNodes];

  while (queue.length > 0) {
    const currentNode = queue.shift()!;
    if (visited.has(currentNode.id)) {
      continue;
    }
    visited.add(currentNode.id);

    // Generate instruction for current node
    if (currentNode.type === 'subAgent') {
      const agentName = nodeNameToFileName(currentNode.name);
      instructions.push(`Taskツールを使用して「${agentName}」Sub-Agentを実行してください。`);
      instructions.push('');

      // Find next nodes
      const outgoingConnections = connections.filter((conn) => conn.from === currentNode.id);
      const nextNodes = outgoingConnections
        .map((conn) => nodes.find((n) => n.id === conn.to))
        .filter((n) => n !== undefined);

      queue.push(...nextNodes);
    } else if (currentNode.type === 'askUserQuestion') {
      const askNode = currentNode as AskUserQuestionNode;
      const branchingLogic = generateBranchingLogic(askNode, nodes, connections);
      instructions.push(branchingLogic);
      instructions.push('');

      // Add branching nodes to queue
      const outgoingConnections = connections.filter((conn) => conn.from === currentNode.id);
      const nextNodes = outgoingConnections
        .map((conn) => nodes.find((n) => n.id === conn.to))
        .filter((n) => n !== undefined);

      queue.push(...nextNodes);
    }
  }

  return instructions.join('\n');
}

/**
 * Generate AskUserQuestion branching logic
 *
 * @param node - AskUserQuestion node
 * @param allNodes - All workflow nodes
 * @param connections - All connections
 * @returns Markdown text with branching instructions
 */
function generateBranchingLogic(
  node: AskUserQuestionNode,
  allNodes: WorkflowNode[],
  connections: Connection[]
): string {
  const { data } = node;
  const instructions: string[] = [];

  instructions.push('AskUserQuestionツールを使用して以下の質問をユーザーに行ってください:');
  instructions.push(`- 質問: "${data.questionText}"`);
  instructions.push('- 選択肢:');

  // Find outgoing connections for each option
  const outgoingConnections = connections.filter((conn) => conn.from === node.id);

  for (const option of data.options) {
    const connection = outgoingConnections.find((conn) => conn.condition === option.label);
    if (connection) {
      const targetNode = allNodes.find((n) => n.id === connection.to);
      if (targetNode && targetNode.type === 'subAgent') {
        const agentName = nodeNameToFileName(targetNode.name);
        instructions.push(`  - "${option.label}" → Taskツールで「${agentName}」Sub-Agentを実行`);
      }
    } else {
      instructions.push(`  - "${option.label}" → (未接続)`);
    }
  }

  instructions.push('');
  instructions.push('ユーザーの選択に応じて、対応するSub-Agentを実行してください。');

  return instructions.join('\n');
}
