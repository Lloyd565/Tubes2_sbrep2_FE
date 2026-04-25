import { useEffect, useState } from "react";
import TraversalControls from "./TraversalControls";
import TraversalLog from "./TraversalLog";
import TreeCanvas from "./TreeCanvas";

function MainPanel({
  traversalResult,
  currentStep,
  onStepChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onPlaybackSpeedChange,
  zoom,
  onZoomChange,
}) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const totalStepCount = traversalResult?.steps?.length || 0;
  const shouldHighlightCurrentNode = Boolean(totalStepCount && currentStep < totalStepCount);
  const currentLogNodeId = traversalResult?.steps[currentStep - 1]?.nodeId || null;
  const highlightedLogNodeId = selectedNodeId || currentLogNodeId;

  useEffect(() => {
    setSelectedNodeId(null);
    setIsHelpOpen(false);
  }, [traversalResult]);

  let panelContent = (
    <div className="empty-state">Configure and Tree should appear here..</div>
  );
  let helpPopup = null;
  if (isHelpOpen) {
    helpPopup = (
      <div
        className="help-popup-backdrop"
        role="presentation"
        onClick={() => setIsHelpOpen(false)}
      >
        <section
          className="help-popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-popup-title"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="help-popup-close"
            type="button"
            onClick={() => setIsHelpOpen(false)}
            aria-label="Close help"
          >
            x
          </button>
          <h2 id="help-popup-title">Help</h2>
          <p>
            1. Atur zoom dengan menekan ikon + atau - di bagian kanan atas, atau
            gunakan mouse scroll wheel.
          </p>
          <p>
            2. Untuk menggeser tree, tahan tombol kiri mouse lalu gerakkan
            mouse.
          </p>
          <p>
            3. Untuk melihat atribut setiap node, lihat traversal log atau klik
            node pada visualisasi pohon.
          </p>
          <p>
            4. Traversal log dapat digeser dengan dengan menahan cursor di
            bagian atas traversal log lalu gerakkan mouse
          </p>
          <p>
            5. Tampilan Traversal log dapat di-collapse dengan menekan ikon '-'
            di kanan atas traversal log
          </p>
        </section>
      </div>
    );
  }

  if (traversalResult) {
    panelContent = (
      <>
        <TraversalControls
          currentStep={currentStep}
          totalSteps={totalStepCount}
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onStepChange={onStepChange}
          playbackSpeed={playbackSpeed}
          onPlaybackSpeedChange={onPlaybackSpeedChange}
          zoom={zoom}
          onZoomChange={onZoomChange}
        />

        <TreeCanvas
          traversalResult={traversalResult}
          currentStep={currentStep}
          shouldHighlightCurrentNode={shouldHighlightCurrentNode}
          onNodeFocus={setSelectedNodeId}
          zoom={zoom}
          onZoomChange={onZoomChange}
        />

        <button
          className="canvas-help"
          type="button"
          onClick={() => setIsHelpOpen(true)}
        >
          Help
        </button>

        {helpPopup}

        <TraversalLog
          steps={traversalResult.steps}
          currentStep={currentStep}
          shouldHighlightCurrentNode={shouldHighlightCurrentNode}
          focusedNodeId={highlightedLogNodeId}
        />
      </>
    );
  }

  return <main className="main-panel">{panelContent}</main>;
}

export default MainPanel;
