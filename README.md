# YouTube Content Guard

A Chrome extension that automatically detects and blocks unwanted YouTube content using custom rules and Google Gemini.

You can create your own blocking rules, check videos automatically while browsing YouTube, and use Gemini to identify specific content when a local rule does not match.

## Features

* Automatically checks YouTube videos while browsing.
* Supports custom blocking rules.
* Supports two types of rules:

  * **Metadata rules** — exact title or channel matching.
  * **Keyword rules** — matches a keyword anywhere in the title or channel name.
* Local rule checking happens before Gemini is used.
* Uses Google Gemini for additional content understanding when enabled.
* Automatically analyzes YouTube video titles and channel names.
* Paste a YouTube URL into the extension to extract specific keywords/entities.
* Automatically adds extracted video information as blocking rules.
* Password-protected admin panel.
* Delete individual blocking rules.
* Delete all blocking rules.
* Change the Gemini API key from the admin panel.
* Enable or disable Gemini AI.
* Uses Chrome Manifest V3.

---

# How It Works

When a YouTube video is opened, YouTube Content Guard obtains the video's metadata and checks it against the user's blocking rules.

```text
YouTube video
      ↓
Video title + channel
      ↓
Local rule check
      ↓
Match found?
   ↙       ↘
 YES       NO
  ↓         ↓
Block     Gemini
            ↓
       Block / Allow
```

If a video is blocked, the extension redirects the current tab back to:

```text
https://www.youtube.com/
```

The extension does not close the browser tab.

---

# Blocking Rules

There are two types of blocking rules.

## Metadata Rules

A metadata rule must match the entire title or the entire channel name.

For example:

```text
Julien Song
```

Matches:

```text
Title: Julien Song
```

But does not match:

```text
Title: Julien Song Official
```

Similarly:

```text
Song
```

does not match:

```text
Julien Song
```

Metadata matching ignores capitalization, punctuation, and accents.

---

## Keyword Rules

Keyword rules can match anywhere inside the video title or channel name.

For example:

```text
chess
```

can match:

```text
I Played Chess Today
```

and:

```text
GothamChess
```

Keyword matching is case-insensitive and accent-insensitive.

---

# Adding Rules

The main input field can be used in several ways.

## 1. Add a normal rule

Enter a rule into the input field and press `+`.

Example:

```text
chess
```

The rule will be added to the blocking list.

---

## 2. Analyze a YouTube URL

Paste a YouTube video URL into the input field.

Example:

```text
https://www.youtube.com/watch?v=XXXXXXXXXXX
```

Press `+`.

The extension retrieves lightweight metadata from YouTube:

```text
YouTube URL
     ↓
YouTube metadata
     ↓
Title + Channel
     ↓
Gemini
     ↓
Specific keywords/entities
     ↓
Blocking rules
```

Gemini can identify specific entities such as:

* People
* Games
* Movies
* Anime
* Characters
* Franchises
* Products
* Technologies
* Organizations
* Series
* Events
* Other distinctive subjects

The extracted information can then be added to the blocking list.

The extension does **not** send the entire YouTube video to Gemini.

---

# Automatic Video Checking

When a video is opened on YouTube, the extension performs a local check first.

### Step 1 — Local rules

The title and channel are compared against the saved rules.

Keyword rules are checked literally.

Metadata rules require an exact full-text match.

### Step 2 — Gemini

If no local rule matches and Gemini is enabled, the title and channel are sent to Gemini.

Gemini determines whether the video is clearly related to any blocking rule.

```text
Title + Channel + Blocking Rules
              ↓
            Gemini
              ↓
       block = true/false
```

If Gemini determines that the video should be blocked, the extension redirects the current tab back to YouTube.

---

# Gemini AI

Gemini is used for two main tasks.

## Automatic Video Checking

```text
Video title
     +
Channel name
     +
Blocking rules
     ↓
   Gemini
     ↓
Block / Allow
```

Local matching is performed first, so Gemini is not required for every rule check.

## YouTube URL Analysis

When a YouTube URL is manually entered:

```text
YouTube URL
     ↓
YouTube metadata
     ↓
Title + Channel
     ↓
Gemini
     ↓
Specific keywords/entities
```

The purpose is to identify the subject of the content rather than generate a full summary of the video.

---

# First-Time Setup

After installing the extension, open it from the Chrome extensions menu.

The first-time setup requires:

* Gemini API key
* Password

The Gemini API key is optional for basic local rule matching, but Gemini must be configured and enabled for AI-based checking and URL analysis.

The password is used to access the hidden admin panel.

---

# Admin Panel

Enter the password into the main input field and press `+`.

The admin panel allows you to:

* View saved blocking rules
* Delete individual rules
* Delete all rules
* View/change the Gemini API key
* Enable or disable Gemini AI

The rule type is handled internally and does not need to be displayed in the interface.

---

# Installation

## 1. Download the Repository

Clone or download this repository:

```text
https://github.com/HarryBof/Youtube-Content-Guard
```

The extension folder should contain:

```text
Youtube-Content-Guard/
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

Open:

```text
chrome://extensions
```

## 3. Enable Developer Mode

Enable **Developer mode**.

## 4. Load the Extension

Click:

```text
Load unpacked
```

Select the folder containing:

```text
manifest.json
```

The extension should now appear in Chrome.

---

# Privacy & API Key

The Gemini API key is stored using Chrome's local extension storage.

The extension communicates with Google's Gemini API when an AI request is required.

For automatic video checking, the extension sends the information required for the blocking decision rather than the entire YouTube video.

For YouTube URL analysis, the extension retrieves lightweight metadata such as the video title and channel name before sending information to Gemini.

Do not publish your personal Gemini API key in this repository or hard-code it into the source code.

---

# Project Structure

```text
manifest.json
    ↓
Chrome extension configuration


content.js
    ↓
Runs on YouTube pages
Detects video changes
Gets video metadata
Sends video checks to the service worker


service-worker.js
    ↓
Handles Gemini API requests
Handles local rule matching
Checks video metadata
Retrieves YouTube metadata
Analyzes YouTube URLs
Handles blocked-video redirects


popup.html
    ↓
Extension user interface


popup.js
    ↓
Handles setup
Handles blocking rules
Handles YouTube URL analysis
Handles API settings
Handles admin panel


icons/
    ↓
Extension icons
```

---

# Current Limitations

This project is still under development.

Current limitations include:

* YouTube's interface can change and may require updates to metadata detection.
* Gemini API availability and usage limits can affect AI-based checks.
* Automatic checking relies on YouTube metadata rather than analyzing the actual video.
* AI-based decisions depend on the information available in the video title and channel metadata.
* The extension currently redirects blocked videos back to YouTube rather than displaying a dedicated block page.
* The project does not currently include a large automated test suite.

---

# Future Improvements

Possible future improvements include:

* Cache previously checked videos.
* Reduce unnecessary Gemini API requests.
* Improve YouTube navigation detection.
* Improve local keyword matching.
* Improve rule management.
* Add a dedicated block page.
* Add more control over rule types.
* Improve API-key security for wider distribution.
* Add automated tests.
* Improve the user interface.
* Add more advanced content classification options.

---

# Technologies

YouTube Content Guard is built with:

* JavaScript
* Chrome Extension Manifest V3
* Google Gemini API
* YouTube metadata
* Chrome Extension APIs

---

# About

YouTube Content Guard is a personal Chrome extension project focused on AI-assisted YouTube content filtering and browser extension development.

The project combines local rule matching with optional Gemini-based content understanding to give users more control over the content they encounter on YouTube.
