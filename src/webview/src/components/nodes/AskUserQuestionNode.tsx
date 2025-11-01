/**
 * Claude Code Workflow Studio - AskUserQuestion Node Component
 *
 * Custom React Flow node for AskUserQuestion with dynamic 2-4 output ports
 * Based on: /specs/001-cc-wf-studio/research.md section 3.3
 */

import type { AskUserQuestionData } from '@shared/types/workflow-definition';
import React, { useEffect } from 'react';
import { Handle, type NodeProps, Position, useUpdateNodeInternals } from 'reactflow';

/**
 * AskUserQuestionNode Component
 */
export const AskUserQuestionNodeComponent: React.FC<NodeProps<AskUserQuestionData>> = React.memo(
  ({ id, data, selected }) => {
    const updateNodeInternals = useUpdateNodeInternals();

    // Update React Flow's internal calculations when port count changes
    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    return (
      <div
        className={`ask-user-question-node ${selected ? 'selected' : ''}`}
        style={{
          padding: '12px',
          borderRadius: '8px',
          border: `2px solid ${selected ? 'var(--vscode-focusBorder)' : 'var(--vscode-panel-border)'}`,
          backgroundColor: 'var(--vscode-editor-background)',
          minWidth: '200px',
          maxWidth: '300px',
        }}
      >
        {/* Node Header */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--vscode-descriptionForeground)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Ask User Question
        </div>

        {/* Question Text */}
        <div
          style={{
            fontSize: '13px',
            color: 'var(--vscode-foreground)',
            marginBottom: '12px',
            fontWeight: 500,
          }}
        >
          {data.questionText || 'Untitled Question'}
        </div>

        {/* Options List */}
        {data.options && data.options.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            {data.options.map((option) => (
              <div
                key={option.label}
                style={{
                  fontSize: '11px',
                  color: 'var(--vscode-descriptionForeground)',
                  backgroundColor: 'var(--vscode-badge-background)',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  marginBottom: '4px',
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}

        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Top}
          id="input"
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: 'var(--vscode-button-background)',
            border: '2px solid var(--vscode-button-foreground)',
          }}
        />

        {/* Dynamic Output Handles (2-4 branches) */}
        <div style={{ position: 'relative' }}>
          {data.options.map((option, i) => (
            <Handle
              key={`branch-${option.label}`}
              type="source"
              position={Position.Bottom}
              id={`branch-${i}`}
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: 'var(--vscode-button-background)',
                border: '2px solid var(--vscode-button-foreground)',
                left: `${20 + i * 60}px`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }
);

AskUserQuestionNodeComponent.displayName = 'AskUserQuestionNode';
