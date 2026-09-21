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

let activeCheckVideoId = null;


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

  if (
    path !== "/watch"
  ) {

    return null;

  }


  const videoId =
    new URLSearchParams(
      window.location.search
    ).get("v");


  if (
    !videoId ||
    !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)
  ) {

    return null;

  }


  return videoId;

}


// ======================================================
// GET TITLE
// ======================================================

function getRealVideoTitle() {

  const selectors = [

    "h1.ytd-watch-metadata yt-formatted-string",

    "h1.title yt-formatted-string",

    "h1.ytd-watch-metadata",

    "yt-formatted-string.ytd-watch-metadata"

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


    const title =
      (
        el.innerText ||
        el.textContent ||
        ""
      ).trim();


    if (title) {

      return title;

    }

  }


  // Fallback to document.title.

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

    return null;

  }


  return rawTitle;

}


// ======================================================
// GET CHANNEL
// ======================================================

function getVideoChannel() {

  const selectors = [

    "#owner ytd-channel-name a",

    "ytd-channel-name a",

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

        return text;

      }

    }

  }


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

      return text;

    }

  }


  return "";

}


// ======================================================
// GET ALL METADATA
// ======================================================

function getVideoMetadata() {

  return {

    title:
      getRealVideoTitle() || "",

    channel:
      getVideoChannel() || "",

    description:
      getVideoDescription() || ""

  };

}


// ======================================================
// NORMALIZE TEXT
// ======================================================

function normalizeText(text) {

  return String(
    text || ""
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^\p{L}\p{N}]+/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}


// ======================================================
// EXACT FULL-FIELD MATCH
// ======================================================
//
// The rule must match the ENTIRE field.
//
// Examples:
//
// Rule: "Julien"
// Text: "Julien Song"
// -> false
//
// Rule: "Julien Song"
// Text: "Julien Song"
// -> true
//
// Rule: "witty_alien"
// Channel: "witty_alien"
// -> true
//
// Rule: "witty"
// Channel: "witty_alien"
// -> false
//

function ruleMatchesEntireField(
  rule,
  text
) {

  const normalizedRule =
    normalizeText(rule);


  const normalizedText =
    normalizeText(text);


  if (
    !normalizedRule ||
    !normalizedText
  ) {

    return false;

  }


  return normalizedRule ===
    normalizedText;

}


// ======================================================
// LOCAL RULE MATCHING
// ======================================================
//
// Only the following fields are checked locally:
//
// 1. Full title
// 2. Full channel name
//
// Description is intentionally NOT used.
//
// A partial match is never accepted.
//

function findLocalRuleMatch(
  title,
  channel,
  blockRules
) {

  // ----------------------------------------
  // Check full video title.
  // ----------------------------------------

  for (
    const rule of blockRules
  ) {

    if (
      ruleMatchesEntireField(
        rule,
        title
      )
    ) {

      return {

        matched:
          true,

        rule,

        field:
          "title"

      };

    }

  }


  // ----------------------------------------
  // Check full channel name.
  // ----------------------------------------

  for (
    const rule of blockRules
  ) {

    if (
      ruleMatchesEntireField(
        rule,
        channel
      )
    ) {

      return {

        matched:
          true,

        rule,

        field:
          "channel"

      };

    }

  }


  return {

    matched:
      false,

    rule:
      null,

    field:
      null

  };

}


// ======================================================
// CHECK EXTENSION RUNTIME
// ======================================================

function extensionRuntimeAvailable() {

  return (

    typeof chrome !== "undefined" &&

    chrome.runtime &&

    typeof chrome.runtime.sendMessage ===
      "function"

  );

}


// ======================================================
// CALL SERVICE WORKER
// ======================================================

