import { useEffect, useRef, useState } from 'react';

function TraversalLog({ steps, currentStep, shouldHighlightCurrentNode, focusedNodeId }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [logPosition, setLogPosition] = useState({ x: null, y: 100 });
  const [dragState, setDragState] = useState(null);
  const logRef = useRef(null);
  const rowRefs = useRef({});

  const visibleSteps = steps.slice(0, currentStep);
  let currentNodeId = null;
  if (shouldHighlightCurrentNode) {
    currentNodeId = steps[currentStep - 1]?.nodeId || null;
  }

  useEffect(() => {
    if (isMinimized || !focusedNodeId) return;
    const focusedRow = rowRefs.current[focusedNodeId];
    if (!focusedRow) return;

    focusedRow.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    });
  }, [focusedNodeId, visibleSteps.length, isMinimized]);

  useEffect(() => {
    if (!dragState) return undefined;

    function handleMouseMove(event) {
      moveDrag(event);
    }

    function handleMouseUp() {
      stopDrag();
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  function startDrag(event) {
    if (event.button !== 0) return;
    const element = logRef.current;
    const parent = element?.offsetParent;
    if (!element || !parent) return;

    const elementRect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const startingLeft = logPosition.x ?? elementRect.left - parentRect.left;
    const startingTop = logPosition.y ?? elementRect.top - parentRect.top;

    setLogPosition({ x: startingLeft, y: startingTop });
    setDragState({
      startX: event.clientX,
      startY: event.clientY,
      startPosition: { x: startingLeft, y: startingTop },
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
      width: elementRect.width,
      height: elementRect.height,
    });
  }

  function moveDrag(event) {
    if (!dragState) return;
    const nextLeft = dragState.startPosition.x + event.clientX - dragState.startX;
    const nextTop = dragState.startPosition.y + event.clientY - dragState.startY;
    setLogPosition({
      x: Math.min(Math.max(8, nextLeft), Math.max(8, dragState.parentWidth - dragState.width - 8)),
      y: Math.min(Math.max(8, nextTop), Math.max(8, dragState.parentHeight - dragState.height - 8)),
    });
  }

  function stopDrag() {
    setDragState(null);
  }

  function getRowClass(stepData) {
    let statusClass = 'visited';
    let currentClass = '';
    let focusedClass = '';

    if (stepData.status === 'match') {
      statusClass = 'match';
    }
    if (stepData.nodeId === currentNodeId) {
      currentClass = ' current';
    }
    if (stepData.nodeId === focusedNodeId) {
      focusedClass = ' focused';
    }

    return `log-row ${statusClass}${currentClass}${focusedClass}`;
  }

  let logClassName = 'traversal-log';
  if (isMinimized) {
    logClassName += ' minimized';
  }

  let logPositionStyle;
  if (logPosition.x === null) {
    logPositionStyle = { top: logPosition.y, right: 28 };
  } else {
    logPositionStyle = { left: logPosition.x, top: logPosition.y, right: 'auto' };
  }

  let minimizeLabel = 'Minimize traversal log';
  let minimizeTitle = 'Minimize';
  if (isMinimized) {
    minimizeLabel = 'Expand traversal log';
    minimizeTitle = 'Expand';
  }

  let logBody = null;
  if (!isMinimized) {
    let logContent = <div className="log-empty">No visited nodes yet.</div>;
    if (visibleSteps.length !== 0) {
      logContent = visibleSteps.map(stepData => (
        <div
          key={stepData.step}
          ref={element => {
            if (element) {
              rowRefs.current[stepData.nodeId] = element;
            } else {
              delete rowRefs.current[stepData.nodeId];
            }
          }}
          className={getRowClass(stepData)}
        >
          <span className="log-step">#{stepData.step}</span>
          <span className="log-node">{stepData.nodeLabel}</span>
          <span className="log-tag">{stepData.tag}</span>
          <span className="log-status">{stepData.status}</span>
        </div>
      ));
    }

    logBody = <div className="log-body">{logContent}</div>;
  }

  return (
    <section
      ref={logRef}
      className={logClassName}
      style={logPositionStyle}
    >
      <div className="log-header" onMouseDown={startDrag}>
        <h2>Traversal log</h2>
        <button
          type="button"
          className="log-minimize"
          onMouseDown={event => event.stopPropagation()}
          onClick={() => setIsMinimized(previousMinimized => !previousMinimized)}
          aria-label={minimizeLabel}
          title={minimizeTitle}
        >
          -
        </button>
      </div>

      {logBody}
    </section>
  );
}

export default TraversalLog;
