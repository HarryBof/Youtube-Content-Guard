# YouTube Content Guard

A Chrome extension that helps block unwanted YouTube content using custom blocking rules and optional Google Gemini AI analysis.

YouTube Content Guard can detect the current YouTube video, compare it against your blocking rules, and automatically redirect blocked videos back to YouTube.

## Features

* Automatically checks YouTube videos while browsing.
* Custom user-defined blocking rules.
* Local rule matching before using AI.
* Optional Google Gemini AI semantic checking.
* Uses video title and channel information for content identification.
* YouTube URL analysis for creating useful blocking rules.
* Local keyword extraction without AI.
* Optional Gemini keyword enhancement.
* Redirects blocked videos back to `https://www.youtube.com/`.
* Password-protected admin panel.
* Add and delete individual blocking rules.
* Delete all blocking rules.
* Change the Gemini API key from the admin panel.
* Chrome Manifest V3.

---

# How It Works

The extension uses two levels of content checking.

```text
YouTube video
      ↓
Detect video ID
      ↓
Get title + channel
      ↓
Check local blocking rules
      ↓
Local match?
   ↙       ↘
 YES        NO
 ↓           ↓
BLOCK      Gemini enabled?
              ↓
           Gemini check
              ↓
         block = true/false
```

If a video is blocked, the extension redirects the current tab to:

```text
https://www.youtube.com/
```

This prevents the user from continuing to the blocked video while keeping the browser tab open.

---

# Blocking Rules

Blocking rules are user-defined phrases or topics.

For example:

```text
Minecraft
Fortnite
One Piece
AI generated stories
specific creator name
```

Rules are checked against the video metadata.

## Local Matching

Local matching is performed before Gemini is called.

The extension normalizes text by:

* Converting text to lowercase.
* Removing accents.
* Normalizing punctuation and whitespace.

For a rule to match a title, the **entire normalized title must equal the normalized rule**.

For example:

```text
Rule:
Minecraft

Title:
Minecraft
```

Result:

```text
MATCH
```

But:

```text
Rule:
Minecraft

Title:
I Played Minecraft For 100 Hours
```

Result:

```text
NO MATCH
```

A partial word or phrase inside a longer title does not trigger the local title match.

This prevents ordinary words from accidentally blocking videos simply because they appear somewhere inside a title.

---

# Channel Matching

Channel names are also checked separately.

For example:

```text
Rule:
ExampleChannel

Channel:
ExampleChannel
```

Result:

```text
MATCH
```

Channel matching is useful when you want to block content from a specific creator.

---

# YouTube URL Analysis

The extension can also accept a YouTube URL through the popup.

Example:

```text
https://www.youtube.com/watch?v=XXXXXXXXXXX
```

or:

```text
https://youtu.be/XXXXXXXXXXX
```

The extension extracts the video ID and retrieves lightweight YouTube metadata.

```text
YouTube URL
     ↓
Video ID
     ↓
YouTube metadata
     ↓
Title + Channel
     ↓
Keyword extraction
```

The extension does **not** download or analyze the entire video.

---

# Local Keyword Extraction

When analyzing a YouTube URL, the extension first extracts keywords locally.

This does not require Gemini.

The current system focuses on:

```text
Video title
Channel name
```

The title itself is not simply split into random words.

The purpose of the extraction system is to identify useful entities that could become blocking rules, while avoiding generic words.

For example, generic terms such as:

```text
video
game
gaming
gameplay
review
reaction
strategy
tournament
match
guide
tutorial
analysis
news
challenge
```

are not treated as useful identifying keywords.

---

# Gemini Keyword Enhancement

If Gemini is enabled and an API key is configured, the extension can send the title and channel information to Gemini.

Gemini is asked to identify a small number of additional, highly specific entities.

For example, useful results may include:

```text
Magnus Carlsen
Hikaru Nakamura
Elden Ring
Malenia
One Piece
```

Generic categories such as:

```text
gaming
action
strategy
entertainment
```

are intentionally discouraged.

Gemini is also instructed not to invent information when the metadata does not provide enough evidence.

If Gemini is unavailable, local processing can still continue.

---

# Automatic Video Checking

When opening or navigating to a YouTube video, the extension detects the current video ID and collects its metadata.

The checking process is:

```text
YouTube video
      ↓
Video ID
      ↓
Title + Channel
      ↓
Local rule matching
      ↓
No local match
      ↓
Gemini semantic check
      ↓
block = true / false
```

If Gemini is disabled, the extension stops after the local check.

