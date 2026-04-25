function NodePopup({ node, position, onClose }) {
  if (!node) return null;

  let attributeText;
  if (node.className) {
    attributeText = `class="${node.className}"`;
  } else {
    attributeText = Object.entries(node.attributes || {})
      .slice(0, 1)
      .map(([attributeName, attributeValue]) => `${attributeName}="${attributeValue}"`)
      .join('');
  }

  return (
    <div
      className="node-popup"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <button className="popup-close" type="button" onClick={onClose} aria-label="Close node details">
        x
      </button>
      <div><strong>id :</strong> {node.id}</div>
      <div><strong>tag :</strong> {node.tag}</div>
      {node.isTextNode
        ? <div><strong>text :</strong> {node.textContent || '-'}</div>
        : <div><strong>attribute :</strong> {attributeText || '-'}</div>
      }
    </div>
  );
}

export default NodePopup;
