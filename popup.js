const setupView = document.getElementById("setup-view");
const mainView = document.getElementById("main-view");

const initApiKey = document.getElementById("init-api-key");
const initPassword = document.getElementById("init-password");
const btnSaveSetup = document.getElementById("btn-save-setup");

const ruleInput = document.getElementById("rule-input");
const btnAdd = document.getElementById("btn-add");

const adminPanel = document.getElementById("admin-panel");
const rulesList = document.getElementById("rules-list");

const btnClearAll = document.getElementById("btn-clear-all");

const useApiToggle = document.getElementById("use-api-toggle");
const currentApiKey = document.getElementById("current-api-key");
const btnShowApi = document.getElementById("btn-show-api");

const changeApiKey = document.getElementById("change-api-key");
const btnUpdateKey = document.getElementById("btn-update-key");


// Used only for short popup operations.
// Gemini analysis does not lock the entire popup.
let busy = false;


// Used to prevent an older analysis result from
// overwriting a newer request.
let analysisGeneration = 0;


// ======================================================
// INITIALIZE POPUP
// ======================================================

async function initializePopup() {

  try {

    const data =
      await chrome.storage.local.get({
        apiKey: "",
        password: "",
        useApi: true,
        blockRules: []
      });


    // Password is required for setup.
    // Gemini API key is optional.
    if (
      !data.password ||
      typeof data.password !== "string" ||
      !data.password.trim()
    ) {

      setupView.style.display = "flex";
      mainView.style.display = "none";

      return;
    }


    if (
      !Array.isArray(data.blockRules)
    ) {

      await chrome.storage.local.set({
        blockRules: []
      });

    }


    setupView.style.display = "none";
    mainView.style.display = "block";


    updateApiSettingsUI(
      typeof data.apiKey === "string"
        ? data.apiKey
        : "",
      data.useApi !== false
    );


    ruleInput.focus();

  } catch (error) {

    console.error(
      "[YT-Guard] Popup initialization error:",
      error
    );

    alert(
      "Unable to initialize the extension."
    );

  }

}


initializePopup();


// ======================================================
// SAVE INITIAL SETUP
// ======================================================

btnSaveSetup.addEventListener(
  "click",
  async () => {

    if (busy) {
      return;
    }


    const key =
      initApiKey.value.trim();


    const pass =
      initPassword.value.trim();


    // API key is optional.
    // Password is required.
    if (!pass) {

      alert(
        "Please create a password."
      );

      return;
    }


    busy = true;

    btnSaveSetup.disabled = true;


    try {

      const data =
        await chrome.storage.local.get({
          blockRules: [],
          useApi: true
        });


      await chrome.storage.local.set({

        apiKey:
          key,

        password:
          pass,

        useApi:
          key
            ? data.useApi !== false
            : false,

        blockRules:
          Array.isArray(data.blockRules)
            ? data.blockRules
            : []

      });


      setupView.style.display = "none";
      mainView.style.display = "block";


      initApiKey.value = "";
      initPassword.value = "";


      updateApiSettingsUI(
        key,
        key
          ? data.useApi !== false
          : false
      );


      ruleInput.focus();

    } catch (error) {

      console.error(
        "[YT-Guard] Setup save error:",
        error
      );


      alert(
        "Unable to save setup."
      );

    } finally {

      busy = false;

      btnSaveSetup.disabled = false;

    }

  }
);


// Allow Enter to submit the initial setup.
initPassword.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      btnSaveSetup.click();

    }

  }
);


// ======================================================
// YOUTUBE URL PARSER
// ======================================================

