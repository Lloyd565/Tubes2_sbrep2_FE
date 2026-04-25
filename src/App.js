import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainPanel from './components/MainPanel';
import { normalizeTraversalResponse } from './traversalData';

const TRAVERSAL_API_URL = process.env.REACT_APP_TRAVERSE_API_URL || 'http://localhost:8080/api/traverse';
const LOG_DOWNLOAD_API_URL = process.env.REACT_APP_LOG_API_URL || deriveLogApiUrl(TRAVERSAL_API_URL);
const PLAY_DURATION_BY_SPEED_MS = {
  1: 20000,
  2: 10000,
  4: 5000,
};

const initialFormValues = {
  inputMode: 'url',
  url: '',
  html: '',
  algorithm: 'bfs',
  selector: '',
  resultMode: 'top',
  limit: '',
};

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.localStorage.getItem('sbrep2-theme') || 'light';
}

function getValidationError(formValues) {
  let inputSource;
  if (formValues.inputMode === 'url') {
    inputSource = formValues.url.trim();
  } else {
    inputSource = formValues.html.trim();
  }
  const cssSelector = formValues.selector.trim();
  const resultLimit = Number(formValues.limit);

  if (!inputSource) {
    if (formValues.inputMode === 'url') {
      return 'Website URL is required.';
    }
    return 'Raw HTML is required.';
  }
  if (!cssSelector) return 'CSS selector is required.';
  if (formValues.resultMode === 'top' && (!Number.isFinite(resultLimit) || resultLimit < 1)) {
    return 'Top N limit must be a positive number.';
  }
  return '';
}

function makeRequestBody(formValues) {
  let websiteUrl = '';
  let rawHtml = '';
  let resultLimit = 0;

  if (formValues.inputMode === 'url') {
    websiteUrl = formValues.url.trim();
  }
  if (formValues.inputMode === 'html') {
    rawHtml = formValues.html.trim();
  }
  if (formValues.resultMode === 'top') {
    resultLimit = Number(formValues.limit);
  }

  return {
    url: websiteUrl,
    html: rawHtml,
    algorithm: formValues.algorithm,
    selector: formValues.selector.trim(),
    limit: resultLimit,
  };
}

function deriveLogApiUrl(traverseUrl) {
  try {
    let baseUrl = 'http://localhost';
    if (typeof window !== 'undefined') {
      baseUrl = window.location.href;
    }
    const logApiUrl = new URL(traverseUrl, baseUrl);
    logApiUrl.pathname = logApiUrl.pathname.replace(/\/api\/traverse$/, '/api/log');
    logApiUrl.search = '';
    return logApiUrl.toString();
  } catch {
    return 'http://localhost:8080/api/log';
  }
}

function makeLogDownloadUrl(logFileName) {
  if (!logFileName) return '';

  try {
    let baseUrl = 'http://localhost';
    if (typeof window !== 'undefined') {
      baseUrl = window.location.href;
    }
    const logDownloadUrl = new URL(LOG_DOWNLOAD_API_URL, baseUrl);
    logDownloadUrl.searchParams.set('file', logFileName);
    return logDownloadUrl.toString();
  } catch {
    return `${LOG_DOWNLOAD_API_URL}?file=${encodeURIComponent(logFileName)}`;
  }
}

function ErrorPopup({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="error-popup" role="alert">
      <button className="error-popup-close" type="button" onClick={onClose} aria-label="Close error">
        x
      </button>
      <h2>Request failed</h2>
      <p>{message}</p>
    </div>
  );
}

