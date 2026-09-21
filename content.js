console.log(
  "%c[YT-Guard] Content Script loaded successfully!",
  "background: green; color: white; font-size: 14px;"
);


// ======================================================
// STATE
// ======================================================

let lastCheckedId = null;

let currentCandidate = {
  videoId: null,
  title: null,
  channel: null,
  description: null,
  metadataSince: 0
};

let checkInProgress = false;


// ======================================================
// DEBUG HELPER
// ======================================================

function debug(...args) {
  console.log(
    "%c[YT-Guard]",
    "background: #2ba640; color: white; font-weight: bold;",
    ...args
  );
}


// ======================================================
// GET CURRENT VIDEO ID
// ======================================================

function getCurrentVideoId() {

  const path =
    window.location.pathname;

  const search =
    window.location.search;

  debug(
    "Getting video ID...",
    {
      path,
      search
    }
  );


  if (
    path !== "/watch"
  ) {

    debug(
      "Not a /watch page. No video ID."
    );

    return null;
  }


  const videoId =
    new URLSearchParams(
      search
    ).get("v");


  debug(
    "Current video ID:",
    videoId
  );


  return videoId;
}


// ======================================================
// GET TITLE
// ======================================================

function getRealVideoTitle() {

  debug(
    "Trying to find video title..."
  );


  const selectors = [

    "h1.ytd-watch-metadata yt-formatted-string",

    "h1.title yt-formatted-string",

    "h1.ytd-watch-metadata"

  ];


  for (
    const selector of selectors
  ) {

    const el =
      document.querySelector(
        selector
      );


    if (!el) {

      debug(
        `Title selector not found: ${selector}`
      );

      continue;
    }


    const title =
      (
        el.innerText ||
        el.textContent ||
        ""
      ).trim();


    if (title.length > 0) {

      debug(
        "Title found:",
        title
      );

      return title;
    }
  }


  // Fallback: document.title

  const rawTitle =
    document.title
      .replace(
        /^\(\d+\)\s*/,
        ""
      )
      .replace(
        /\s+-\s+YouTube\s*$/,
        ""
      )
      .trim();


  if (
    !rawTitle ||
    rawTitle === "YouTube"
  ) {

    debug(
      "Could not find a valid title."
    );

    return null;
  }


  debug(
    "Title found using document.title:",
    rawTitle
  );


  return rawTitle;
}


// ======================================================
// GET CHANNEL
// ======================================================

function getVideoChannel() {

  const selectors = [

    "ytd-channel-name a",

    "#owner ytd-channel-name a",

    "#owner-name a",

    "ytd-video-owner-renderer a"

  ];


  for (
    const selector of selectors
  ) {

    const elements =
      document.querySelectorAll(
        selector
      );


    for (
      const el of elements
    ) {

      const text =
        (
          el.innerText ||
          el.textContent ||
          ""
        ).trim();


      if (text) {

        debug(
          "Channel found:",
          text
        );

        return text;
      }
    }
  }


  debug(
    "Channel not found. Using empty string."
  );


  return "";
}


// ======================================================
// GET DESCRIPTION
// ======================================================

function getVideoDescription() {

  const selectors = [

    "#description-inline-expander yt-attributed-string",

    "#description-inline-expander",

    "ytd-text-inline-expander#description-inline-expander",

    "#description yt-attributed-string",

    "#description"

  ];


  for (
    const selector of selectors
  ) {

    const el =
      document.querySelector(
        selector
      );


    if (!el) {
      continue;
    }


    const text =
      (
        el.innerText ||
        el.textContent ||
        ""
      ).trim();


    if (text) {

      debug(
        "Description found. Length:",
        text.length
      );

      return text;
    }
  }


  debug(
    "Description not found. Using empty string."
  );


  return "";
}


// ======================================================
// GET ALL METADATA
// ======================================================

function getVideoMetadata() {

  const metadata = {

    title:
      getRealVideoTitle() || "",

    channel:
      getVideoChannel() || "",

    description:
      getVideoDescription() || ""

  };


  debug(
    "Collected metadata:",
    metadata
  );


  return metadata;
}


