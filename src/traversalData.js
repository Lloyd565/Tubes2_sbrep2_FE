const DEFAULT_CANVAS_WIDTH = 2200;
const DEFAULT_CANVAS_HEIGHT = 1400;
const HORIZONTAL_NODE_SPACING = 118;
const VERTICAL_NODE_SPACING = 120;

function getArrayOrEmpty(possibleArray) {
  if (Array.isArray(possibleArray)) {
    return possibleArray;
  }
  return [];
}

function getNodeNumber(treeNode, fallbackNodeNumber) {
  return treeNode.node_number
    ?? treeNode.nodeNum
    ?? treeNode.NodeNum
    ?? treeNode.id
    ?? fallbackNodeNumber;
}

function getNodeClasses(treeNode) {
  if (Array.isArray(treeNode.classes)) return treeNode.classes;
  if (typeof treeNode.className === 'string') return treeNode.className.split(/\s+/).filter(Boolean);
  if (typeof treeNode.attributes?.class === 'string') return treeNode.attributes.class.split(/\s+/).filter(Boolean);
  return [];
}

function createFrontendNode(backendNode, nextNodeNumberRef, depth = 0, parentNodeId = null) {
  const fallbackNodeNumber = nextNodeNumberRef.next++;
  const rawNodeNumber = getNodeNumber(backendNode, fallbackNodeNumber);
  const nodeId = String(rawNodeNumber);
  const tagName = backendNode.tag || backendNode.name || backendNode.type || 'node';
  const isTextNode = tagName === '#text';
  const nodeAttributes = backendNode.attributes || backendNode.attrs || {};
  const classNames = getNodeClasses({ ...backendNode, attributes: nodeAttributes });
  const classAttributeText = classNames.join(' ');
  const childNodes = getArrayOrEmpty(backendNode.children).map(childNode =>
    createFrontendNode(childNode, nextNodeNumberRef, depth + 1, nodeId)
  );
  let displayNodeNumber = fallbackNodeNumber;
  if (Number.isFinite(Number(rawNodeNumber))) {
    displayNodeNumber = Number(rawNodeNumber);
  }

  return {
    id: nodeId,
    numericLabel: displayNodeNumber,
    label: backendNode.label || String(rawNodeNumber),
    tag: tagName,
    isTextNode,
    textContent: isTextNode ? (backendNode.text || '') : '',
    className: classAttributeText,
    attributes: nodeAttributes,
    depth: backendNode.depth ?? depth,
    parentId: parentNodeId,
    children: childNodes,
    backendVisited: Boolean(backendNode.visited ?? backendNode.Visited),
    isMatch: Boolean(backendNode.matched ?? backendNode.isMatch ?? backendNode.Matched),
  };
}

function getBreadthFirstNodes(rootNode) {
  const orderedNodes = [];
  const nodesToVisit = [rootNode];
  while (nodesToVisit.length) {
    const currentNode = nodesToVisit.shift();
    orderedNodes.push(currentNode);
    currentNode.children.forEach(childNode => nodesToVisit.push(childNode));
  }
  return orderedNodes;
}

function getDepthFirstNodes(rootNode) {
  const orderedNodes = [];
  function visitNode(currentNode) {
    orderedNodes.push(currentNode);
    currentNode.children.forEach(visitNode);
  }
  visitNode(rootNode);
  return orderedNodes;
}

function getFlatTree(rootNode) {
  const flatNodes = [];
  const treeEdges = [];

  function collectNode(currentNode) {
    flatNodes.push(currentNode);
    currentNode.children.forEach(childNode => {
      treeEdges.push({ parentNodeId: currentNode.id, childNodeId: childNode.id });
      collectNode(childNode);
    });
  }

  if (rootNode) collectNode(rootNode);
  return { nodes: flatNodes, edges: treeEdges };
}

