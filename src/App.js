import { useState } from 'react';
import './App.css';

const DEFAULT_REQUEST_TEXT = 'Request data will appear here.';
const DEFAULT_LOG_TEXT = 'Traversal log will appear here.';
const DEFAULT_MATCH_TEXT = 'Match results will appear here.';
const DEFAULT_STATS_TEXT = 'Stats will appear here.';
const DEFAULT_RESPONSE_TEXT = 'Backend response will appear here.';
const DEFAULT_STATUS_TEXT = 'Idle';

function TreeNode({ node, depth }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!node || typeof node !== 'object') return null;

  const tag = node.tag || node.type || node.name || 'node';
  const children = Array.isArray(node.children) ? node.children : [];
  const attrs = node.attrs || node.attributes || {};
  const text = typeof node.text === 'string' ? node.text.trim() : '';
  const hasChildren = children.length > 0;

  const attrString = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');

  return (
    <div className="tree-node" style={{ paddingLeft: depth * 16 + 'px' }}>
      <div
        className="tree-label"
        onClick={() => hasChildren && setCollapsed(c => !c)}
        style={{ cursor: hasChildren ? 'pointer' : 'default' }}
      >
        <span className="tree-toggle">{hasChildren ? (collapsed ? '▶' : '▼') : '·'}</span>
        <span className="tree-tag">&lt;{tag}</span>
        {attrString && <span className="tree-attr">{attrString}</span>}
        <span className="tree-tag">&gt;</span>
        {text && !hasChildren && (
          <span className="tree-text"> {text.length > 60 ? text.slice(0, 60) + '…' : text}</span>
        )}
      </div>
      {!collapsed && hasChildren && children.map((child, i) => (
        <TreeNode key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function App() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8080/api/traverse');
  const [inputMode, setInputMode] = useState('url');
  const [urlInput, setUrlInput] = useState('');
  const [htmlInput, setHtmlInput] = useState('');
  const [algorithm, setAlgorithm] = useState('');
  const [selector, setSelector] = useState('');
  const [resultMode, setResultMode] = useState('all');
  const [limit, setLimit] = useState('5');
  const [formMessage, setFormMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [requestResult, setRequestResult] = useState(DEFAULT_REQUEST_TEXT);
  const [logData, setLogData] = useState(null);
  const [matchResult, setMatchResult] = useState(DEFAULT_MATCH_TEXT);
  const [statsResult, setStatsResult] = useState(DEFAULT_STATS_TEXT);
  const [responseResult, setResponseResult] = useState(DEFAULT_RESPONSE_TEXT);
  const [treeData, setTreeData] = useState(null);
  const [logFile, setLogFile] = useState('');
  const [statusText, setStatusText] = useState(DEFAULT_STATUS_TEXT);
  const [statusType, setStatusType] = useState('idle');
  const [isLoading, setIsLoading] = useState(false);

  function convertToText(data, defaultText) {
    if (data === null || data === undefined || data === '') return defaultText;
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }

  function getLogDownloadUrl() {
    try {
      const base = new URL(apiUrl.trim()).origin;
      return `${base}/api/log?file=${encodeURIComponent(logFile)}`;
    } catch {
      return '#';
    }
  }

  function makeRequestData() {
    const data = {
      url: '',
      html: '',
      algorithm,
      selector: selector.trim(),
      limit: 0,
    };
    if (inputMode === 'url') {
      data.url = urlInput.trim();
    } else {
      data.html = htmlInput.trim();
    }
    if (resultMode === 'top') {
      data.limit = parseInt(limit, 10);
      if (isNaN(data.limit)) data.limit = 0;
    }
    return data;
  }

  function validateRequestData(data) {
    if (apiUrl.trim() === '') return 'Backend API URL is required.';
    if (data.selector === '') return 'CSS selector is required.';
    if (data.algorithm === '') return 'Traversal algorithm is required.';
    if (inputMode === 'url' && data.url === '') return 'Target URL is required when Website URL mode is active.';
    if (inputMode === 'html' && data.html === '') return 'HTML input is required when Raw HTML mode is active.';
    if (resultMode === 'top' && data.limit < 1) return 'N value must be at least 1 for Top N mode.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const requestData = makeRequestData();
    const errorMessage = validateRequestData(requestData);
    setRequestResult(convertToText(requestData, DEFAULT_REQUEST_TEXT));

    if (errorMessage !== '') {
      setFormMessage(errorMessage);
      setMessageType('error');
      setStatusText('Validation failed');
      setStatusType('error');
      return;
    }

    setIsLoading(true);
    setFormMessage('Sending request to the backend...');
    setMessageType('');
    setStatusText('Processing request');
    setStatusType('loading');

    try {
      const response = await fetch(apiUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const responseText = await response.text();
      let responseData = null;

      try {
        if (responseText !== '') {
          responseData = JSON.parse(responseText);
        }
      } catch {
        throw new Error('Backend response is not valid JSON.');
      }

      if (!response.ok) {
        let message = 'Request failed with status ' + response.status + '.';
        if (responseData && responseData.message) message = responseData.message;
        throw new Error(message);
      }

      setResponseResult(convertToText(responseData, DEFAULT_RESPONSE_TEXT));
      setMatchResult(responseData && 'matches' in responseData
        ? convertToText(responseData.matches, DEFAULT_MATCH_TEXT)
        : DEFAULT_MATCH_TEXT);
      setStatsResult(responseData && 'stats' in responseData
        ? convertToText(responseData.stats, DEFAULT_STATS_TEXT)
        : DEFAULT_STATS_TEXT);
      setLogData(responseData && 'traversal_log' in responseData
        ? responseData.traversal_log
        : []);
      setTreeData(responseData?.tree ?? null);
      setLogFile(responseData?.log_file ?? '');

      const onlyPlaceholder =
        Array.isArray(responseData?.traversal_log) &&
        responseData.traversal_log.length === 1 &&
        responseData.traversal_log[0] === 'test ok';

      setFormMessage(onlyPlaceholder
        ? 'Request succeeded. The backend is still returning placeholder data.'
        : 'Request completed successfully.');
      setMessageType('success');
      setStatusText('Request succeeded');
      setStatusType('success');
    } catch (error) {
      const errorText = error?.message ? String(error.message) : String(error);
      setResponseResult(errorText);
      setMatchResult(DEFAULT_MATCH_TEXT);
      setStatsResult(DEFAULT_STATS_TEXT);
      setLogData([]);
      setTreeData(null);
      setLogFile('');
      setFormMessage('Failed to process request: ' + errorText);
      setMessageType('error');
      setStatusText('Request failed');
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setApiUrl('http://localhost:8080/api/traverse');
    setInputMode('url');
    setUrlInput('');
    setHtmlInput('');
    setAlgorithm('');
    setSelector('');
    setResultMode('all');
    setLimit('5');
    setFormMessage('Form has been reset.');
    setMessageType('');
    setRequestResult(DEFAULT_REQUEST_TEXT);
    setLogData(null);
    setMatchResult(DEFAULT_MATCH_TEXT);
    setStatsResult(DEFAULT_STATS_TEXT);
    setResponseResult(DEFAULT_RESPONSE_TEXT);
    setTreeData(null);
    setLogFile('');
    setStatusText(DEFAULT_STATUS_TEXT);
    setStatusType('idle');
  }

  function renderLog() {
    if (!Array.isArray(logData) || logData.length === 0) {
      return <div className="log-list empty-box">{DEFAULT_LOG_TEXT}</div>;
    }
    return (
      <div className="log-list">
        {logData.map((entry, i) => (
          <div key={i} className="log-item">
            <span className="log-number">#{i + 1} </span>
            <span>{entry}</span>
          </div>
        ))}
      </div>
    );
  }

  function renderTree() {
    if (!treeData) {
      return <div className="tree-area empty-box">DOM tree will appear here.</div>;
    }
    return (
      <div className="tree-area">
        <TreeNode node={treeData} depth={0} />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="top-row">
        <div className="box">
          <p className="small-text">Tubes 2 — IF2211 Strategi Algoritma</p>
          <h1>Web Scraper</h1>
          <p className="desc">
            Traverse web pages using BFS or DFS, then extract elements matching your CSS selector.
          </p>
        </div>
        <div className="box">
          <div className="box-head">
            <h2>Status</h2>
            <span className={`status-box status-${statusType}`}>{statusText}</span>
          </div>
        </div>
      </div>

      <div className="main-row">
        <div className="box">
          <div className="box-head">
            <h2>Configuration</h2>
          </div>
          <form id="main-form" onSubmit={handleSubmit}>
            <div className="field-list">
              <div className="field">
                <span>Backend API URL</span>
                <input
                  id="input-api"
                  type="text"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                  placeholder="http://localhost:8080/api/traverse"
                />
              </div>

              <fieldset>
                <legend>Input Mode</legend>
                <div className="choice-row" style={{ marginTop: '8px' }}>
                  <label className="choice-item">
                    <input
                      type="radio"
                      name="inputMode"
                      value="url"
                      checked={inputMode === 'url'}
                      onChange={() => setInputMode('url')}
                    />
                    <span>Website URL</span>
                  </label>
                  <label className="choice-item">
                    <input
                      type="radio"
                      name="inputMode"
                      value="html"
                      checked={inputMode === 'html'}
                      onChange={() => setInputMode('html')}
                    />
                    <span>Raw HTML</span>
                  </label>
                </div>
              </fieldset>

              {inputMode === 'url' ? (
                <div id="url-section" className="field">
                  <span>Target URL</span>
                  <input
                    id="url-input"
                    type="text"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              ) : (
                <div id="html-section" className="field">
                  <span>Raw HTML</span>
                  <textarea
                    id="html-input"
                    value={htmlInput}
                    onChange={e => setHtmlInput(e.target.value)}
                    placeholder="Paste your HTML here..."
                  />
                </div>
              )}

              <div className="field">
                <span>Traversal Algorithm</span>
                <select
                  id="algorithm-input"
                  value={algorithm}
                  onChange={e => setAlgorithm(e.target.value)}
                >
                  <option value="">-- Select algorithm --</option>
                  <option value="bfs">BFS (Breadth-First Search)</option>
                  <option value="dfs">DFS (Depth-First Search)</option>
                </select>
              </div>

              <div className="field">
                <span>CSS Selector</span>
                <input
                  id="selector-input"
                  type="text"
                  value={selector}
                  onChange={e => setSelector(e.target.value)}
                  placeholder="e.g. a, h1, .class-name"
                />
              </div>

              <div className="two-col">
                <fieldset>
                  <legend>Result Mode</legend>
                  <div className="choice-row" style={{ marginTop: '8px' }}>
                    <label className="choice-item">
                      <input
                        type="radio"
                        name="resultMode"
                        value="all"
                        checked={resultMode === 'all'}
                        onChange={() => setResultMode('all')}
                      />
                      <span>All</span>
                    </label>
                    <label className="choice-item">
                      <input
                        type="radio"
                        name="resultMode"
                        value="top"
                        checked={resultMode === 'top'}
                        onChange={() => setResultMode('top')}
                      />
                      <span>Top N</span>
                    </label>
                  </div>
                </fieldset>

                <div className="field">
                  <span>N (limit)</span>
                  <input
                    id="limit-input"
                    type="number"
                    min="1"
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                    disabled={resultMode !== 'top'}
                  />
                </div>
              </div>
            </div>

            <p
              id="form-message"
              className={`form-message${messageType === 'error' ? ' form-error' : messageType === 'success' ? ' form-success' : ''}`}
            >
              {formMessage}
            </p>

            <div className="button-row">
              <button id="submit-button" className="btn-main" type="submit" disabled={isLoading}>
                Submit
              </button>
              <button id="reset-button" className="btn-second" type="button" onClick={handleReset} disabled={isLoading}>
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="box">
          <div className="box-head">
            <h2>Results</h2>
            {logFile && (
              <a
                className="btn-second btn-download"
                href={getLogDownloadUrl()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Log
              </a>
            )}
          </div>
          <div className="cards">
            <div className="card full-card">
              <h3>DOM Tree</h3>
              {renderTree()}
            </div>

            <div className="card">
              <h3>Request Sent</h3>
              <pre id="request-result" className="code-area">{requestResult}</pre>
            </div>

            <div className="card full-card">
              <h3>Traversal Log</h3>
              {renderLog()}
            </div>

            <div className="card">
              <h3>Matches</h3>
              <pre id="match-result" className="code-area">{matchResult}</pre>
            </div>

            <div className="card">
              <h3>Stats</h3>
              <pre id="stats-result" className="code-area">{statsResult}</pre>
            </div>

            <div className="card full-card">
              <h3>Backend Response</h3>
              <pre id="response-result" className="code-area">{responseResult}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
