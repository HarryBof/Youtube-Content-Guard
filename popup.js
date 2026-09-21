const setupView =
document.getElementById("setup-view");

const mainView =
document.getElementById("main-view");

const initApiKey =
document.getElementById("init-api-key");

const initPassword =
document.getElementById("init-password");

const btnSaveSetup =
document.getElementById("btn-save-setup");

const ruleInput =
document.getElementById("rule-input");

const btnAdd =
document.getElementById("btn-add");

const adminPanel =
document.getElementById("admin-panel");

const rulesList =
document.getElementById("rules-list");

const btnClearAll =
document.getElementById("btn-clear-all");

const useApiToggle =
document.getElementById("use-api-toggle");

const currentApiKey =
document.getElementById("current-api-key");

const btnShowApi =
document.getElementById("btn-show-api");

const changeApiKey =
document.getElementById("change-api-key");

const btnUpdateKey =
document.getElementById("btn-update-key");

// ======================================================
// STATE
// ======================================================

let busy =
false;

let analysisGeneration =
0;

// ======================================================
// INITIALIZE POPUP
// ======================================================

async function initializePopup() {

try {


const data =
  await chrome.storage.local.get({

    apiKey:
      "",

    password:
      "",

    useApi:
      true,

    blockRules:
      []

  });


// Password is required.
// API key is optional.

if (

  !data.password ||

  typeof data.password !== "string" ||

  !data.password.trim()

) {

  setupView.style.display =
    "flex";

  mainView.style.display =
    "none";

  return;

}


if (
  !Array.isArray(data.blockRules)
) {

  await chrome.storage.local.set({

    blockRules:
      []

  });

}


setupView.style.display =
  "none";

mainView.style.display =
  "block";


updateApiSettingsUI(

  typeof data.apiKey === "string"
    ? data.apiKey
    : "",

  data.useApi !== false

);


await renderRules();


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

  
if (
  busy
) {

  return;

}


const key =
  initApiKey.value.trim();


const pass =
  initPassword.value.trim();


if (
  !pass
) {

  alert(
    "Please create a password."
  );


  return;

}


busy =
  true;


btnSaveSetup.disabled =
  true;


try {

  const data =
    await chrome.storage.local.get({

      blockRules:
        [],

      useApi:
        true

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


  setupView.style.display =
    "none";

  mainView.style.display =
    "block";


  initApiKey.value =
    "";

  initPassword.value =
    "";


  updateApiSettingsUI(

    key,

    key
      ? data.useApi !== false
      : false

  );


  await renderRules();


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

  busy =
    false;

  btnSaveSetup.disabled =
    false;

}
  

}

);

// ======================================================
// ENTER SETUP
// ======================================================

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


// ==================================================
// YOUTU.BE
// ==================================================

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


// ==================================================
// YOUTUBE.COM
// ==================================================

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
// GET RULE VALUE
// ======================================================
//
// Supports both:
//
// New format:
// {
//   value: "chess",
//   type: "keyword"
// }
//
// Legacy format:
// "chess"
//
// Legacy rules are treated as metadata by the
// service worker for backward compatibility.
// ======================================================

function getRuleValue(rule) {

if (

  
rule &&

typeof rule === "object" &&

typeof rule.value === "string"
  

) {

  
return rule.value.trim();
  

}

if (
typeof rule === "string"
) {

  
return rule.trim();
  

}

return "";

}

// ======================================================
// GET RULE TYPE
// ======================================================

function getRuleType(rule) {

if (

  
rule &&

typeof rule === "object" &&

rule.type === "keyword"
  

) {

  
return "keyword";
  

}

return "metadata";

}

// ======================================================
// RENDER RULES
// ======================================================
//
// The rule type is intentionally hidden.
//
// Example UI:
//
// chess
// GothamChess
// Minecraft
//
// No [keyword] or [metadata] tag is displayed.
// ======================================================

async function renderRules() {

try {

  
const data =
  await chrome.storage.local.get({

    blockRules:
      []

  });


const rules =
  Array.isArray(data.blockRules)

    ? data.blockRules

    : [];


rulesList.innerHTML =
  "";


rules.forEach(

  rule => {

    const ruleValue =
      getRuleValue(rule);


    if (
      !ruleValue
    ) {

      return;

    }


    const li =
      document.createElement("li");


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

              blockRules:
                []

            });


          const latestRules =
            Array.isArray(
              latest.blockRules
            )

              ? [...latest.blockRules]

              : [];


          const removeIndex =
            latestRules.findIndex(

              existingRule => {

                const existingValue =
                  getRuleValue(
                    existingRule
                  );


                const existingType =
                  getRuleType(
                    existingRule
                  );


                const currentType =
                  getRuleType(
                    rule
                  );


                return (

                  existingValue.toLowerCase() ===
                    ruleValue.toLowerCase() &&

                  existingType ===
                    currentType

                );

              }

            );


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


    const span =
      document.createElement("span");


    span.className =
      "item-text";


    span.textContent =
      ruleValue;


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
// SAVE ONE KEYWORD RULE
// ======================================================
//
// Normal text entered manually is stored as:
//
// {
//   value: "chess",
//   type: "keyword"
// }
//
// The type is hidden from the UI.
// ======================================================

async function saveNewRule(
newRule
) {

const cleanRule =
String(
newRule || ""
).trim();

if (
!cleanRule
) {

  
return false;
  

}

const data =
await chrome.storage.local.get({

  
  blockRules:
    []

});
  

const currentRules =
Array.isArray(
data.blockRules
)

  
  ? [...data.blockRules]

  : [];
  

const duplicate =
currentRules.some(

  
  rule => {

    const value =
      getRuleValue(rule);


    return (

      value &&

      value.toLowerCase() ===
        cleanRule.toLowerCase()

    );

  }

);
  

if (
duplicate
) {

  
return false;
  

}

currentRules.push({

  
value:
  cleanRule,

type:
  "keyword"
  

});

await chrome.storage.local.set({

  
blockRules:
  currentRules
  

});

if (
adminPanel.style.display ===
"block"
) {

  
await renderRules();
  

}

return true;

}

// ======================================================
// SAVE VIDEO KEYWORDS
// ======================================================
//
// Channel:
// Stored as metadata.
//
// Extracted keywords:
// Stored as keyword rules.
//
// Example:
//
// Channel:
// GothamChess
//
// Keywords:
// Magnus Carlsen
// Hikaru Nakamura
//
// Internal storage:
//
// {
//   value: "GothamChess",
//   type: "metadata"
// }
//
// {
//   value: "Magnus Carlsen",
//   type: "keyword"
// }
//
// The types are never displayed in the UI.
// ======================================================

async function saveVideoKeywords(
result
) {

const keywords =
Array.isArray(
result.keywords
)

  
  ? result.keywords

      .map(
        keyword =>
          String(keyword).trim()
      )

      .filter(Boolean)

  : [];
  

const channel =
typeof result.channel === "string"

  
  ? result.channel.trim()

  : "";
  

const saved = [];

const data =
await chrome.storage.local.get({

  
  blockRules:
    []

});
  

const currentRules =
Array.isArray(data.blockRules)

  
  ? [...data.blockRules]

  : [];
  

// ====================================================
// ADD RULE HELPER
// ====================================================

function addRule(
value,
type
) {

  
const clean =
  String(value || "").trim();


if (
  !clean
) {

  return false;

}


const duplicate =
  currentRules.some(

    existingRule => {

      const existingValue =
        getRuleValue(
          existingRule
        );


      const existingType =
        getRuleType(
          existingRule
        );


      return (

        existingValue &&

        existingValue.toLowerCase() ===
          clean.toLowerCase() &&

        existingType ===
          type

      );

    }

  );


if (
  duplicate
) {

  return false;

}


currentRules.push({

  value:
    clean,

  type:
    type

});


saved.push(
  clean
);


return true;
  

}

// ====================================================
// CHANNEL
// ====================================================

if (
channel
) {

  
addRule(

  channel,

  "metadata"

);
  

}

// ====================================================
// KEYWORDS
// ====================================================

for (
const keyword of keywords
) {

  
addRule(

  keyword,

  "keyword"

);
  

}

await chrome.storage.local.set({

  
blockRules:
  currentRules
  

});

if (
adminPanel.style.display ===
"block"
) {

  
await renderRules();
  

}

return saved;

}

// ======================================================
// CLASSIFY / EXTRACT YOUTUBE VIDEO
// ======================================================

async function classifyYouTubeVideo(
url
) {

const response =
await chrome.runtime.sendMessage({

  
  action:
    "SUMMARIZE_VIDEO",

  url

});
  

if (
!response
) {

  
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

  
typeof response.title !== "string" ||

!response.title.trim()
  

) {

  
throw new Error(
  "Could not extract the YouTube title."
);
  

}

const channel =
typeof response.channel === "string"

  
  ? response.channel.trim()

  : "";
  

const keywords =
Array.isArray(response.keywords)

  
  ? response.keywords

      .filter(

        keyword =>

          typeof keyword === "string" &&

          keyword.trim()

      )

      .map(

        keyword =>

          keyword.trim()

      )

  : [];
  

return {

  
title:
  response.title.trim(),

channel,

keywords,

localKeywords:
  Array.isArray(response.localKeywords)

    ? response.localKeywords

    : [],

aiKeywords:
  Array.isArray(response.aiKeywords)

    ? response.aiKeywords

    : [],

aiUsed:
  response.aiUsed === true
  

};

}

// ======================================================
// DISPLAY ANALYSIS RESULT
// ======================================================

function buildAnalysisText(
result
) {

const lines = [];

lines.push(
`Title: ${result.title}`
);

if (
result.channel
) {

  
lines.push(
  `Channel: ${result.channel}`
);
  

}

if (
result.keywords.length > 0
) {

  
lines.push(
  `Keywords: ${result.keywords.join(", ")}`
);
  

}

lines.push(

  
result.aiUsed

  ? "Gemini: added specific keywords"

  : "Gemini: not used"
  

);

return lines.join(
"\n"
);

}

// ======================================================
// UPDATE API SETTINGS UI
// ======================================================

function updateApiSettingsUI(
apiKey,
useApi
) {

if (
!useApiToggle
) {

  
return;
  

}

useApiToggle.checked =
Boolean(
useApi && apiKey
);

if (
currentApiKey
) {

  
if (
  !apiKey
) {

  currentApiKey.value =
    "Not configured";

} else {

  currentApiKey.value =
    maskApiKey(
      apiKey
    );

}
  

}

}

// ======================================================
// MASK API KEY
// ======================================================

function maskApiKey(
apiKey
) {

if (
!apiKey
) {

  
return "Not configured";
  

}

if (
apiKey.length <= 8
) {

  
return "••••••••";
  

}

return (

  
apiKey.slice(
  0,
  4
) +

"••••••••" +

apiKey.slice(
  -4
)
  

);

}

// ======================================================
// SHOW / HIDE API KEY
// ======================================================

let apiKeyVisible =
false;

btnShowApi.addEventListener(

"click",

async () => {

  
try {

  const data =
    await chrome.storage.local.get({

      apiKey:
        ""

    });


  const apiKey =
    typeof data.apiKey === "string"

      ? data.apiKey

      : "";


  if (
    !apiKey
  ) {

    currentApiKey.value =
      "Not configured";

    apiKeyVisible =
      false;

    btnShowApi.textContent =
      "Show";

    return;

  }


  apiKeyVisible =
    !apiKeyVisible;


  currentApiKey.value =
    apiKeyVisible

      ? apiKey

      : maskApiKey(
          apiKey
        );


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

      apiKey:
        ""

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

  
if (
  busy
) {

  return;

}


const val =
  ruleInput.value.trim();


if (
  !val
) {

  return;

}


const data =
  await chrome.storage.local.get({

    password:
      "",

    blockRules:
      [],

    apiKey:
      "",

    useApi:
      true

  });


// ==================================================
// PASSWORD -> ADMIN PANEL
// ==================================================

if (
  val === data.password
) {

  const shouldOpen =
    adminPanel.style.display ===
    "none";


  adminPanel.style.display =
    shouldOpen

      ? "block"

      : "none";


  if (
    shouldOpen
  ) {

    await renderRules();

  }


  ruleInput.value =
    "";


  return;

}


// ==================================================
// YOUTUBE URL
// ==================================================

if (
  isYouTubeUrl(val)
) {

  const urlToAnalyze =
    val;


  const myAnalysisGeneration =
    ++analysisGeneration;


  const originalValue =
    ruleInput.value;


  ruleInput.value =
    "Extracting video keywords...";


  classifyYouTubeVideo(
    urlToAnalyze
  )

    .then(

      async result => {

        if (

          myAnalysisGeneration !==
          analysisGeneration

        ) {

          return;

        }


        const saved =
          await saveVideoKeywords(
            result
          );


        if (

          ruleInput.value ===
          "Extracting video keywords..."

        ) {

          ruleInput.value =
            "";

        }


        // =================================================
        // SHOW ANALYSIS IN CONSOLE ONLY
        // =================================================

        if (
          saved.length > 0
        ) {

          console.log(
            "[YT-Guard] Video analysis:",
            buildAnalysisText(result)
          );


          console.log(
            "[YT-Guard] Rules added:",
            saved
          );

        } else {

          console.log(
            "[YT-Guard] No new rules were added."
          );

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


        if (

          ruleInput.value ===
          "Extracting video keywords..."

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
// NORMAL TEXT RULE
// ==================================================
//
// Manually entered rules are KEYWORD rules.
//
// Example:
//
// chess
//
// matches:
//
// "The Best Chess Game I Ever Played"
//
// and:
//
// "GothamChess"
// ==================================================

busy =
  true;


btnAdd.disabled =
  true;


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

  busy =
    false;


  btnAdd.disabled =
    false;


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


  if (
    !busy
  ) {

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

  
if (
  busy
) {

  return;

}


const confirmed =
  confirm(
    "Are you sure you want to clear the entire block list?"
  );


if (
  !confirmed
) {

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

if (
  busy
) {

  return;

}


const newKey =
  changeApiKey.value.trim();


if (
  !newKey
) {

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