function parseYouTubeUrl(text) {

  try {

    const normalized =
      /^https?:\/\//i.test(text)
        ? text
        : `https://${text}`;


    const url =
      new URL(normalized);


    const hostname =
      url.hostname.toLowerCase();


    // youtu.be/VIDEO_ID

    if (
      hostname === "youtu.be"
    ) {

      const videoId =
        url.pathname
          .split("/")
          .filter(Boolean)[0];


      if (
        !videoId ||
        !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)
      ) {

        return null;
      }


      return {

        videoId,

        canonicalUrl:
          `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`

      };

    }


    // youtube.com/watch?v=VIDEO_ID

    if (

      hostname === "youtube.com" ||

      hostname === "www.youtube.com" ||

      hostname.endsWith(".youtube.com")

    ) {

      if (
        url.pathname !== "/watch"
      ) {

        return null;
      }


      const videoId =
        url.searchParams.get("v");


      if (

        !videoId ||

        !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)

      ) {

        return null;
      }


      return {

        videoId,

        canonicalUrl:
          `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`

      };

    }


    return null;

  } catch {

    return null;

  }

}


function isYouTubeUrl(text) {

  return Boolean(
    parseYouTubeUrl(text)
  );

}


// ======================================================
// RENDER BLOCK RULES
// ======================================================

async function renderRules() {

  try {

    const data =
      await chrome.storage.local.get({
        blockRules: []
      });


    const rules =
      Array.isArray(data.blockRules)
        ? data.blockRules
        : [];


    rulesList.innerHTML = "";


    rules.forEach(
      rule => {

        const li =
          document.createElement("li");


        // Remove button

        const btnRemove =
          document.createElement("button");


        btnRemove.className =
          "btn-remove";


        btnRemove.textContent =
          "-";


        btnRemove.title =
          "Remove this rule";


        btnRemove.addEventListener(
          "click",
          async () => {

            try {

              const latest =
                await chrome.storage.local.get({
                  blockRules: []
                });


              const latestRules =
                Array.isArray(latest.blockRules)
                  ? [...latest.blockRules]
                  : [];


              const removeIndex =
                latestRules.indexOf(rule);


              if (
                removeIndex !== -1
              ) {

                latestRules.splice(
                  removeIndex,
                  1
                );

              }


              await chrome.storage.local.set({

                blockRules:
                  latestRules

              });


              await renderRules();

            } catch (error) {

              console.error(
                "[YT-Guard] Error removing rule:",
                error
              );

            }

          }
        );


        // Rule text

        const span =
          document.createElement("span");


        span.className =
          "item-text";


        span.textContent =
          rule;


        li.appendChild(
          btnRemove
        );


        li.appendChild(
          span
        );


        rulesList.appendChild(
          li
        );

      }
    );

  } catch (error) {

    console.error(
      "[YT-Guard] Error rendering rules:",
      error
    );

  }

}


// ======================================================
// SAVE NEW RULE
// ======================================================

async function saveNewRule(newRule) {

  const cleanRule =
    String(newRule || "").trim();


  if (!cleanRule) {
    return;
  }


  const data =
    await chrome.storage.local.get({
      blockRules: []
    });


  const currentRules =
    Array.isArray(data.blockRules)
      ? [...data.blockRules]
      : [];


  // Do not add duplicate rules.

  const duplicate =
    currentRules.some(
      rule =>
        String(rule)
          .trim()
          .toLowerCase() ===
        cleanRule.toLowerCase()
    );


  if (duplicate) {
    return;
  }


  currentRules.push(
    cleanRule
  );


  await chrome.storage.local.set({

    blockRules:
      currentRules

  });


  if (
    adminPanel.style.display === "block"
  ) {

    await renderRules();

  }

}


// ======================================================
// CLASSIFY YOUTUBE VIDEO
// ======================================================

async function classifyYouTubeVideo(url) {

  const response =
    await chrome.runtime.sendMessage({

      action:
        "SUMMARIZE_VIDEO",

      url

    });


  if (!response) {

    throw new Error(
      "No response received from the service worker."
    );

  }


  if (
    response.error
  ) {

    throw new Error(
      response.error
    );

  }


  if (

    typeof response.category !== "string" ||

    !response.category.trim()

  ) {

    throw new Error(
      "Gemini did not return a category."
    );

  }


  if (

    typeof response.title !== "string" ||

    !response.title.trim()

  ) {

    throw new Error(
      "Gemini did not return a title."
    );

  }


  const genres =
    Array.isArray(response.genres)

      ? response.genres

          .filter(
            genre =>
              typeof genre === "string" &&
              genre.trim()
          )

          .map(
            genre =>
              genre.trim()
          )

          .slice(0, 5)

      : [];


  return {

    category:
      response.category.trim(),

    title:
      response.title.trim(),

    genres

  };

}