async function checkAndBlock(
  metadata,
  videoId
) {

  // ----------------------------------------
  // Prevent duplicate checks for the same ID.
  // ----------------------------------------

  if (
    checkInProgress
  ) {

    debug(
      "A check is already running. Skipping new check."
    );

    return;

  }


  // ----------------------------------------
  // Make sure this is still the current video.
  // ----------------------------------------

  const currentVideoId =
    getCurrentVideoId();


  if (
    currentVideoId !== videoId
  ) {

    debug(
      "Video changed before check started. Ignoring."
    );

    return;

  }


  checkInProgress =
    true;

  activeCheckVideoId =
    videoId;


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


    // ----------------------------------------
    // CHECK EXTENSION RUNTIME
    // ----------------------------------------

    if (
      !extensionRuntimeAvailable()
    ) {

      throw new Error(
        "Chrome extension runtime is unavailable."
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
    // CHECK WHETHER VIDEO CHANGED
    // ----------------------------------------

    const videoAfterCheck =
      getCurrentVideoId();


    if (
      videoAfterCheck !== videoId
    ) {

      debug(
        "Video changed while checking. Ignoring result."
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

    if (
      result.error
    ) {

      throw new Error(
        result.error
      );

    }


    // ----------------------------------------
    // SAVE CHECKED VIDEO
    // ----------------------------------------

    lastCheckedId =
      videoId;


    // ----------------------------------------
    // RESULT
    // ----------------------------------------

    debug(
      "FINAL CHECK RESULT:",
      result
    );


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
        "Requesting redirect to YouTube..."
      );


      try {

        const redirectResult =
          await chrome.runtime.sendMessage({

            action:
              "REDIRECT_TO_YOUTUBE"

          });


        debug(
          "Redirect response:",
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

    activeCheckVideoId =
      null;

  }

}


// ======================================================
// RESET CANDIDATE
// ======================================================

function resetCandidate(
  videoId
) {

  currentCandidate = {

    videoId,

    title:
      null,

    channel:
      null,

    description:
      null,

    metadataSince:
      0

  };

}


// ======================================================
// PROCESS CURRENT VIDEO
// ======================================================

function processCurrentVideo() {

  const videoId =
    getCurrentVideoId();


  // ----------------------------------------
  // Not a video page.
  // ----------------------------------------

  if (!videoId) {

    return;

  }


  // ----------------------------------------
  // New video.
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
  // Already checked.
  // ----------------------------------------

  if (
    videoId ===
    lastCheckedId
  ) {

    return;

  }


  // ----------------------------------------
  // Another check is currently running.
  // ----------------------------------------

  if (
    checkInProgress
  ) {

    if (
      activeCheckVideoId ===
      videoId
    ) {

      return;

    }


    debug(
      "A check for another video is still running. Waiting..."
    );

    return;

  }


  // ----------------------------------------
  // Collect metadata.
  // ----------------------------------------

  const metadata =
    getVideoMetadata();


  // ----------------------------------------
  // Title is required.
  // ----------------------------------------

  if (
    !metadata.title
  ) {

    return;

  }


  // ----------------------------------------
  // Detect metadata changes.
  // ----------------------------------------

  const metadataChanged =

    metadata.title !==
      currentCandidate.title ||

    metadata.channel !==
      currentCandidate.channel ||

    metadata.description !==
      currentCandidate.description;


  if (
    metadataChanged
  ) {

    currentCandidate.title =
      metadata.title;

    currentCandidate.channel =
      metadata.channel;

    currentCandidate.description =
      metadata.description;

    currentCandidate.metadataSince =
      Date.now();


    debug(
      "Metadata updated. Waiting for it to stabilize..."
    );


    return;

  }


  // ----------------------------------------
  // Wait for stable metadata.
  // ----------------------------------------

  const stableFor =
    Date.now() -
    currentCandidate.metadataSince;


  if (
    stableFor < 1000
  ) {

    return;

  }


  // ----------------------------------------
  // Metadata is stable.
  // ----------------------------------------

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
// START MONITORING LOOP
// ======================================================

debug(
  "Starting YouTube monitoring loop..."
);


setInterval(
  processCurrentVideo,
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


    // ----------------------------------------
    // If navigation goes away from a video,
    // reset the candidate.
    // ----------------------------------------

    if (!videoId) {

      currentCandidate = {

        videoId:
          null,

        title:
          null,

        channel:
          null,

        description:
          null,

        metadataSince:
          0

      };


      lastCheckedId =
        null;


      return;

    }


    // ----------------------------------------
    // Only reset state if the video actually
    // changed.
    // ----------------------------------------

    if (
      videoId !==
      currentCandidate.videoId
    ) {

      debug(
        "Navigation changed video to:",
        videoId
      );


      resetCandidate(
        videoId
      );


      lastCheckedId =
        null;

    }


    // ----------------------------------------
    // Do NOT manually cancel checkInProgress.
    //
    // The running check will finish normally.
    // checkAndBlock() will verify the video ID
    // before acting on the result.
    // ----------------------------------------

    processCurrentVideo();


    setTimeout(
      processCurrentVideo,
      300
    );


    setTimeout(
      processCurrentVideo,
      800
    );


    setTimeout(
      processCurrentVideo,
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
      "Page load detected."
    );


    processCurrentVideo();


    setTimeout(
      processCurrentVideo,
      500
    );


    setTimeout(
      processCurrentVideo,
      1200
    );

  }
);


// ======================================================
// IMMEDIATE INITIAL CHECK
// ======================================================

debug(
  "Running initial video check..."
);


processCurrentVideo();