function App() {
  const [currentTheme, setCurrentTheme] = useState(getInitialTheme);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [traversalResult, setTraversalResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1');
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formValidationError = useMemo(() => getValidationError(formValues), [formValues]);
  const canSubmitForm = !formValidationError && !isLoading;
  const hasTypedInForm = Boolean(formValues.url || formValues.html || formValues.selector || formValues.limit);
  const traversalLogDownloadUrl = useMemo(() => makeLogDownloadUrl(traversalResult?.logFile), [traversalResult]);
  const currentStepNumberRef = useRef(0);

  useEffect(() => {
    currentStepNumberRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    document.documentElement.dataset.theme = currentTheme;
    window.localStorage.setItem('sbrep2-theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    if (!isPlaying || !traversalResult?.steps?.length) return undefined;

    const totalSteps = traversalResult.steps.length;
    const startingStep = Math.min(Math.max(currentStepNumberRef.current, 1), totalSteps);
    const animationDuration = PLAY_DURATION_BY_SPEED_MS[playbackSpeed] || PLAY_DURATION_BY_SPEED_MS[1];

    if (startingStep >= totalSteps) {
      setIsPlaying(false);
      return undefined;
    }

    let animationFrameId = 0;
    const animationStartedAt = performance.now();

    function updateAnimationFrame(currentTime) {
      const progressRatio = Math.min(1, (currentTime - animationStartedAt) / animationDuration);
      const nextStep = Math.min(
        totalSteps,
        startingStep + Math.floor(progressRatio * (totalSteps - startingStep))
      );

      currentStepNumberRef.current = nextStep;
      setCurrentStep(nextStep);

      if (progressRatio >= 1) {
        currentStepNumberRef.current = totalSteps;
        setCurrentStep(totalSteps);
        setIsPlaying(false);
        return;
      }

      animationFrameId = window.requestAnimationFrame(updateAnimationFrame);
    }

    animationFrameId = window.requestAnimationFrame(updateAnimationFrame);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isPlaying, traversalResult, playbackSpeed]);

  function updateFormField(fieldName, fieldValue) {
    setFormValues(previousFormValues => ({ ...previousFormValues, [fieldName]: fieldValue }));
  }

  async function runTraversal() {
    setHasTriedSubmit(true);
    if (formValidationError) return;

    const requestBody = makeRequestBody(formValues);
    setIsLoading(true);
    setIsPlaying(false);
    setErrorMessage('');

    try {
      const backendResponse = await fetch(TRAVERSAL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const responseText = await backendResponse.text();
      let responseData = null;

      if (!backendResponse.ok) {
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch {
            throw new Error(responseText);
          }
        }
        let backendErrorMessage = `Backend request failed with status ${backendResponse.status}.`;
        if (responseData?.message) {
          backendErrorMessage = responseData.message;
        }
        throw new Error(backendErrorMessage);
      }

      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          throw new Error('Backend returned invalid JSON.');
        }
      }

      const normalizedTraversal = normalizeTraversalResponse(responseData, formValues.algorithm, requestBody);
      let firstStepToShow = 0;
      if (normalizedTraversal.steps.length) {
        firstStepToShow = 1;
      }
      setTraversalResult(normalizedTraversal);
      setCurrentStep(firstStepToShow);
      currentStepNumberRef.current = firstStepToShow;
      setIsPlaying(normalizedTraversal.steps.length > 1);
      setIsSidebarCollapsed(true);
    } catch (error) {
      let readableErrorMessage = String(error);
      if (error?.message) {
        readableErrorMessage = String(error.message);
      }
      setTraversalResult(null);
      setCurrentStep(0);
      setCanvasZoom(1);
      setIsSidebarCollapsed(false);
      setErrorMessage(readableErrorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  function resetWorkspace() {
    setFormValues(initialFormValues);
    setHasTriedSubmit(false);
    setTraversalResult(null);
    setCurrentStep(0);
    setIsPlaying(false);
    setCanvasZoom(1);
    setErrorMessage('');
    setIsSidebarCollapsed(false);
  }

  function toggleTheme() {
    setCurrentTheme(previousTheme => {
      if (previousTheme === 'light') {
        return 'dark';
      }
      return 'light';
    });
  }

  let workspaceClassName = 'workspace';
  if (isSidebarCollapsed) {
    workspaceClassName += ' sidebar-is-collapsed';
  }

  let visibleValidationError = '';
  if (hasTriedSubmit || hasTypedInForm) {
    visibleValidationError = formValidationError;
  }

  return (
    <div className="app-shell">
      <Header currentTheme={currentTheme} onToggleTheme={toggleTheme} />
      <div className={workspaceClassName}>
        <Sidebar
          formValues={formValues}
          onChange={updateFormField}
          onRunTraversal={runTraversal}
          onReset={resetWorkspace}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed(previousCollapsed => !previousCollapsed)}
          validationError={visibleValidationError}
          canSubmit={canSubmitForm}
          isLoading={isLoading}
          traversalResult={traversalResult}
          logDownloadUrl={traversalLogDownloadUrl}
        />
        <MainPanel
          traversalResult={traversalResult}
          currentStep={currentStep}
          onStepChange={nextStep => {
            setIsPlaying(false);
            setCurrentStep(nextStep);
            currentStepNumberRef.current = nextStep;
          }}
          isPlaying={isPlaying}
          onTogglePlay={() => {
            if (traversalResult?.steps?.length && currentStep >= traversalResult.steps.length) {
              currentStepNumberRef.current = 1;
              setCurrentStep(1);
              setIsPlaying(true);
              return;
            }
            setIsPlaying(previousPlaying => !previousPlaying);
          }}
          playbackSpeed={playbackSpeed}
          onPlaybackSpeedChange={nextPlaybackSpeed => {
            setPlaybackSpeed(nextPlaybackSpeed);
          }}
          zoom={canvasZoom}
          onZoomChange={setCanvasZoom}
        />
        <ErrorPopup message={errorMessage} onClose={() => setErrorMessage('')} />
      </div>
    </div>
  );
}

export default App;
