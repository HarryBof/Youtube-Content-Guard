
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

const changeApiKey = document.getElementById("change-api-key");
const btnUpdateKey = document.getElementById("btn-update-key");


// busy chỉ dùng cho các thao tác ngắn trong popup.
// Gemini analysis KHÔNG khóa toàn bộ popup nữa.
let busy = false;


// Số lần phân tích hiện tại.
// Dùng để tránh kết quả cũ ghi đè kết quả mới.
let analysisGeneration = 0;


// ======================================================
// KHỞI TẠO POPUP
// ======================================================

async function initializePopup() {

  try {

    const data =
      await chrome.storage.local.get([
        "apiKey",
        "password",
        "blockRules"
      ]);


    if (
      !data.apiKey ||
      !data.password
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


    ruleInput.focus();

  } catch (error) {

    console.error(
      "[YT-Guard] Lỗi khởi tạo popup:",
      error
    );

  }
}


initializePopup();


// ======================================================
// LƯU SETUP BAN ĐẦU
// ======================================================

btnSaveSetup.addEventListener(
  "click",
  async () => {

    if (busy) return;


    const key =
      initApiKey.value.trim();


    const pass =
      initPassword.value.trim();


    if (
      !key ||
      !pass
    ) {

      alert(
        "Vui lòng nhập API Key và Password."
      );

      return;
    }


    busy = true;

    btnSaveSetup.disabled = true;


    try {

      const data =
        await chrome.storage.local.get([
          "blockRules"
        ]);


      await chrome.storage.local.set({

        apiKey:
          key,

        password:
          pass,

        blockRules:
          Array.isArray(data.blockRules)
            ? data.blockRules
            : []

      });


      setupView.style.display = "none";
      mainView.style.display = "block";


      initApiKey.value = "";
      initPassword.value = "";


      ruleInput.focus();

    } catch (error) {

      console.error(
        "[YT-Guard] Lỗi lưu thiết lập:",
        error
      );


      alert(
        "Không thể lưu thiết lập."
      );

    } finally {

      busy = false;

      btnSaveSetup.disabled = false;

    }

  }
);


// ======================================================
// KIỂM TRA / PARSE YOUTUBE URL
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


    // ----------------------------------------
    // youtu.be/VIDEO_ID
    // ----------------------------------------

    if (
      hostname === "youtu.be"
    ) {

      const videoId =
        url.pathname
          .split("/")
          .filter(Boolean)[0];


      if (!videoId) {
        return null;
      }


      if (
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


    // ----------------------------------------
    // youtube.com/watch?v=VIDEO_ID
    // ----------------------------------------

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
// RENDER DANH SÁCH RULE
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


        // ----------------------------------------
        // NÚT XÓA
        // ----------------------------------------

        const btnRemove =
          document.createElement("button");


        btnRemove.className =
          "btn-remove";


        btnRemove.textContent =
          "-";


        btnRemove.title =
          "Xóa rule này";


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
                "[YT-Guard] Lỗi xóa rule:",
                error
              );

            }

          }
        );


        // ----------------------------------------
        // TEXT RULE
        // ----------------------------------------

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
      "[YT-Guard] Lỗi render rules:",
      error
    );

  }
}


// ======================================================
// LƯU RULE MỚI
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


  // Không thêm rule trùng.
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
// GỌI SERVICE WORKER ĐỂ PHÂN LOẠI VIDEO
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
      "Không nhận được phản hồi từ service worker."
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
      "Gemini không trả về category."
    );

  }


  if (

    typeof response.title !== "string" ||

    !response.title.trim()

  ) {

    throw new Error(
      "Gemini không trả về title."
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
// TẠO RULE TỪ THÔNG TIN GEMINI
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
// NÚT +
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


    // ----------------------------------------
    // Lấy config trước.
    // ----------------------------------------

    const data =
      await chrome.storage.local.get([
        "password",
        "blockRules",
        "apiKey"
      ]);


    // ----------------------------------------
    // 1. PASSWORD -> ADMIN
    // ----------------------------------------

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


    // ----------------------------------------
    // 2. YOUTUBE URL -> GEMINI
    // ----------------------------------------

    if (
      isYouTubeUrl(val)
    ) {

      if (!data.apiKey) {

        alert(
          "Chưa có Gemini API Key."
        );

        return;
      }


      // Lưu URL ngay lúc bắt đầu.
      // Không dùng giá trị input sau khi await.
      const urlToAnalyze =
        val;


      // Mỗi request có một ID riêng.
      const myAnalysisGeneration =
        ++analysisGeneration;


      // Không khóa ruleInput hoặc btnAdd.
      // Người dùng vẫn có thể sử dụng popup.
      const originalValue =
        ruleInput.value;


      ruleInput.value =
        "Đang phân tích video...";


      // ----------------------------------------
      // Chạy Gemini mà không khóa toàn popup.
      // ----------------------------------------

      classifyYouTubeVideo(
        urlToAnalyze
      )

        .then(
          async result => {

            // Nếu request này đã cũ,
            // không ghi đè UI.
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
                "Không tạo được rule từ kết quả Gemini."
              );

            }


            await saveNewRule(
              generatedRule
            );


            // Chỉ xóa thông báo phân tích
            // nếu input vẫn đang chứa nó.
            if (
              ruleInput.value ===
              "Đang phân tích video..."
            ) {

              ruleInput.value = "";

            }

          }
        )

        .catch(
          error => {

            console.error(
              "[YT-Guard] Lỗi phân tích video:",
              error
            );


            if (
              myAnalysisGeneration !==
              analysisGeneration
            ) {

              return;
            }


            // Nếu người dùng đã thay đổi input,
            // không ghi đè nội dung của họ.
            if (
              ruleInput.value ===
              "Đang phân tích video..."
            ) {

              ruleInput.value =
                originalValue;

            }


            alert(
              `Không thể phân tích video.\n\n${error.message}`
            );

          }
        );

      return;
    }


    // ----------------------------------------
    // 3. TEXT -> RULE
    // ----------------------------------------

    busy = true;

    btnAdd.disabled = true;


    try {

      await saveNewRule(
        val
      );


      ruleInput.value = "";


    } catch (error) {

      console.error(
        "[YT-Guard] Lỗi khi thêm rule:",
        error
      );


      alert(
        `Không thể thêm rule.\n\n${error.message}`
      );

    } finally {

      busy = false;

      btnAdd.disabled = false;

      ruleInput.focus();

    }

  }
);


// ======================================================
// ENTER
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
// XÓA TẤT CẢ
// ======================================================

btnClearAll.addEventListener(
  "click",
  async () => {

    if (busy) {
      return;
    }


    const confirmed =
      confirm(
        "Bạn có chắc chắn muốn xóa toàn bộ danh sách chặn?"
      );


    if (!confirmed) {
      return;
    }


    try {

      await chrome.storage.local.set({
        blockRules: []
      });


      await renderRules();

    } catch (error) {

      console.error(
        "[YT-Guard] Lỗi xóa tất cả rule:",
        error
      );


      alert(
        "Không thể xóa danh sách."
      );

    }

  }
);


// ======================================================
// ĐỔI API KEY
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
          newKey
      });


      changeApiKey.value = "";


      alert(
        "Đã cập nhật API Key mới!"
      );

    } catch (error) {

      console.error(
        "[YT-Guard] Lỗi cập nhật API Key:",
        error
      );


      alert(
        "Không thể cập nhật API Key."
      );

    }

  }
);
