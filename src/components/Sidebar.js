function ChevronIcon({ collapsed }) {
  let arrowPath = "M15 5l-7 7 7 7";
  if (collapsed) {
    arrowPath = "M9 5l7 7-7 7";
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={arrowPath} />
    </svg>
  );
}

function formatReportNumber(reportValue) {
  const numericValue = Number(reportValue);
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString("en-US");
  }
  return "-";
}

function formatTraversalTime(durationValue) {
  const durationInMilliseconds = Number(durationValue);
  if (!Number.isFinite(durationInMilliseconds)) return "-";
  if (durationInMilliseconds === 0) return "0 ms";
  if (durationInMilliseconds < 1) return `${durationInMilliseconds.toFixed(3)} ms`;
  if (durationInMilliseconds < 10) return `${durationInMilliseconds.toFixed(2)} ms`;
  return `${durationInMilliseconds.toFixed(1)} ms`;
}

function Sidebar({
  formValues,
  onChange,
  onRunTraversal,
  onReset,
  isCollapsed,
  onToggleCollapsed,
  validationError,
  canSubmit,
  isLoading,
  traversalResult,
  logDownloadUrl,
}) {
  const traversalStats = traversalResult?.stats || {};
  const hasTraversalLog = Boolean(logDownloadUrl);
  let sidebarClassName = "sidebar";
  let toggleLabel = "Collapse sidebar";
  let inputField = (
    <div className="field">
      <label htmlFor="raw-html">Raw HTML</label>
      <textarea
        id="raw-html"
        value={formValues.html}
        onChange={(event) => onChange("html", event.target.value)}
        placeholder="Insert html here"
        rows={12}
      />
    </div>
  );
  let resultLimitField = null;
  let downloadLogClassName = "download-log-button";
  let downloadHref;
  let sidebarMessageClassName = "sidebar-message";
  let actionLabel = "Go";

  if (isCollapsed) {
    sidebarClassName += " collapsed";
    toggleLabel = "Expand sidebar";
  }
  if (formValues.inputMode === "url") {
    inputField = (
      <div className="field">
        <label htmlFor="website-url">Website URL</label>
        <input
          id="website-url"
          type="url"
          value={formValues.url}
          onChange={(event) => onChange("url", event.target.value)}
          placeholder="Insert website url here..."
          autoComplete="off"
        />
      </div>
    );
  }
  if (formValues.resultMode === "top") {
    resultLimitField = (
      <div className="field">
        <label htmlFor="result-limit">Limit N</label>
        <input
          id="result-limit"
          type="number"
          min="1"
          value={formValues.limit}
          onChange={(event) => onChange("limit", event.target.value)}
          placeholder="Insert limit N here......"
        />
      </div>
    );
  }
  if (hasTraversalLog) {
    downloadHref = logDownloadUrl;
  } else {
    downloadLogClassName += " disabled";
  }
  if (validationError) {
    sidebarMessageClassName += " error";
  }
  if (isLoading) {
    actionLabel = "Running...";
  }

  return (
    <aside
      className={sidebarClassName}
      aria-label="Traversal configuration"
    >
      <button
        className="sidebar-toggle"
        type="button"
        onClick={onToggleCollapsed}
        aria-label={toggleLabel}
        title={toggleLabel}
      >
        <ChevronIcon collapsed={isCollapsed} />
      </button>

      <div className="sidebar-inner">
        <div className="sidebar-scroll">
          <div className="field">
            <label htmlFor="input-mode">Input Mode</label>
            <select
              id="input-mode"
              value={formValues.inputMode}
              onChange={(event) => onChange("inputMode", event.target.value)}
            >
              <option value="url">Website URL</option>
              <option value="html">Raw HTML</option>
            </select>
          </div>

          {inputField}

          <div className="field">
            <label htmlFor="search-algorithm">Search Algorithm</label>
            <select
              id="search-algorithm"
              value={formValues.algorithm}
              onChange={(event) => onChange("algorithm", event.target.value)}
            >
              <option value="bfs">BFS (Breadth First Search)</option>
              <option value="dfs">DFS (Depth First Search)</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="css-selector">CSS Selector</label>
            <input
              id="css-selector"
              type="text"
              value={formValues.selector}
              onChange={(event) => onChange("selector", event.target.value)}
              placeholder="example: h1, .class-name"
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="result-mode">Result Mode</label>
            <select
              id="result-mode"
              value={formValues.resultMode}
              onChange={(event) => onChange("resultMode", event.target.value)}
            >
              <option value="top">Top N</option>
              <option value="all">All</option>
            </select>
          </div>

          {resultLimitField}

          <section className="sidebar-report" aria-label="Traversal report">
            <h2 className="report-title">Reports</h2>
            <div className="report-row">
              <span>Max depth tree</span>
              <strong>: {formatReportNumber(traversalStats.maxDepth)}</strong>
            </div>
            <div className="report-row">
              <span>Traversal time</span>
              <strong>: {formatTraversalTime(traversalStats.durationMs)}</strong>
            </div>
            <div className="report-row">
              <span>Node visited</span>
              <strong>: {formatReportNumber(traversalStats.visitedCount)}</strong>
            </div>
            <div className="report-row">
              <span>Matched node</span>
              <strong>: {formatReportNumber(traversalStats.matchCount)}</strong>
            </div>
            <a
              className={downloadLogClassName}
              href={downloadHref}
              aria-disabled={!hasTraversalLog}
              onClick={(event) => {
                if (!hasTraversalLog) event.preventDefault();
              }}
            >
              Download Traversal log
            </a>
          </section>

          {validationError && (
            <p
              className={sidebarMessageClassName}
              aria-live="polite"
            >
              {validationError}
            </p>
          )}
        </div>

        <div className="sidebar-actions">
          <button
            className="button secondary"
            type="button"
            onClick={onReset}
            disabled={isLoading}
          >
            Reset
          </button>
          <button
            className="button primary"
            type="button"
            onClick={onRunTraversal}
            disabled={!canSubmit}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
