/**
 * Claude Code Workflow Studio - Extension Entry Point
 *
 * Main activation and deactivation logic for the VSCode extension.
 */

import * as vscode from 'vscode';
import { registerOpenEditorCommand } from './commands/open-editor';

/**
 * Extension activation function
 * Called when the extension is activated (when the command is first invoked)
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Claude Code Workflow Studio is now active');

  // Register commands
  registerOpenEditorCommand(context);

  console.log('Claude Code Workflow Studio: All commands registered');
}

/**
 * Extension deactivation function
 * Called when the extension is deactivated
 */
export function deactivate(): void {
  console.log('Claude Code Workflow Studio is now deactivated');
  // Cleanup if needed
}
