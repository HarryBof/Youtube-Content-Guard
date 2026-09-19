# YouTube Content Guard

A Chrome Extension that uses Google Gemini to automatically detect and block unwanted YouTube videos based on custom user-defined rules.

## Features

* Automatically checks YouTube video titles.
* Uses Google Gemini to decide whether a video matches a blocked topic.
* Automatically pauses and closes blocked YouTube tabs.
* Add custom blocking rules manually.
* Paste a YouTube URL to let Gemini generate a short description that can be added as a blocking rule.
* Password-protected admin panel.
* Delete individual rules.
* Delete all rules at once.
* Change the Gemini API key from the admin panel.
* Uses Chrome Manifest V3.


# Installation

You can check out the release for faster installation, or follow the instruction below.

## 1. Download the project

Download or clone this repository to your computer.

Your extension folder should look like this:

```text
yt-guard/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── service-worker.js
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## 2. Open Chrome Extensions

Open Chrome and go to:

```text
chrome://extensions
```

---

## 3. Enable Developer Mode

Turn on:

**Developer mode**

This option is usually located in the top-right corner of the Extensions page.

---

## 4. Load the extension

Click:

**Load unpacked**

Then select the extension folder:

```text
yt-guard/
```

Select the folder containing:

```text
manifest.json
```

Do **not** select an individual file.

After loading successfully, the extension should appear in Chrome.

---

# First-Time Setup

Click the extension icon in Chrome.

The first time you open it, you will see two fields:

```text
Gemini API Key
Password
```

## Gemini API Key

Enter your Google Gemini API key.

The extension stores the key using Chrome's local extension storage.

## Password

Create a password.

This password is used to open the hidden admin panel.

After saving the setup, the setup screen will no longer appear unless the extension data is removed.

---

# How to Add Blocking Rules

The main interface contains:

```text
[ Input text or link...] [+]
```

There are three ways to use it.

## 1. Add a rule manually

Enter something like:

```text
AI generated cultivation stories
```

Then click `+`.

The rule will be saved to the blocking list.

---

## 2. Add a YouTube video as a rule

Paste a YouTube URL into the input box.

For example:

```text
https://www.youtube.com/watch?v=XXXXXXXXXXX
```

Then press `+`.

The extension sends the video request to Gemini and attempts to generate a short description of its main topic.

That description is then added to the blocking rules.

This can be useful when you find a type of video that you want the extension to automatically recognize in the future.

---

## 3. Open the Admin Panel

Enter the password you created during setup and press `+`.

The admin panel will appear.

From there you can:

* View all blocking rules
* Delete individual rules
* Delete all rules
* Change the Gemini API key

Enter the same password again or exit the extension to hide the admin panel.

---

# How Video Blocking Works

When you open a YouTube video, the extension:

```text
YouTube video
      ↓
Get video title + video URL
      ↓
Send video to Gemini
      ↓
Compare the content with blocking rules
      ↓
Gemini returns:
    block = true / false
      ↓
If true
      ↓
Pause video
      ↓
Close the current tab
```

Gemini can analyze the actual video rather than relying only on keywords in the title. This allows the extension to detect unwanted content even when the video has a misleading, vague, or unrelated title.

For example, a video could have a harmless-looking title but contain the type of content described by one of your blocking rules. The AI can use the video itself to make the decision.

---
