# 🌿 Zenova — Productivity & Focus Tracker

Zenova is a web-based productivity and focus management application that combines a Pomodoro timer, task management, focus analytics, and focus music in one interface.

## ✨ Features

- ⏱️ Pomodoro focus timer with focus, short-break, and long-break modes
- ✅ Task management with priorities and completion tracking
- 💾 LocalStorage persistence for tasks and productivity statistics
- 📊 Weekly focus and productivity analytics
- 🔥 Daily streak tracking and focus score
- 🎵 Focus music player
- 📱 Responsive glassmorphism-style interface
- ⚛️ React + Vite frontend while preserving the original Zenova UI and functionality

## 🛠️ Tech Stack

- React
- Vite
- JavaScript (ES6+)
- HTML5
- CSS3
- Browser LocalStorage API
- Chart.js

## 🚀 Run Locally

```bash
git clone <your-repository-url>
cd Zenova
npm install
npm run dev
```

Open the local URL shown by Vite.

For a production build:

```bash
npm run build
```

## 📁 Structure

```text
Zenova/
├── public/
│   └── assets/music/
├── src/
│   ├── legacyBody.html
│   ├── main.jsx
│   ├── runtime.js
│   └── style.css
├── index.html
├── package.json
└── README.md
```

## 🏗️ Architecture

The React entry point mounts the Zenova application with Vite. The existing UI and behavior are preserved through a React integration layer, while the application logic continues to use the existing browser APIs and storage model.

```text
React + Vite
    ↓
Zenova UI
    ↓
Application Logic
    ├── Pomodoro Timer
    ├── Tasks
    ├── Analytics
    ├── Music
    └── LocalStorage
```

## 💾 Data Persistence

Zenova uses browser LocalStorage for tasks, focus statistics, session logs, streaks, and all-time productivity data. No backend database is required.

## 🔮 Future Improvements

- Break the current UI into smaller reusable React components
- Replace remaining DOM-driven logic with React state and hooks
- Add authentication and cloud synchronization
- Add richer productivity reports
- Integrate a production music service

## 👨‍💻 Author

**Harshit Raj**

Computer Science Engineering Student