// ======================================================
// CALL SERVICE WORKER
// ======================================================

async function checkAndBlock(
  metadata,
  videoId
) {

  if (checkInProgress) {

    debug(
      "Check already in progress. Skipping."
    );

    return;
  }


  checkInProgress = true;


  try {

    debug(
      "========================================"
    );

    debug(
      "STARTING VIDEO CHECK"
    );

    debug(
      "Video ID:",
      videoId
    );

    debug(
      "Title:",
      metadata.title
    );

    debug(
      "Channel:",
      metadata.channel
    );

    debug(
      "Description length:",
      metadata.description.length
    );


    // ----------------------------------------
    // CHECK EXTENSION RUNTIME
    // ----------------------------------------

    if (
      typeof chrome === "undefined" ||
      !chrome.runtime ||
      typeof chrome.runtime.sendMessage !== "function"
    ) {

      throw new Error(
        "Chrome extension runtime is unavailable in this content script."
      );

    }


    // ----------------------------------------
    // SEND CHECK_VIDEO
    // ----------------------------------------

    debug(
      "Sending CHECK_VIDEO message to service worker..."
    );


    const result =
      await chrome.runtime.sendMessage({

        action:
          "CHECK_VIDEO",

        videoId,

        title:
          metadata.title,

        channel:
          metadata.channel,

        description:
          metadata.description

      });


    debug(
      "CHECK_VIDEO response received:",
      result
    );


    // ----------------------------------------
    // VIDEO CHANGED
    // ----------------------------------------

    const currentVideoId =
      getCurrentVideoId();


    debug(
      "Video ID after check:",
      currentVideoId
    );


    if (
      currentVideoId !== videoId
    ) {

      debug(
        "Video changed during check. Ignoring result."
      );

      return;
    }


    // ----------------------------------------
    // NO RESPONSE
    // ----------------------------------------

    if (!result) {

      throw new Error(
        "No response from service worker."
      );

    }


    // ----------------------------------------
    // SERVICE WORKER ERROR
    // ----------------------------------------

    if (result.error) {

      throw new Error(
        result.error
      );

    }


    // ----------------------------------------
    // RESULT
    // ----------------------------------------

    debug(
      "FINAL CHECK RESULT:",
      result
    );


    lastCheckedId =
      videoId;


    // ----------------------------------------
    // BLOCK
    // ----------------------------------------

    if (
      result.block === true
    ) {

      console.warn(
        "%c[YT-Guard] BLOCK MATCH FOUND!",
        "background: red; color: white; font-size: 16px; font-weight: bold;"
      );


      debug(
        "Matched rule:",
        result.matchedRule
      );


      debug(
        "Match source:",
        result.source
      );


      // ----------------------------------------
      // PAUSE VIDEO
      // ----------------------------------------

      debug(
        "Pausing all videos..."
      );


      document
        .querySelectorAll("video")
        .forEach(
          video => {

            try {

              video.pause();

            } catch {

              // Ignore.

            }

          }
        );


      // ----------------------------------------
      // REDIRECT TO YOUTUBE
      // ----------------------------------------

      debug(
        "Sending REDIRECT_TO_YOUTUBE..."
      );


      try {

        const redirectResult =
          await chrome.runtime.sendMessage({

            action:
              "REDIRECT_TO_YOUTUBE"

          });


        debug(
          "REDIRECT_TO_YOUTUBE response:",
          redirectResult
        );


      } catch (redirectError) {

        console.error(
          "[YT-Guard] Could not request YouTube redirect:",
          redirectError
        );

      }


    } else {

      debug(
        "%cVIDEO ALLOWED",
        "background: #333; color: #7ee787; font-weight: bold;"
      );

    }


    debug(
      "VIDEO CHECK FINISHED"
    );

    debug(
      "========================================"
    );


  } catch (error) {

    console.error(
      "%c[YT-Guard] CHECK FAILED",
      "background: red; color: white; font-size: 14px; font-weight: bold;",
      error
    );


  } finally {

    checkInProgress =
      false;

  }
}


// ======================================================
// RESET CANDIDATE
// ======================================================

