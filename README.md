# YouTube Content Guard

A Chrome Extension that uses Google Gemini to automatically detect and block unwanted YouTube videos based on custom user-defined rules.

## Features

* Automatically checks YouTube video titles.
* Uses Google Gemini to decide whether a video matches a blocked topic.
* Automatically pauses and closes blocked YouTube tabs.
* Add custom blocking rules manually.
* Paste a YouTube URL to generate a short content classification.
* URL classification returns:

  * Content category
  * Main content / series / game / movie / song name
  * Up to 5 genres or major topics
* URL classification uses lightweight YouTube metadata instead of sending the entire video to Gemini.
* Password-protected admin panel.
* Delete individual rules.
* Delete all rules at once.
* Change the Gemini API key from the admin panel.
* Uses Chrome Manifest V3.

# Installation

You can check out the release for faster installation, or follow the instructions below.

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

## 3. Enable Developer Mode

Turn on:

**Developer mode**

This option is usually located in the top-right corner of the Extensions page.

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

Do not select an individual file.

After loading successfully, the extension should appear in Chrome.

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

# How to Add Blocking Rules

The main interface contains:

```text
[ Input text or link... ] [+]
```

There are three ways to use it.

## 1. Add a rule manually

Enter something like:

```text
AI generated cultivation stories
```

Then click `+`.

The rule will be saved to the blocking list.

## 2. Add a YouTube video as a rule

Paste a YouTube URL into the input box.

For example:

```text
https://www.youtube.com/watch?v=XXXXXXXXXXX
```

Then press `+`.

The extension first retrieves lightweight metadata from YouTube, such as the video's title and channel name.

That metadata is sent to Gemini for classification.

Gemini returns information such as:

```text
Category: Anime
Title: One Piece
Genres: Action, Adventure, Fantasy
```

The result is then converted into a short blocking rule.

### Important

The URL classification feature does **not** send the entire YouTube video to Gemini.

Instead:

```text
YouTube URL
      ↓
YouTube metadata
      ↓
Title + Channel
      ↓
Gemini
      ↓
Category + Main Title + Genres
```

This reduces unnecessary data processing and avoids asking Gemini to generate a full episode or video summary.

The goal is to identify **what the content is**, rather than describe what happens in the specific video.

## 3. Open the Admin Panel

Enter the password you created during setup and press `+`.

The admin panel will appear.

From there you can:

* View all blocking rules
* Delete individual rules
* Delete all rules
* Change the Gemini API key

Enter the same password again or exit the extension to hide the admin panel.

# How Video Blocking Works

When you open a YouTube video, the extension:

```text
YouTube video
      ↓
Get video title
      ↓
Get blocking rules
      ↓
Send title + rules to Gemini
      ↓
Gemini checks whether the title matches
a blocked topic
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

The automatic blocking system currently evaluates the **YouTube video title** against the user's blocking rules.

Gemini is instructed to consider direct and indirect references, wordplay, jokes, and clickbait when determining whether the title matches a blocked topic.

This allows the extension to go beyond simple keyword matching.

For example, a blocking rule can describe a broader topic rather than requiring the exact word to appear in the title.

# AI Usage

YouTube Content Guard currently uses Google Gemini for two separate tasks.

## Automatic video checking

When watching YouTube:

```text
Video title + blocking rules
          ↓
        Gemini
          ↓
    block = true/false
```

Only the information required for the blocking decision is sent in this request.

## YouTube URL classification

When manually adding a YouTube URL:

```text
YouTube URL
     ↓
YouTube metadata
     ↓
Title + Channel
     ↓
Gemini
     ↓
Category + Title + Genres
```

The classification feature is designed to use significantly less input data than sending the video itself for analysis.

# Privacy & API Key

The Gemini API key is stored using Chrome's local extension storage.

The extension communicates with Google's Gemini API when an AI classification or video-checking request is required.

Do not publish your personal Gemini API key in the repository or hard-code it into the source code.

# Project Structure

```text
manifest.json
    ↓
Chrome extension configuration

content.js
    ↓
Runs on YouTube pages
Detects the current video
Gets the video title
Sends checks to the service worker

service-worker.js
    ↓
Handles Gemini API requests
Checks video titles
Retrieves YouTube metadata
Classifies YouTube URLs
Handles tab closing

popup.html
    ↓
Extension user interface

popup.js
    ↓
Handles setup
Handles blocking rules
Handles YouTube URL input
Handles admin panel

icons/
    ↓
Extension icons
```

# Current Limitations

This project is still under development.

Some current limitations include:

* YouTube's interface can change, which may require updates to title detection.
* Gemini API availability and usage limits can affect AI checks.
* The automatic blocking system currently evaluates video titles rather than analyzing the full video.
* Closing the current tab is currently used as the blocking action.
* The project does not currently include a large automated test suite.

# Future Improvements

Possible future improvements include:

* Cache previously classified YouTube URLs.
* Reduce unnecessary Gemini API requests.
* Add more robust YouTube navigation detection.
* Add automated tests.
* Improve the blocking interface.
* Add a dedicated block page instead of immediately closing the tab.
* Improve rule management.
* Add more classification options.
* Improve privacy and API-key handling for wider distribution.

# About

YouTube Content Guard is a personal Chrome extension project exploring AI-powered content filtering and browser extension development.

Built with:

* JavaScript
* Chrome Extension Manifest V3
* Google Gemini API
* YouTube metadata
* 
