import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import NodePopup from './NodePopup';

const NODE_RADIUS = 22;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2.4;
const FIT_MAX_ZOOM = 1.05;
const FIT_PADDING = 96;

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function getTreeBounds(nodes) {
  const nodeXPositions = nodes.map(node => node.x);
  const nodeYPositions = nodes.map(node => node.y);
  const leftEdge = Math.min(...nodeXPositions) - NODE_RADIUS;
  const rightEdge = Math.max(...nodeXPositions) + NODE_RADIUS;
  const topEdge = Math.min(...nodeYPositions) - NODE_RADIUS;
  const bottomEdge = Math.max(...nodeYPositions) + NODE_RADIUS;

  return {
    leftEdge,
    rightEdge,
    topEdge,
    bottomEdge,
    width: Math.max(1, rightEdge - leftEdge),
    height: Math.max(1, bottomEdge - topEdge),
    centerX: (leftEdge + rightEdge) / 2,
    centerY: (topEdge + bottomEdge) / 2,
  };
}

function TreeCanvas({
  traversalResult,
  currentStep,
  shouldHighlightCurrentNode,
  onNodeFocus,
  zoom,
  onZoomChange,
}) {
  const [canvasPan, setCanvasPan] = useState({ x: 90, y: 62 });
  const [dragState, setDragState] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const canvasRef = useRef(null);

  const stepState = useMemo(() => {
    const visitedNodeIds = new Set(
      traversalResult.steps.slice(0, currentStep).map(traversalStep => traversalStep.nodeId)
    );
    let currentNodeId = null;
    if (shouldHighlightCurrentNode) {
      currentNodeId = traversalResult.steps[currentStep - 1]?.nodeId || null;
    }
    return { visitedNodeIds, currentNodeId };
  }, [traversalResult.steps, currentStep, shouldHighlightCurrentNode]);

  const nodeById = useMemo(() => {
    const nodeMap = new Map();
    traversalResult.nodes.forEach(node => nodeMap.set(node.id, node));
    return nodeMap;
  }, [traversalResult.nodes]);

  const highlightedPath = useMemo(() => {
    const highlightedNodeIds = new Set();
    const highlightedEdgeIds = new Set();
    const reachedMatchSteps = traversalResult.steps
      .slice(0, currentStep)
      .filter(traversalStep => traversalStep.isMatch);

    reachedMatchSteps.forEach(traversalStep => {
      let currentNode = nodeById.get(traversalStep.nodeId);
      const matchedNodeId = currentNode?.id;
      while (currentNode) {
        if (currentNode.id !== matchedNodeId) {
          highlightedNodeIds.add(currentNode.id);
        }
        if (currentNode.parentId) {
          highlightedEdgeIds.add(`${currentNode.parentId}-${currentNode.id}`);
        }
        if (currentNode.parentId) {
          currentNode = nodeById.get(currentNode.parentId);
        } else {
          currentNode = null;
        }
      }
    });

    return { nodeIds: highlightedNodeIds, edgeIds: highlightedEdgeIds };
  }, [traversalResult.steps, currentStep, nodeById]);

  let selectedNode = null;
  if (selectedNodeId) {
    selectedNode = nodeById.get(selectedNodeId);
  }

  let popupPosition = { x: 0, y: 0 };
  if (selectedNode) {
    popupPosition = {
      x: canvasPan.x + selectedNode.x * zoom - 92,
      y: canvasPan.y + selectedNode.y * zoom + 30,
    };
  }

  useLayoutEffect(() => {
    function fitTreeToCanvas() {
      const canvas = canvasRef.current;
      if (!canvas || !traversalResult.nodes.length) return;

      const canvasRectangle = canvas.getBoundingClientRect();
      const treeBounds = getTreeBounds(traversalResult.nodes);
      const availableWidth = Math.max(1, canvasRectangle.width - FIT_PADDING * 2);
      const availableHeight = Math.max(1, canvasRectangle.height - FIT_PADDING * 2);
      const fittedZoom = clampZoom(
        Math.min(FIT_MAX_ZOOM, availableWidth / treeBounds.width, availableHeight / treeBounds.height)
      );

      setCanvasPan({
        x: canvasRectangle.width / 2 - treeBounds.centerX * fittedZoom,
        y: canvasRectangle.height / 2 - treeBounds.centerY * fittedZoom,
      });
      setSelectedNodeId(null);
      onZoomChange(fittedZoom);
    }

    fitTreeToCanvas();
    window.addEventListener('resize', fitTreeToCanvas);
    return () => window.removeEventListener('resize', fitTreeToCanvas);
  }, [traversalResult, onZoomChange]);

  function handleMouseDown(event) {
    if (event.button !== 0) return;
    setDragState({
      startX: event.clientX,
      startY: event.clientY,
      startPan: canvasPan,
    });
  }

  function handleMouseMove(event) {
    if (!dragState) return;
    setCanvasPan({
      x: dragState.startPan.x + event.clientX - dragState.startX,
      y: dragState.startPan.y + event.clientY - dragState.startY,
    });
  }

  function handleMouseUp() {
    setDragState(null);
  }

  function handleWheel(event) {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasRectangle = canvas.getBoundingClientRect();
    const pointerX = event.clientX - canvasRectangle.left;
    const pointerY = event.clientY - canvasRectangle.top;
    const treeX = (pointerX - canvasPan.x) / zoom;
    const treeY = (pointerY - canvasPan.y) / zoom;
    let zoomMultiplier = 1.1;
    if (event.deltaY > 0) {
      zoomMultiplier = 0.9;
    }
    const nextZoom = clampZoom(zoom * zoomMultiplier);

    setCanvasPan({
      x: pointerX - treeX * nextZoom,
      y: pointerY - treeY * nextZoom,
    });
    onZoomChange(nextZoom);
  }

  function getNodeClass(node) {
    let pathClass = '';
    if (highlightedPath.nodeIds.has(node.id)) {
      pathClass = ' path-highlight';
    }
    if (stepState.currentNodeId === node.id) return 'current';
    if (stepState.visitedNodeIds.has(node.id) && node.isMatch) return `match${pathClass}`;
    if (stepState.visitedNodeIds.has(node.id)) return `visited${pathClass}`;
    return `pending${pathClass}`;
  }

  let canvasClassName = 'tree-canvas';
  if (dragState) {
    canvasClassName += ' dragging';
  }

  return (
    <div
      ref={canvasRef}
      className={canvasClassName}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <svg
        className="tree-svg"
        role="img"
        aria-label="Tree traversal visualization"
        onMouseDown={handleMouseDown}
      >
        <g transform={`translate(${canvasPan.x} ${canvasPan.y}) scale(${zoom})`}>
          {traversalResult.edges.map(edge => {
            const parentNode = nodeById.get(edge.parentNodeId);
            const childNode = nodeById.get(edge.childNodeId);
            if (!parentNode || !childNode) return null;
            let edgeClassName = 'tree-edge';
            if (highlightedPath.edgeIds.has(`${edge.parentNodeId}-${edge.childNodeId}`)) {
              edgeClassName += ' path-highlight';
            }
            return (
              <line
                key={`${edge.parentNodeId}-${edge.childNodeId}`}
                className={edgeClassName}
                x1={parentNode.x}
                y1={parentNode.y}
                x2={childNode.x}
                y2={childNode.y}
              />
            );
          })}

          {traversalResult.nodes.map(node => (
            <g
              key={node.id}
              className={`tree-node-circle ${getNodeClass(node)}`}
              transform={`translate(${node.x} ${node.y})`}
              onClick={event => {
                event.stopPropagation();
                setSelectedNodeId(node.id);
                onNodeFocus(node.id);
              }}
            >
              <circle r={NODE_RADIUS} />
              <text textAnchor="middle" dominantBaseline="central">
                {node.numericLabel}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <NodePopup
        node={selectedNode}
        position={popupPosition}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  );
}

export default TreeCanvas;
