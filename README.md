# YouTube Content Guard

A Chrome Extension that uses Google Gemini to automatically detect and block unwanted YouTube videos based on custom user-defined rules.

The extension combines **local metadata matching** with **AI-powered checking** to help filter YouTube content without requiring Gemini for every operation.

## Features

* Automatically checks YouTube videos.
* Checks YouTube video metadata such as:

  * Video title
  * Channel name
* Uses Google Gemini to determine whether content is related to a blocked topic when metadata matching is not sufficient.
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

The first time you open it, the extension asks for:

```text
Gemini API Key
Password
```

## Gemini API Key

Enter your Google Gemini API key.

The extension stores the key using Chrome's local extension storage.

The API key is currently required for AI-powered checking and YouTube URL classification.

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

Rules can describe either a specific keyword or a broader topic.

For example:

```text
Chess
Anime
Cryptocurrency
AI generated stories
Minecraft
```

## 2. Add a YouTube video as a rule

Paste a YouTube URL into the input box.

For example:

```text
https://www.youtube.com/watch?v=XXXXXXXXXXX
```

Then press `+`.

The extension retrieves lightweight metadata from YouTube.

Currently, the metadata used by the classification system includes:

```text
Title
Channel name
```

The metadata is then sent to Gemini for classification.

Gemini can return information such as:

```text
Category: Anime
Title: One Piece
Genres: Action, Adventure, Fantasy
```

The result is converted into a short blocking rule:

```text
Anime / One Piece / Action, Adventure, Fantasy
```

### Important

The URL classification feature does **not** send the entire YouTube video to Gemini.

Instead:

```text
YouTube URL
      ↓
YouTube oEmbed metadata
      ↓
Title + Channel
      ↓
Gemini
      ↓
Category + Main Title + Genres
```

This keeps the classification request lightweight.

The goal is to identify **what the content is**, rather than generate a summary of what happens in the specific video.

## 3. Open the Admin Panel

Enter the password you created during setup and press `+`.

The admin panel will appear.

From there you can:

* View all blocking rules
* Delete individual rules
* Delete all rules
* Change the Gemini API key

# How Video Blocking Works

When you open a YouTube video, the extension detects the current video and retrieves its title.

The current automatic checking flow is:

```text
YouTube video
      ↓
Get video title
      ↓
Get blocking rules
      ↓
Send title + rules to Gemini
      ↓
Gemini checks whether the title
matches a blocked topic
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

Gemini is instructed to consider:

* Direct references
* Indirect references
* Wordplay
* Jokes
* Clickbait
* Different ways of referring to the same topic

This allows rules to describe broader topics rather than requiring an exact keyword match.

For example, a rule such as:

```text
Chess
```

can be evaluated by Gemini based on the meaning of the video title rather than simply searching for the exact word `Chess`.

# AI Usage

YouTube Content Guard currently uses Google Gemini for two main tasks.

## Automatic video checking

When watching YouTube:

```text
Video title + blocking rules
          ↓
        Gemini
          ↓
    block = true/false
```

The current automatic checker sends the **video title and blocking rules** to Gemini.

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

The classification system does not send the full YouTube video to Gemini.

# Metadata

YouTube Content Guard currently uses lightweight YouTube metadata rather than attempting to extract every possible piece of information from a video.

For example, a video may provide metadata similar to:

```text
Title:
Rubik's Cube Solved In 16.56 Seconds

Channel:
Example Channel
```

Not every piece of YouTube metadata is consistently available through lightweight endpoints.

For this reason, the extension currently focuses on metadata that is reliably useful for filtering and classification, particularly:

```text
Title
Channel name
```

The title is generally the most important piece of information because it describes the specific video, while the channel name can provide useful context about the source.

# Privacy & API Key

The Gemini API key is stored using Chrome's local extension storage.

The extension communicates with Google's Gemini API when an AI classification or video-checking request is required.

The extension does not upload the entire YouTube video for automatic title checking.

Do not publish your personal Gemini API key in the repository or hard-code it into the source code.

## Important

Using a personal Gemini API key means that requests made by the extension are subject to Google's Gemini API availability, quotas, rate limits, and applicable policies.

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
* Automatic blocking currently uses the video title as the primary content input.
* Lightweight YouTube metadata does not provide every possible piece of video information.
* Channel information is currently used by the URL classification system.
* Closing the current tab is currently used as the blocking action.
* The project does not currently include a large automated test suite.
* Gemini is currently required for AI-powered checking and URL classification.

# Future Improvements

Possible future improvements include:

* Add a local metadata-first blocking system.
* Compare blocking rules against the video title and channel name before using Gemini.
* Only send the title, channel name, and description to Gemini when local matching does not produce a result.
* Add an option to enable or disable Gemini usage.
* Allow the extension to continue using local filtering when Gemini is unavailable or out of quota.
* Cache previously checked videos.
* Reduce unnecessary Gemini API requests.
* Add more robust YouTube navigation detection.
* Add automated tests.
* Improve the blocking interface.
* Add a dedicated block page instead of immediately closing the tab.
* Improve rule management.
* Add more classification options.
* Improve privacy and API-key handling for wider distribution.

# Development

The project is currently being developed as a Chrome Manifest V3 extension.

To test changes during development:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Reload** on the extension after modifying the source files.
4. Open a YouTube video and check the extension/service-worker console for logs.

# About

YouTube Content Guard is a personal Chrome extension project exploring AI-powered content filtering, YouTube metadata processing, and browser extension development.

Built with:

* JavaScript
* Chrome Extension Manifest V3
* Google Gemini API
* YouTube metadata
* Chrome Storage API
