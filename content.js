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
// LẤY VIDEO ID HIỆN TẠI
// ======================================================

function getCurrentVideoId() {

  if (
    window.location.pathname !== "/watch"
  ) {
    return null;
  }

  return new URLSearchParams(
    window.location.search
  ).get("v");
}


// ======================================================
// LẤY TITLE
// ======================================================

function getRealVideoTitle() {

  const el =
    document.querySelector(
      "h1.ytd-watch-metadata yt-formatted-string"
    ) ||
    document.querySelector(
      "h1.title yt-formatted-string"
    ) ||
    document.querySelector(
      "h1.ytd-watch-metadata"
    );

  if (el) {

    const title =
      (
        el.innerText ||
        el.textContent ||
        ""
      ).trim();

    if (title.length > 0) {
      return title;
    }
  }


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
// LẤY CHANNEL
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
        return text;
      }
    }
  }


  return "";
}


// ======================================================
// LẤY DESCRIPTION
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
// LẤY TOÀN BỘ METADATA
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
// GỌI SERVICE WORKER
// ======================================================

async function checkAndBlock(
  metadata,
  videoId
) {

  if (checkInProgress) {
    return;
  }

  checkInProgress = true;

  try {

    console.log(
      "[YT-Guard] Checking metadata:",
      metadata
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


    // ----------------------------------------
    // VIDEO ĐÃ THAY ĐỔI
    // ----------------------------------------

    const currentVideoId =
      getCurrentVideoId();

    if (
      currentVideoId !== videoId
    ) {

      console.log(
        "[YT-Guard] Video changed during check. Skipping result."
      );

      return;
    }


    if (!result) {

      console.warn(
        "[YT-Guard] Không nhận được phản hồi từ service worker."
      );

      return;
    }


    if (result.error) {

      console.error(
        "[YT-Guard] Check error:",
        result.error
      );

      return;
    }


    console.log(
      "[YT-Guard] Check result:",
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
        "[YT-Guard] Vi phạm tiêu chí chặn! Đang đóng tab..."
      );


      document
        .querySelectorAll("video")
        .forEach(
          video => {

            try {
              video.pause();
            } catch {
              // Không làm gì.
            }

          }
        );


      try {

        await chrome.runtime.sendMessage({

          action:
            "CLOSE_CURRENT_TAB"

        });

      } catch (closeError) {

        console.error(
          "[YT-Guard] Không thể yêu cầu đóng tab:",
          closeError
        );

        window.close();
      }
    }


  } catch (error) {

    console.error(
      "[YT-Guard] Lỗi khi kiểm tra video:",
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
// KIỂM TRA ĐỊNH KỲ
// ======================================================

function runCheck() {

  const videoId =
    getCurrentVideoId();


  // ----------------------------------------
  // KHÔNG PHẢI TRANG VIDEO
  // ----------------------------------------

  if (!videoId) {

    lastCheckedId =
      null;

    resetCandidate(
      null
    );

    return;
  }


  // ----------------------------------------
  // VIDEO MỚI
  // ----------------------------------------

  if (
    videoId !==
    currentCandidate.videoId
  ) {

    resetCandidate(
      videoId
    );

    lastCheckedId =
      null;
  }


  // ----------------------------------------
  // ĐÃ KIỂM TRA
  // ----------------------------------------

  if (
    videoId ===
    lastCheckedId
  ) {

    return;
  }


  // ----------------------------------------
  // LẤY METADATA
  // ----------------------------------------

  const metadata =
    getVideoMetadata();


  if (
    !metadata.title
  ) {

    return;
  }


  // ----------------------------------------
  // METADATA VỪA THAY ĐỔI
  // ----------------------------------------

  const metadataChanged =

    metadata.title !==
      currentCandidate.title ||

    metadata.channel !==
      currentCandidate.channel ||

    metadata.description !==
      currentCandidate.description;


  if (metadataChanged) {

    currentCandidate.title =
      metadata.title;

    currentCandidate.channel =
      metadata.channel;

    currentCandidate.description =
      metadata.description;

    currentCandidate.metadataSince =
      Date.now();

    return;
  }


  // ----------------------------------------
  // CHỜ METADATA ỔN ĐỊNH
  // ----------------------------------------

  if (
    Date.now() -
      currentCandidate.metadataSince <
    500
  ) {

    return;
  }


  console.log(
    "[YT-Guard] Metadata ready:",
    metadata
  );


  checkAndBlock(
    metadata,
    videoId
  );
}


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

    const videoId =
      getCurrentVideoId();


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