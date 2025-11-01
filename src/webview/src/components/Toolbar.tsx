/**
 * Claude Code Workflow Studio - Toolbar Component
 *
 * Provides Save and Load functionality for workflows
 */

import React, { useState, useEffect } from 'react';
import { vscode } from '../main';
import { useWorkflowStore } from '../stores/workflow-store';
import { saveWorkflow, loadWorkflowList } from '../services/vscode-bridge';
import { serializeWorkflow, deserializeWorkflow, validateWorkflow } from '../services/workflow-service';
import type { Workflow } from '@shared/types/messages';

interface ToolbarProps {
  onError: (error: { code: string; message: string; details?: unknown }) => void;
}

interface WorkflowListItem {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onError }) => {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore();
  const [workflowName, setWorkflowName] = useState('my-workflow');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

  const handleSave = async () => {
    if (!workflowName.trim()) {
      onError({
        code: 'VALIDATION_ERROR',
        message: 'Workflow name is required',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Serialize workflow
      const workflow = serializeWorkflow(nodes, edges, workflowName, 'Created with Workflow Studio');

      // Validate workflow before saving
      validateWorkflow(workflow);

      // Save if validation passes
      await saveWorkflow(workflow);
      console.log('Workflow saved successfully:', workflowName);
    } catch (error) {
      onError({
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Workflow validation failed',
        details: error,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Listen for workflow list updates from Extension
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === 'WORKFLOW_LIST_LOADED') {
        setWorkflows(message.payload?.workflows || []);
      } else if (message.type === 'LOAD_WORKFLOW') {
        // Load workflow into canvas
        const workflow: Workflow = message.payload?.workflow;
        if (workflow) {
          const { nodes: loadedNodes, edges: loadedEdges } = deserializeWorkflow(workflow);
          setNodes(loadedNodes);
          setEdges(loadedEdges);
          setWorkflowName(workflow.name);
        }
      } else if (message.type === 'EXPORT_SUCCESS') {
        console.log('Export successful:', message.payload);
        setIsExporting(false);
        // TODO: Show success notification
      } else if (message.type === 'ERROR') {
        console.error('Error received:', message.payload);
        if (isExporting) {
          setIsExporting(false);
        }
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setNodes, setEdges]);

  // Load workflow list on mount
  useEffect(() => {
    loadWorkflowList().catch((error) => {
      console.error('Failed to load initial workflow list:', error);
    });
  }, []);

  const handleRefreshList = async () => {
    setIsLoading(true);
    try {
      await loadWorkflowList();
    } catch (error) {
      onError({
        code: 'LOAD_FAILED',
        message: error instanceof Error ? error.message : 'Failed to load workflows',
        details: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadWorkflow = () => {
    if (!selectedWorkflowId) {
      onError({
        code: 'VALIDATION_ERROR',
        message: 'Please select a workflow to load',
      });
      return;
    }

    // Request to load specific workflow
    vscode.postMessage({
      type: 'LOAD_WORKFLOW',
      payload: { workflowId: selectedWorkflowId },
    });
  };

  const handleExport = async () => {
    if (!workflowName.trim()) {
      onError({
        code: 'VALIDATION_ERROR',
        message: 'Workflow name is required for export',
      });
      return;
    }

    setIsExporting(true);
    try {
      // Serialize workflow
      const workflow = serializeWorkflow(nodes, edges, workflowName, 'Created with Workflow Studio');

      // Validate workflow before export
      validateWorkflow(workflow);

      // Request export
      vscode.postMessage({
        type: 'EXPORT_WORKFLOW',
        payload: { workflow },
      });
    } catch (error) {
      onError({
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Workflow validation failed',
        details: error,
      });
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderBottom: '1px solid var(--vscode-panel-border)',
        backgroundColor: 'var(--vscode-editor-background)',
      }}
    >
      {/* Workflow Name Input */}
      <input
        type="text"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        placeholder="Workflow name"
        className="nodrag"
        style={{
          flex: 1,
          padding: '4px 8px',
          backgroundColor: 'var(--vscode-input-background)',
          color: 'var(--vscode-input-foreground)',
          border: '1px solid var(--vscode-input-border)',
          borderRadius: '2px',
          fontSize: '13px',
        }}
      />

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          padding: '4px 12px',
          backgroundColor: 'var(--vscode-button-background)',
          color: 'var(--vscode-button-foreground)',
          border: 'none',
          borderRadius: '2px',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          opacity: isSaving ? 0.6 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        style={{
          padding: '4px 12px',
          backgroundColor: 'var(--vscode-button-secondaryBackground)',
          color: 'var(--vscode-button-secondaryForeground)',
          border: 'none',
          borderRadius: '2px',
          cursor: isExporting ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          opacity: isExporting ? 0.6 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '20px',
          backgroundColor: 'var(--vscode-panel-border)',
        }}
      />

      {/* Workflow Selector */}
      <select
        value={selectedWorkflowId}
        onChange={(e) => setSelectedWorkflowId(e.target.value)}
        className="nodrag"
        style={{
          padding: '4px 8px',
          backgroundColor: 'var(--vscode-input-background)',
          color: 'var(--vscode-input-foreground)',
          border: '1px solid var(--vscode-input-border)',
          borderRadius: '2px',
          fontSize: '13px',
          minWidth: '150px',
        }}
      >
        <option value="">Select workflow...</option>
        {workflows.map((wf) => (
          <option key={wf.id} value={wf.id}>
            {wf.name}
          </option>
        ))}
      </select>

      {/* Load Button */}
      <button
        onClick={handleLoadWorkflow}
        disabled={!selectedWorkflowId}
        style={{
          padding: '4px 12px',
          backgroundColor: 'var(--vscode-button-secondaryBackground)',
          color: 'var(--vscode-button-secondaryForeground)',
          border: 'none',
          borderRadius: '2px',
          cursor: !selectedWorkflowId ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          opacity: !selectedWorkflowId ? 0.6 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        Load
      </button>

      {/* Refresh List Button */}
      <button
        onClick={handleRefreshList}
        disabled={isLoading}
        title="Refresh workflow list"
        style={{
          padding: '4px 8px',
          backgroundColor: 'var(--vscode-button-secondaryBackground)',
          color: 'var(--vscode-button-secondaryForeground)',
          border: 'none',
          borderRadius: '2px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        ↻
      </button>
    </div>
  );
};
