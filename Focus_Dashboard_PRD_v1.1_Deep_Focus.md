# Focus Dashboard PRD (Version 1.1)

## Product Vision

Focus Dashboard is a Chrome Extension that replaces the default New Tab page with a beautiful, distraction-free productivity workspace.

The core experience revolves around a **Deep Focus Session**, where one click starts your Pomodoro timer, enables Focus Mode, and optionally plays calming ambient sounds.

---

# Phase 1 — Dashboard

## Features

- Replace Chrome New Tab
- Full-screen wallpaper
- Upload custom wallpaper
- Greeting by name
- Live clock
- Current date
- Daily focus
- Interactive Pomodoro tomato
- Task list
- Scratch Pad
- Settings

---

# Phase 2 — Daily Focus

Ask every morning:

> What is your main focus today?

Rules:

- One focus per day
- Editable
- Visible all day
- Automatically resets each new calendar day

---

# Phase 3 — Tasks

Users can:

- Add
- Complete
- Delete

Completed tasks move to the bottom and persist locally.

---

# Phase 4 — Scratch Pad

A lightweight note area for temporary thoughts.

Requirements:

- Plain text
- Auto-save
- Local storage
- No formatting

---

# Phase 5 — Focus Mode

Block distracting websites.

Default block list:

- youtube.com
- instagram.com
- linkedin.com
- reddit.com
- facebook.com
- x.com

Blocked pages display:

- Today's focus
- Remaining Pomodoro time
- Return button
- Disable Focus Mode button

---

# Phase 6 — Deep Focus Session

One-click workflow.

When started:

- Start Pomodoro
- Enable Focus Mode
- Start optional ambient music
- Begin session statistics

---

# Phase 7 — Interactive Pomodoro

## Tomato Timer

A tomato-shaped timer beside the clock.

Features:

- Rotates like a physical kitchen timer
- Remaining time displayed
- Pause
- Resume
- Skip break
- End session

Defaults:

- Focus: 25 min
- Short Break: 5 min
- Long Break: 15 min

Runs in the background using timestamps and chrome.storage.local.

---

# Phase 8 — Ambient Music

Optional deep-focus sounds.

Built-in:

- Rain
- Forest
- Brown Noise
- White Noise
- Ocean
- Café
- Fireplace
- Piano
- Lo-fi

Controls:

- Play/Pause
- Volume
- Auto-play during Deep Focus Session
- Silent mode

Future:

- Custom MP3 uploads
- Spotify shortcut
- YouTube Music shortcut

---

# Phase 9 — Notifications

Gentle completion experience.

Focus complete:

- Fade music
- Soft chime
- Tomato animation
- Browser notification

Break complete:

- Gentle reminder
- Resume prompt

---

# Phase 10 — Statistics

Daily:

- Focus time
- Completed Pomodoros
- Blocked distractions

Weekly:

- Focus hours
- Pomodoros
- Blocked attempts

Lifetime totals retained.

---

# Phase 11 — Settings

Configure:

- Name
- Wallpaper
- Block list
- Pomodoro durations
- Music
- Notification sounds
- Auto-start music
- Auto-enable Focus Mode

---

# Local Storage

Store:

- User name
- Wallpaper
- Daily focus
- Tasks
- Scratch Pad
- Pomodoro state
- Deep Focus state
- Music settings
- Statistics
- Block list

---

# Tech Stack

- Manifest V3
- HTML/CSS
- JavaScript or TypeScript
- Background Service Worker
- chrome.storage.local
- Declarative Net Request API

---

# Future Ideas

- AI planner
- Calendar integration
- Habit tracker
- Focus streaks
- Weather
- Weekly review
- Cross-device sync
- Productivity analytics

---

# Acceptance Criteria

- Dashboard replaces Chrome New Tab.
- Greeting, clock and wallpaper load correctly.
- Daily focus resets each day.
- Tasks and Scratch Pad persist.
- Interactive tomato Pomodoro works.
- Deep Focus Session launches Pomodoro, Focus Mode and optional music.
- Focus Mode blocks configured websites.
- Ambient sounds work offline.
- Settings customise the experience.
- Extension remains fast and works offline.
