/**
 * Claude Code Workflow Studio - Export Workflow Command
 *
 * Exports workflow to .claude format (agents/*.md and commands/*.md)
 */

import * as vscode from 'vscode';
import type { Webview } from 'vscode';
import { FileService } from '../services/file-service';
import { exportWorkflow } from '../services/export-service';
import type { ExportWorkflowPayload, ExportSuccessPayload } from '../../shared/types/messages';

/**
 * Export workflow to .claude format
 *
 * @param fileService - File service instance
 * @param webview - Webview to send response to
 * @param payload - Export workflow payload
 * @param requestId - Request ID for response matching
 */
export async function handleExportWorkflow(
  fileService: FileService,
  webview: Webview,
  payload: ExportWorkflowPayload,
  requestId?: string
): Promise<void> {
  try {
    // Export workflow
    const exportedFiles = await exportWorkflow(payload.workflow, fileService);

    // Send success response
    const successPayload: ExportSuccessPayload = {
      exportedFiles,
      timestamp: new Date().toISOString(),
    };

    webview.postMessage({
      type: 'EXPORT_SUCCESS',
      requestId,
      payload: successPayload,
    });

    // Show success notification
    vscode.window.showInformationMessage(
      `Workflow "${payload.workflow.name}" exported successfully! ${exportedFiles.length} files created.`
    );
  } catch (error) {
    // Send error response
    webview.postMessage({
      type: 'ERROR',
      requestId,
      payload: {
        code: 'EXPORT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to export workflow',
        details: error,
      },
    });

    // Show error notification
    vscode.window.showErrorMessage(
      `Failed to export workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
