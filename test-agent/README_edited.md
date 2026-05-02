# Zangoh AI Agent Supervisor Workstation (Edited)

This repository contains the updated Supervisor Workstation with newly implemented features including:
- **Response Templates Management System**: Create, view, and manage quick-reply templates with categories and sharing options.
- **Template Usage & Variable Injection**: Intercept specific variables like `{{name}}` in templates and prompt the user before sending.
- **SSE (Server-Sent Events) for Dashboard Metrics**: Real-time metrics streaming decoupled to prevent whole-page re-renders.
- **Mobile Responsive Dashboard**: Grid-based responsive interface optimized for smaller displays.
- **Voice Input via Web Speech API**: Added a native web speech-to-text API allowing the supervisor to intervene hands-free.

## Getting Started

To run the application:

### Backend
```bash
cd backend-starter
npm install
npm install mongodb-memory-server # required to run in-memory db locally
npm start
```

### Frontend
```bash
cd frontend-starter
npm install
npm start
```

### Testing
```bash
cd testing
npm install
node test-runner.js
```
