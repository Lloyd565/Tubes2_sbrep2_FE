const mainForm = document.getElementById("main-form");
const apiInput = document.getElementById("input-api");
const urlSection = document.getElementById("url-section");
const htmlSection = document.getElementById("html-section");
const urlInput = document.getElementById("url-input");
const htmlInput = document.getElementById("html-input");
const algorithmInput = document.getElementById("algorithm-input");
const selectorInput = document.getElementById("selector-input");
const limitInput = document.getElementById("limit-input");
const submitButton = document.getElementById("submit-button");
const resetButton = document.getElementById("reset-button");
const formMessage = document.getElementById("form-message");
const requestResult = document.getElementById("request-result");
const logResult = document.getElementById("log-result");
const matchResult = document.getElementById("match-result");
const statsResult = document.getElementById("stats-result");
const responseResult = document.getElementById("response-result");
const requestStatus = document.getElementById("request-status");

const defaultRequestText = requestResult.textContent.trim();
const defaultLogText = logResult.textContent.trim();
const defaultMatchText = matchResult.textContent.trim();
const defaultStatsText = statsResult.textContent.trim();
const defaultResponseText = responseResult.textContent.trim();
const defaultStatusText = requestStatus.textContent.trim();

function getInputMode() {
  return mainForm.elements.inputMode.value;
}

function getResultMode() {
  return mainForm.elements.resultMode.value;
}

function setFormMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = "form-message";

  if (type === "error") {
    formMessage.classList.add("form-error");
  }

  if (type === "success") {
    formMessage.classList.add("form-success");
  }
}

function setStatus(message, type) {
  requestStatus.textContent = message;
  requestStatus.className = "status-box";

  if (type === "idle") {
    requestStatus.classList.add("status-idle");
  }

  if (type === "loading") {
    requestStatus.classList.add("status-loading");
  }

  if (type === "success") {
    requestStatus.classList.add("status-success");
  }

  if (type === "error") {
    requestStatus.classList.add("status-error");
  }
}

function updateInputView() {
  const inputMode = getInputMode();

  if (inputMode === "url") {
    urlSection.classList.remove("hidden");
    htmlSection.classList.add("hidden");
    urlInput.disabled = false;
    htmlInput.disabled = true;
    htmlInput.value = "";
  } else {
    urlSection.classList.add("hidden");
    htmlSection.classList.remove("hidden");
    urlInput.disabled = true;
    htmlInput.disabled = false;
    urlInput.value = "";
  }
}

function updateLimitView() {
  const resultMode = getResultMode();

  if (resultMode === "top") {
    limitInput.disabled = false;
  } else {
    limitInput.disabled = true;
  }
}

function convertToText(data, defaultText) {
  if (data === null || data === undefined || data === "") {
    return defaultText;
  }

  if (typeof data === "string") {
    return data;
  }

  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return String(data);
  }
}

function showLog(logData) {
  logResult.innerHTML = "";

  if (!Array.isArray(logData) || logData.length === 0) {
    logResult.className = "log-list empty-box";
    logResult.textContent = defaultLogText;
    return;
  }

  logResult.className = "log-list";

  for (let i = 0; i < logData.length; i += 1) {
    const item = document.createElement("div");
    const numberText = document.createElement("span");
    const logText = document.createElement("span");

    item.className = "log-item";
    numberText.className = "log-number";
    numberText.textContent = "#" + (i + 1) + " ";
    logText.textContent = logData[i];

    item.appendChild(numberText);
    item.appendChild(logText);
    logResult.appendChild(item);
  }
}

function makeRequestData() {
  const data = {
    url: "",
    html: "",
    algorithm: algorithmInput.value,
    selector: selectorInput.value.trim(),
    limit: 0,
  };

  const inputMode = getInputMode();
  const resultMode = getResultMode();

  if (inputMode === "url") {
    data.url = urlInput.value.trim();
  } else {
    data.html = htmlInput.value.trim();
  }

  if (resultMode === "top") {
    data.limit = Number.parseInt(limitInput.value, 10);

    if (Number.isNaN(data.limit)) {
      data.limit = 0;
    }
  }

  return data;
}