// ======================================================
// CREATE RULE FROM GEMINI RESULT
// ======================================================

function formatVideoRule(result) {

  const category =
    result.category.trim();


  const title =
    result.title.trim();


  const genres =
    Array.isArray(result.genres)

      ? result.genres
          .map(
            genre =>
              String(genre).trim()
          )
          .filter(Boolean)

      : [];


  let rule =
    `${category} / ${title}`;


  if (
    genres.length > 0
  ) {

    rule +=
      ` / ${genres.join(", ")}`;

  }


  return rule.trim();

}


// ======================================================
// UPDATE API SETTINGS UI
// ======================================================

function updateApiSettingsUI(
  apiKey,
  useApi
) {

  if (!useApiToggle) {
    return;
  }


  useApiToggle.checked =
    Boolean(
      useApi && apiKey
    );


  if (currentApiKey) {

    if (!apiKey) {

      currentApiKey.value =
        "Not configured";

    } else {

      currentApiKey.value =
        maskApiKey(apiKey);

    }

  }

}


// ======================================================
// MASK API KEY
// ======================================================

function maskApiKey(apiKey) {

  if (!apiKey) {
    return "Not configured";
  }


  if (
    apiKey.length <= 8
  ) {

    return "••••••••";

  }


  return (
    apiKey.slice(0, 4) +
    "••••••••" +
    apiKey.slice(-4)
  );

}


// ======================================================
// SHOW / HIDE API KEY
// ======================================================

let apiKeyVisible = false;


btnShowApi.addEventListener(
  "click",
  async () => {

    try {

      const data =
        await chrome.storage.local.get({
          apiKey: ""
        });


      const apiKey =
        typeof data.apiKey === "string"
          ? data.apiKey
          : "";


      if (!apiKey) {

        currentApiKey.value =
          "Not configured";

        apiKeyVisible = false;

        btnShowApi.textContent =
          "Show";

        return;
      }


      apiKeyVisible =
        !apiKeyVisible;


      currentApiKey.value =
        apiKeyVisible
          ? apiKey
          : maskApiKey(apiKey);


      btnShowApi.textContent =
        apiKeyVisible
          ? "Hide"
          : "Show";

    } catch (error) {

      console.error(
        "[YT-Guard] Error displaying API key:",
        error
      );

    }

  }
);


// ======================================================
// AI TOGGLE
// ======================================================

useApiToggle.addEventListener(
  "change",
  async () => {

    try {

      const data =
        await chrome.storage.local.get({
          apiKey: ""
        });


      const apiKey =
        typeof data.apiKey === "string"
          ? data.apiKey.trim()
          : "";


      if (
        useApiToggle.checked &&
        !apiKey
      ) {

        useApiToggle.checked =
          false;


        alert(
          "Please configure a Gemini API key first."
        );

        return;
      }


      await chrome.storage.local.set({

        useApi:
          useApiToggle.checked

      });

    } catch (error) {

      console.error(
        "[YT-Guard] Error updating AI setting:",
        error
      );

    }

  }
);


// ======================================================
// ADD BUTTON
// ======================================================

