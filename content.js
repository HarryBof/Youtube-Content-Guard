console.log(
  "%c[YT-Guard] Content Script đã nạp thành công!",
  "background: green; color: white; font-size: 14px;"
);


// ======================================================
// STATE
// ======================================================

let lastCheckedId = null;

let currentCandidate = {
  videoId: null,
  title: null,
  titleSince: 0
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
// LẤY TITLE VIDEO
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


  // ----------------------------------------
  // FALLBACK
  // ----------------------------------------

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
// GỌI SERVICE WORKER KIỂM TRA VIDEO
// ======================================================

async function checkAndBlock(
  title,
  videoId
) {

  if (checkInProgress) {
    return;
  }


  checkInProgress = true;


  try {

    console.log(
      "[YT-Guard] Đang gửi tiêu đề sang Gemini:",
      title
    );


    const result =
      await chrome.runtime.sendMessage({
        action: "CHECK_VIDEO",
        title,
        videoId
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
        "[YT-Guard] Video đã thay đổi trong lúc AI xử lý. Bỏ qua kết quả cũ."
      );

      return;
    }


    // ----------------------------------------
    // KHÔNG CÓ RESPONSE
    // ----------------------------------------

    if (!result) {

      console.warn(
        "[YT-Guard] Không nhận được phản hồi từ service worker."
      );

      return;
    }


    // ----------------------------------------
    // API ERROR
    // ----------------------------------------

    if (result.error) {

      console.error(
        "[YT-Guard] Gemini error:",
        result.error
      );

      // Không đánh dấu đã kiểm tra,
      // để vòng lặp có thể thử lại.

      return;
    }


    console.log(
      "[YT-Guard] Kết quả Gemini:",
      result
    );


    // ----------------------------------------
    // CHỈ ĐÁNH DẤU SAU KHI RESPONSE HỢP LỆ
    // ----------------------------------------

    lastCheckedId = videoId;


    // ----------------------------------------
    // BLOCK
    // ----------------------------------------

    if (result.block === true) {

      console.warn(
        "[YT-Guard] Vi phạm tiêu chí chặn! Đang đóng tab..."
      );


      // Dừng video ngay trước.
      document
        .querySelectorAll("video")
        .forEach(video => {

          try {
            video.pause();
          } catch {
            // Không làm gì.
          }

        });


      // Yêu cầu service worker đóng tab.
      try {

        await chrome.runtime.sendMessage({
          action: "CLOSE_CURRENT_TAB"
        });

      } catch (closeError) {

        console.error(
          "[YT-Guard] Không thể yêu cầu đóng tab:",
          closeError
        );


        // Fallback.
        window.close();
      }
    }


  } catch (error) {

    console.error(
      "[YT-Guard] Lỗi khi kiểm tra video:",
      error
    );

  } finally {

    checkInProgress = false;
  }
}


// ======================================================
// CHỜ TITLE ỔN ĐỊNH
// ======================================================

function runCheck() {

  const videoId =
    getCurrentVideoId();


  // ----------------------------------------
  // KHÔNG PHẢI TRANG VIDEO
  // ----------------------------------------

  if (!videoId) {

    lastCheckedId = null;

    currentCandidate = {
      videoId: null,
      title: null,
      titleSince: 0
    };

    return;
  }


  // ----------------------------------------
  // VIDEO MỚI
  // ----------------------------------------

  if (
    videoId !==
    currentCandidate.videoId
  ) {

    currentCandidate = {
      videoId,
      title: null,
      titleSince: 0
    };


    lastCheckedId = null;
  }


  // ----------------------------------------
  // ĐÃ KIỂM TRA
  // ----------------------------------------

  if (
    videoId === lastCheckedId
  ) {
    return;
  }


  // ----------------------------------------
  // LẤY TITLE
  // ----------------------------------------

  const title =
    getRealVideoTitle();


  if (!title) {
    return;
  }


  // ----------------------------------------
  // TITLE VỪA ĐỔI
  // ----------------------------------------

  if (
    title !==
    currentCandidate.title
  ) {

    currentCandidate.title =
      title;

    currentCandidate.titleSince =
      Date.now();

    return;
  }


  // ----------------------------------------
  // CHỜ 500ms
  // ----------------------------------------

  if (
    Date.now() -
    currentCandidate.titleSince <
    500
  ) {

    return;
  }


  console.log(
    "[YT-Guard] Đã lấy được tiêu đề chuẩn:",
    title
  );


  checkAndBlock(
    title,
    videoId
  );
}


// ======================================================
// KIỂM TRA ĐỊNH KỲ
// ======================================================

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


    lastCheckedId = null;


    currentCandidate = {
      videoId,
      title: null,
      titleSince: 0
    };


    runCheck();


    setTimeout(
      runCheck,
      200
    );


    setTimeout(
      runCheck,
      600
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

  }
);