function resetCandidate(
  videoId
) {

  debug(
    "Resetting candidate for video:",
    videoId
  );


  currentCandidate = {

    videoId,

    title: null,

    channel: null,

    description: null,

    metadataSince:
      0

  };
}


// ======================================================
// PERIODIC CHECK
// ======================================================

function runCheck() {

  const videoId =
    getCurrentVideoId();


  // ----------------------------------------
  // NOT VIDEO PAGE
  // ----------------------------------------

  if (!videoId) {

    return;
  }


  // ----------------------------------------
  // NEW VIDEO
  // ----------------------------------------

  if (
    videoId !==
    currentCandidate.videoId
  ) {

    debug(
      "%cNEW VIDEO DETECTED",
      "background: blue; color: white; font-weight: bold;",
      videoId
    );


    resetCandidate(
      videoId
    );


    lastCheckedId =
      null;

  }


  // ----------------------------------------
  // ALREADY CHECKED
  // ----------------------------------------

  if (
    videoId ===
    lastCheckedId
  ) {

    return;
  }


  // ----------------------------------------
  // GET METADATA
  // ----------------------------------------

  const metadata =
    getVideoMetadata();


  // ----------------------------------------
  // NO TITLE
  // ----------------------------------------

  if (
    !metadata.title
  ) {

    debug(
      "No title yet. Waiting for YouTube..."
    );

    return;
  }


  // ----------------------------------------
  // CHECK WHETHER METADATA CHANGED
  // ----------------------------------------

  const metadataChanged =

    metadata.title !==
      currentCandidate.title ||

    metadata.channel !==
      currentCandidate.channel ||

    metadata.description !==
      currentCandidate.description;


  if (metadataChanged) {

    debug(
      "Metadata changed. Saving candidate..."
    );


    debug(
      "OLD:",
      currentCandidate
    );


    debug(
      "NEW:",
      metadata
    );


    currentCandidate.title =
      metadata.title;

    currentCandidate.channel =
      metadata.channel;

    currentCandidate.description =
      metadata.description;

    currentCandidate.metadataSince =
      Date.now();


    debug(
      "Waiting 500ms for metadata to stabilize..."
    );


    return;
  }


  // ----------------------------------------
  // WAIT FOR STABLE METADATA
  // ----------------------------------------

  const stableFor =
    Date.now() -
    currentCandidate.metadataSince;


  if (
    stableFor < 500
  ) {

    return;
  }


  debug(
    "%cMETADATA READY",
    "background: orange; color: black; font-weight: bold;"
  );


  debug(
    "Stable for:",
    stableFor,
    "ms"
  );


  checkAndBlock(
    metadata,
    videoId
  );
}


// ======================================================
// START PERIODIC CHECK
// ======================================================

debug(
  "Starting 500ms YouTube monitoring loop..."
);


setInterval(
  runCheck,
  500
);


// ======================================================
// YOUTUBE SPA NAVIGATION
// ======================================================

window.addEventListener(
  "yt-navigate-finish",
  () => {

    debug(
      "%cYouTube navigation detected",
      "background: purple; color: white; font-weight: bold;"
    );


    const videoId =
      getCurrentVideoId();


    debug(
      "New navigation video ID:",
      videoId
    );


    // ----------------------------------------
    // IMPORTANT:
    // Cancel the previous video's state.
    // ----------------------------------------

    checkInProgress =
      false;


    lastCheckedId =
      null;


    resetCandidate(
      videoId
    );


    runCheck();


    setTimeout(
      runCheck,
      300
    );


    setTimeout(
      runCheck,
      800
    );


    setTimeout(
      runCheck,
      1500
    );

  }
);


// ======================================================
// PAGE LOAD
// ======================================================

window.addEventListener(
  "load",
  () => {

    debug(
      "%cYouTube page load detected",
      "background: purple; color: white; font-weight: bold;"
    );


    runCheck();


    setTimeout(
      runCheck,
      500
    );


    setTimeout(
      runCheck,
      1200
    );

  }
);


// ======================================================
// IMMEDIATE INITIAL CHECK
// ======================================================

debug(
  "Running initial immediate check..."
);


runCheck();