btnAdd.addEventListener(
  "click",
  async () => {

    if (busy) {
      return;
    }


    const val =
      ruleInput.value.trim();


    if (!val) {
      return;
    }


    const data =
      await chrome.storage.local.get({

        password:
          "",

        blockRules:
          [],

        apiKey:
          ""

      });


    // ==================================================
    // PASSWORD -> ADMIN PANEL
    // ==================================================

    if (
      val === data.password
    ) {

      const shouldOpen =
        adminPanel.style.display === "none";


      adminPanel.style.display =
        shouldOpen
          ? "block"
          : "none";


      if (shouldOpen) {

        await renderRules();

      }


      ruleInput.value = "";

      return;

    }


    // ==================================================
    // YOUTUBE URL -> GEMINI
    // ==================================================

    if (
      isYouTubeUrl(val)
    ) {

      if (!data.apiKey) {

        alert(
          "No Gemini API key configured."
        );

        return;

      }


      // Save the URL before the asynchronous request.
      const urlToAnalyze =
        val;


      // Give this request its own generation ID.
      const myAnalysisGeneration =
        ++analysisGeneration;


      // Do not lock the input or the entire popup.
      const originalValue =
        ruleInput.value;


      ruleInput.value =
        "Analyzing video...";


      classifyYouTubeVideo(
        urlToAnalyze
      )

        .then(
          async result => {

            // Ignore outdated requests.

            if (
              myAnalysisGeneration !==
              analysisGeneration
            ) {

              return;

            }


            const generatedRule =
              formatVideoRule(
                result
              );


            if (
              !generatedRule
            ) {

              throw new Error(
                "Cannot create a rule from the Gemini result."
              );

            }


            await saveNewRule(
              generatedRule
            );


            // Only clear the analysis message if
            // the user has not changed the input.

            if (
              ruleInput.value ===
              "Analyzing video..."
            ) {

              ruleInput.value =
                "";

            }

          }
        )

        .catch(
          error => {

            console.error(
              "[YT-Guard] Error analyzing video:",
              error
            );


            if (
              myAnalysisGeneration !==
              analysisGeneration
            ) {

              return;

            }


            // Do not overwrite user input
            // if they changed it during analysis.

            if (
              ruleInput.value ===
              "Analyzing video..."
            ) {

              ruleInput.value =
                originalValue;

            }


            alert(
              `Cannot analyze video.\n\n${error.message}`
            );

          }
        );


      return;

    }


    // ==================================================
    // TEXT -> RULE
    // ==================================================

    busy = true;

    btnAdd.disabled = true;


    try {

      await saveNewRule(
        val
      );


      ruleInput.value =
        "";


    } catch (error) {

      console.error(
        "[YT-Guard] Error adding rule:",
        error
      );


      alert(
        `Cannot add rule.\n\n${error.message}`
      );


    } finally {

      busy = false;

      btnAdd.disabled = false;

      ruleInput.focus();

    }

  }
);


// ======================================================
// ENTER KEY
// ======================================================

ruleInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();


      if (!busy) {

        btnAdd.click();

      }

    }

  }
);


// ======================================================
// DELETE ALL RULES
// ======================================================

btnClearAll.addEventListener(
  "click",
  async () => {

    if (busy) {
      return;
    }


    const confirmed =
      confirm(
        "Are you sure you want to clear the entire block list?"
      );


    if (!confirmed) {
      return;
    }


    try {

      await chrome.storage.local.set({

        blockRules:
          []

      });


      await renderRules();


    } catch (error) {

      console.error(
        "[YT-Guard] Error clearing all rules:",
        error
      );


      alert(
        "Cannot clear the block list."
      );

    }

  }
);


// ======================================================
// UPDATE API KEY
// ======================================================

btnUpdateKey.addEventListener(
  "click",
  async () => {

    if (busy) {
      return;
    }


    const newKey =
      changeApiKey.value.trim();


    if (!newKey) {
      return;
    }


    try {

      await chrome.storage.local.set({

        apiKey:
          newKey,

        useApi:
          true

      });


      changeApiKey.value =
        "";


      updateApiSettingsUI(
        newKey,
        true
      );


      alert(
        "API key updated successfully."
      );


    } catch (error) {

      console.error(
        "[YT-Guard] Error updating API key:",
        error
      );


      alert(
        "Cannot update the API key."
      );

    }

  }
);
```