If Gemini is enabled, Gemini receives the relevant metadata and blocking rules and determines whether the video is clearly related to one of the configured rules.

The AI check is designed to be conservative rather than blocking a video simply because it contains an unrelated common word.

---

# AI Usage

Google Gemini is used for two main tasks.

## 1. Automatic Video Checking

```text
Video title
      +
Channel
      +
Blocking rules
      ↓
Gemini
      ↓
block = true / false
```

The purpose is to identify semantic relationships that cannot be reliably detected using exact local matching alone.

## 2. YouTube URL Keyword Enhancement

```text
YouTube URL
     ↓
Title + Channel
     ↓
Local keyword extraction
     ↓
Gemini
     ↓
Additional specific keywords
```

Gemini is only given the metadata required for these tasks.

The extension does not send the entire YouTube video to Gemini.

---

# Blocked Video Behavior

When a video is determined to be blocked, the extension redirects the current browser tab to:

```text
https://www.youtube.com/
```

The tab is **not closed**.

This allows the browser session to remain open while preventing continued access to the blocked video.

---

# Installation

You can use a release package or load the extension manually.

## 1. Download the Project

Download or clone this repository.

The extension folder should contain:

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

Open:

```text
chrome://extensions
```

## 3. Enable Developer Mode

Enable:

```text
Developer mode
```

Usually this option is located in the top-right corner.

## 4. Load the Extension

Click:

```text
Load unpacked
```

Select the folder containing:

```text
manifest.json
```

Do not select an individual file.

After loading, the extension should appear in Chrome.

---

# First-Time Setup

Click the YouTube Content Guard extension icon.

The initial setup requires:

```text
Gemini API Key
Password
```

## Gemini API Key

Enter your Google Gemini API key.

The extension stores the key using Chrome's local extension storage.

Gemini is optional for local rule matching, but required for AI-based semantic checking and Gemini keyword enhancement.

## Password

Create a password for the admin panel.

The password is used to access administrative functions such as:

* Viewing rules.
* Deleting rules.
* Deleting all rules.
* Changing the Gemini API key.

---

# Adding Blocking Rules

The main interface provides an input field and an add button.

```text
[ Input text or link... ] [+]
```

## Add a Rule Manually

Enter a rule such as:

```text
Minecraft
```

Then press `+`.

The rule will be added to the blocking list.

## Add a YouTube URL

Paste a YouTube URL into the same input field.

For example:

```text
https://youtu.be/XXXXXXXXXXX
```

The extension will analyze the video's title and channel and generate identifying keywords.

These keywords can then be used as blocking rules.

---

# Admin Panel

Enter the password created during setup to open the admin panel.

The admin panel allows you to:

* View blocking rules.
* Delete individual rules.
* Delete all rules.
* Change the Gemini API key.

Exit the extension or leave the admin interface to hide the panel.

---

# Privacy & API Key

The Gemini API key is stored using Chrome's local extension storage.

The extension communicates with Google's Gemini API only when an AI-powered operation is required.

The extension does not send the entire YouTube video to Gemini.

Only metadata and information required for the requested operation are used.

**Do not publish your personal Gemini API key in this repository or hard-code it into the source code.**

---

# Project Structure

```text
manifest.json
    ↓
Chrome extension configuration


content.js
    ↓
Runs on YouTube pages
Detects the current video
Collects video metadata
Sends checking requests to the service worker


service-worker.js
    ↓
Handles Gemini API requests
Performs local rule matching
Performs AI video checks
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
Handles admin panel


icons/
    ↓
Extension icons
```

---

# Current Limitations

This project is still under development.

Current limitations include:

* YouTube's interface can change, which may require updates to video detection.
* Gemini API availability and usage limits can affect AI checks.
* Automatic checking relies primarily on YouTube metadata.
* Local title matching requires the normalized title to match the rule exactly.
* Gemini semantic checking is optional and depends on a valid API key.
* The project does not currently include a large automated test suite.

---

# Future Improvements

Possible future improvements include:

* Cache previously analyzed YouTube videos.
* Reduce unnecessary Gemini API requests.
* Improve YouTube navigation detection.
* Improve metadata collection.
* Add automated tests.
* Improve rule management.
* Add more control over local matching behavior.
* Improve the blocking interface.
* Add a dedicated blocked-video page.
* Improve privacy and API-key handling for wider distribution.

---

# About

YouTube Content Guard is a personal Chrome extension project exploring AI-powered content filtering and browser extension development.

Built with:

* JavaScript
* Chrome Extension Manifest V3
* Google Gemini API
* YouTube metadata

The project is intended for experimentation and personal use.
