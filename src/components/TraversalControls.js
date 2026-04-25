function TraversalControls({
  currentStep,
  totalSteps,
  isPlaying,
  onTogglePlay,
  onStepChange,
  playbackSpeed,
  onPlaybackSpeedChange,
  zoom,
  onZoomChange,
}) {
  let displayStep = 0;
  let minStep = 0;
  if (totalSteps) {
    displayStep = Math.min(Math.max(currentStep, 1), totalSteps);
    minStep = 1;
  }

  let playLabel = 'Play';
  if (isPlaying) {
    playLabel = 'Pause';
  }

  function keepZoomInAllowedRange(nextZoom) {
    return Math.min(2.4, Math.max(0.2, nextZoom));
  }

  return (
    <div className="traversal-controls" aria-label="Traversal controls">
      <div className="controls-spacer" />

      <div className="controls-center">
        <button
          className="play-pill"
          type="button"
          onClick={onTogglePlay}
          disabled={!totalSteps}
          aria-label={`${playLabel} traversal`}
          title={playLabel}
        >
          {playLabel}
        </button>

        <input
          className="progress-slider"
          type="range"
          min={minStep}
          max={totalSteps || 0}
          value={displayStep}
          onChange={event => onStepChange(Number(event.target.value))}
          disabled={!totalSteps}
          aria-label="Traversal progress"
        />

        <div className="speed-controls" aria-label="Animation duration">
          {['1', '2', '4'].map(playbackSpeedOption => (
            (() => {
              let speedButtonClass = 'speed-button';
              if (playbackSpeed === playbackSpeedOption) {
                speedButtonClass += ' active';
              }
              return (
                <button
                  key={playbackSpeedOption}
                  className={speedButtonClass}
                  type="button"
                  onClick={() => onPlaybackSpeedChange(playbackSpeedOption)}
                  aria-pressed={playbackSpeed === playbackSpeedOption}
                  title={`${playbackSpeedOption}x duration`}
                >
                  {playbackSpeedOption}x
                </button>
              );
            })()
          ))}
        </div>

        <span className="progress-text">
          {displayStep} / {totalSteps || 0}
        </span>
      </div>

      <div className="zoom-controls" aria-label="Zoom controls">
        <button
          className="zoom-button zoom-out"
          type="button"
          onClick={() => onZoomChange(keepZoomInAllowedRange(zoom - 0.1))}
          aria-label="Zoom out"
          title="Zoom out"
        >
          -
        </button>
        <span className="zoom-text">{Math.round(zoom * 100)}%</span>
        <button
          className="zoom-button zoom-in"
          type="button"
          onClick={() => onZoomChange(keepZoomInAllowedRange(zoom + 0.1))}
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default TraversalControls;
