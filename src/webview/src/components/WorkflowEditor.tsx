/**
 * Claude Code Workflow Studio - Workflow Editor Component
 *
 * Main React Flow canvas for visual workflow editing
 * Based on: /specs/001-cc-wf-studio/research.md section 3.4
 */

import type React from 'react';
import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  type DefaultEdgeOptions,
} from 'reactflow';
import { useWorkflowStore } from '../stores/workflow-store';
import { AskUserQuestionNodeComponent } from './nodes/AskUserQuestionNode';
import { SubAgentNodeComponent } from './nodes/SubAgentNode';

/**
 * Node types registration (memoized outside component for performance)
 * Based on: /specs/001-cc-wf-studio/research.md section 3.1
 */
const nodeTypes: NodeTypes = {
  subAgent: SubAgentNodeComponent,
  askUserQuestion: AskUserQuestionNodeComponent,
};

/**
 * Default edge options (memoized)
 */
const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: false,
  style: { stroke: 'var(--vscode-foreground)', strokeWidth: 2 },
};

/**
 * Edge types (can be customized later)
 */
const edgeTypes: EdgeTypes = {};

/**
 * WorkflowEditor Component
 */
export const WorkflowEditor: React.FC = () => {
  // Get state and handlers from Zustand store
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeId } =
    useWorkflowStore();

  // Memoize callbacks for performance (research.md section 3.1)
  const handleNodesChange = useCallback(onNodesChange, []);
  const handleEdgesChange = useCallback(onEdgesChange, []);
  const handleConnect = useCallback(onConnect, []);

  // Handle node selection
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  // Handle pane click (deselect)
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // Memoize snap grid
  const snapGrid = useMemo<[number, number]>(() => [15, 15], []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid={true}
        snapGrid={snapGrid}
        fitView
        attributionPosition="bottom-left"
      >
        {/* Background grid */}
        <Background color="var(--vscode-panel-border)" gap={15} size={1} />

        {/* Controls (zoom, fit view, etc.) */}
        <Controls />

        {/* Mini map */}
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'subAgent':
                return 'var(--vscode-charts-blue)';
              case 'askUserQuestion':
                return 'var(--vscode-charts-orange)';
              default:
                return 'var(--vscode-foreground)';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.5)"
          style={{
            backgroundColor: 'var(--vscode-editor-background)',
            border: '1px solid var(--vscode-panel-border)',
          }}
        />
      </ReactFlow>
    </div>
  );
};