function validateRequestData(data) {
  if (apiInput.value.trim() === "") {
    return "Backend API URL is required.";
  }

  if (data.selector === "") {
    return "CSS selector is required.";
  }

  if (data.algorithm === "") {
    return "Traversal algorithm is required.";
  }

  if (getInputMode() === "url" && data.url === "") {
    return "Target URL is required when Website URL mode is active.";
  }

  if (getInputMode() === "html" && data.html === "") {
    return "HTML input is required when Raw HTML mode is active.";
  }

  if (getResultMode() === "top" && data.limit < 1) {
    return "N value must be at least 1 for Top N mode.";
  }

  return "";
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  resetButton.disabled = isLoading;
}

async function submitForm(event) {
  event.preventDefault();

  const requestData = makeRequestData();
  const errorMessage = validateRequestData(requestData);

  requestResult.textContent = convertToText(requestData, defaultRequestText);

  if (errorMessage !== "") {
    setFormMessage(errorMessage, "error");
    setStatus("Validation failed", "error");
    return;
  }

  setLoading(true);
  setFormMessage("Sending request to the backend...", "");
  setStatus("Processing request", "loading");

  try {
    const response = await fetch(apiInput.value.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const responseText = await response.text();
    let responseData = null;

    try {
      if (responseText !== "") {
        responseData = JSON.parse(responseText);
      }
    } catch (error) {
      throw new Error("Backend response is not valid JSON.");
    }

    if (!response.ok) {
      let message = "Request failed with status " + response.status + ".";

      if (responseData && responseData.message) {
        message = responseData.message;
      }

      throw new Error(message);
    }

    responseResult.textContent = convertToText(
      responseData,
      defaultResponseText,
    );

    if (responseData && "matches" in responseData) {
      matchResult.textContent = convertToText(
        responseData.matches,
        defaultMatchText,
      );
    } else {
      matchResult.textContent = defaultMatchText;
    }

    if (responseData && "stats" in responseData) {
      statsResult.textContent = convertToText(
        responseData.stats,
        defaultStatsText,
      );
    } else {
      statsResult.textContent = defaultStatsText;
    }

    if (responseData && "traversal_log" in responseData) {
      showLog(responseData.traversal_log);
    } else {
      showLog([]);
    }

    let onlyPlaceholder = false;

    if (responseData && Array.isArray(responseData.traversal_log)) {
      if (responseData.traversal_log.length === 1) {
        if (responseData.traversal_log[0] === "test ok") {
          onlyPlaceholder = true;
        }
      }
    }

    if (onlyPlaceholder) {
      setFormMessage(
        "Request succeeded. The backend is still returning placeholder data.",
        "success",
      );
    } else {
      setFormMessage("Request completed successfully.", "success");
    }

    setStatus("Request succeeded", "success");
  } catch (error) {
    let errorText = String(error);

    if (error && error.message) {
      errorText = String(error.message);
    }

    responseResult.textContent = errorText;
    matchResult.textContent = defaultMatchText;
    statsResult.textContent = defaultStatsText;
    showLog([]);
    setFormMessage("Failed to process request: " + errorText, "error");
    setStatus("Request failed", "error");
  } finally {
    setLoading(false);
  }
}

function resetForm() {
  mainForm.reset();
  apiInput.value = "http://localhost:8080/api/traverse";
  limitInput.value = "5";
  requestResult.textContent = defaultRequestText;
  responseResult.textContent = defaultResponseText;
  matchResult.textContent = defaultMatchText;
  statsResult.textContent = defaultStatsText;
  showLog([]);
  setFormMessage("Form has been reset.", "");
  setStatus(defaultStatusText, "idle");
  updateInputView();
  updateLimitView();
}

mainForm.addEventListener("submit", submitForm);
resetButton.addEventListener("click", resetForm);

const allInputModes = document.querySelectorAll('input[name="inputMode"]');
for (let i = 0; i < allInputModes.length; i += 1) {
  allInputModes[i].addEventListener("change", updateInputView);
}

const allResultModes = document.querySelectorAll('input[name="resultMode"]');
for (let i = 0; i < allResultModes.length; i += 1) {
  allResultModes[i].addEventListener("change", updateLimitView);
}

updateInputView();
updateLimitView();
showLog([]);