function layoutTree(rootNode) {
  let leafIndex = 0;
  let deepestNodeDepth = 0;

  function assignNodePosition(currentNode) {
    deepestNodeDepth = Math.max(deepestNodeDepth, currentNode.depth);
    if (!currentNode.children.length) {
      currentNode.x = 120 + leafIndex * HORIZONTAL_NODE_SPACING;
      leafIndex += 1;
    } else {
      currentNode.children.forEach(assignNodePosition);
      const firstChild = currentNode.children[0];
      const lastChild = currentNode.children[currentNode.children.length - 1];
      currentNode.x = (firstChild.x + lastChild.x) / 2;
    }
    currentNode.y = 88 + currentNode.depth * VERTICAL_NODE_SPACING;
  }

  assignNodePosition(rootNode);
  const { nodes, edges } = getFlatTree(rootNode);
  const leftMostNodeX = Math.min(...nodes.map(treeNode => treeNode.x));
  let horizontalShift = 0;
  if (leftMostNodeX < 80) {
    horizontalShift = 80 - leftMostNodeX;
  }
  nodes.forEach(treeNode => {
    treeNode.x += horizontalShift;
  });

  const canvasWidth = Math.max(
    DEFAULT_CANVAS_WIDTH,
    Math.max(...nodes.map(treeNode => treeNode.x)) + 240
  );
  const canvasHeight = Math.max(
    DEFAULT_CANVAS_HEIGHT,
    160 + (deepestNodeDepth + 1) * VERTICAL_NODE_SPACING
  );

  return { nodes, edges, width: canvasWidth, height: canvasHeight };
}

function buildTraversalSteps(rootNode, algorithm) {
  let orderedNodes;
  if (algorithm === 'dfs') {
    orderedNodes = getDepthFirstNodes(rootNode);
  } else {
    orderedNodes = getBreadthFirstNodes(rootNode);
  }
  const backendMarkedVisitedNodes = orderedNodes.some(treeNode => treeNode.backendVisited);
  let visitedNodes;
  if (backendMarkedVisitedNodes) {
    visitedNodes = orderedNodes.filter(treeNode => treeNode.backendVisited && !treeNode.isTextNode);
  } else {
    visitedNodes = orderedNodes.filter(treeNode => !treeNode.isTextNode);
  }

  return visitedNodes.map((treeNode, stepIndex) => {
    let nodeLabel;
    if (treeNode.isTextNode && treeNode.textContent) {
      const truncated = treeNode.textContent.length > 18
        ? treeNode.textContent.slice(0, 18) + '…'
        : treeNode.textContent;
      nodeLabel = `"${truncated}"`;
    } else {
      nodeLabel = `Node ${treeNode.numericLabel}`;
    }
    return {
      step: stepIndex + 1,
      nodeId: treeNode.id,
      nodeLabel,
      tag: treeNode.tag,
      status: getStepStatus(treeNode),
      isMatch: treeNode.isMatch,
    };
  });
}

function getStepStatus(treeNode) {
  if (treeNode.isMatch) {
    return 'match';
  }
  return 'visited';
}

export function normalizeTraversalResponse(backendResponse, algorithm, request) {
  if (!backendResponse?.tree) {
    throw new Error('Backend response did not include a traversal tree.');
  }

  const nextNodeNumberRef = { next: 1 };
  const rootNode = createFrontendNode(backendResponse.tree, nextNodeNumberRef);
  const traversalSteps = buildTraversalSteps(rootNode, algorithm);
  const treeLayout = layoutTree(rootNode);
  const matchedNodes = getArrayOrEmpty(backendResponse.matches);
  const traversalStats = backendResponse.stats || {};

  return {
    root: rootNode,
    nodes: treeLayout.nodes,
    edges: treeLayout.edges,
    width: treeLayout.width,
    height: treeLayout.height,
    steps: traversalSteps,
    matches: matchedNodes,
    request,
    logFile: backendResponse.log_file || '',
    stats: {
      visitedCount: traversalStats.visited_count,
      matchCount: traversalStats.match_count,
      maxDepth: traversalStats.max_depth,
      durationMs: traversalStats.duration_ms,
    },
  };
}
