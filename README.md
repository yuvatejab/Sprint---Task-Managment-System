# S.P.R.I.N.T Task Management System

S.P.R.I.N.T is a modern, full-stack, enterprise-grade task orchestration platform. Engineered with a secure Express.js backend and a React/TypeScript frontend, it provides fluid Kanban/List task tracking, complete asset attachments, deep transactional change ledgers, and an administrative control panel for credential and privilege management.

---

## 🏗️ System Architecture

The application implements a decoupled, full-stack architecture running over HTTPS, utilizing secure JSON Web Tokens (JWT) for stateless server authentication and real-time database synchronization with Firebase Firestore.

```
       ┌────────────────────────────────────────────────────────┐
       │                 Frontend Client                        │
       │  React 19 (Vite) + Tailwind CSS + Lucide Icons + Motion │
       └─────────────────────────┬──────────────────────────────┘
                                 │
                   HTTPS Request │ (JWT Bearer Token)
                                 ▼
       ┌────────────────────────────────────────────────────────┐
       │                Secure Express Server                   │
       │      Endpoints: /api/auth, /api/tasks, /api/admin      │
       └─────────────────────────┬──────────────────────────────┘
                                 │
                 Firestore Reads │ Writes (Admin Ledger / Keys)
                                 ▼
       ┌────────────────────────────────────────────────────────┐
       │               Firebase Firestore DB                    │
       │     Collections: [users], [tasks], [system_logs]       │
       └────────────────────────────────────────────────────────┘
```

---

## 📦 File Structure

```
S.P.R.I.N.T/
├── server.ts                    # Full-Stack Express Engine (Auth, Tasks, Admin APIs)
├── package.json                 # Core scripts and environment dependencies
├── firestore.rules              # Database state access rules
├── src/
│   ├── main.tsx                 # Client entry bootstrap
│   ├── index.css                # Tailwind configuration, font imports & themes
│   ├── App.tsx                  # Controller routing state & layout manager
│   ├── types.ts                 # Shared system level interfaces
│   ├── db.ts                    # Backend Database configuration & initialization
│   └── components/
│       ├── AdminManager.tsx     # Crew Management, Account provisioning, audit tracer
│       ├── TaskModal.tsx        # Detail pane, status updates & vertical audit timeline
│       ├── TaskBoard.tsx        # Visual Kanban Drag & Drop stage
│       ├── TaskList.tsx         # Analytical grid lists view
│       ├── StatsGrid.tsx        # Real-time counter metrics dashboard
│       ├── AuthCard.tsx         # Cryptographed JWT gateway (Sign In/Register)
│       └── ThemeToggle.tsx      # Contrast presentation controller
```

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, Tailwind CSS, Motion, Lucide Icons, Recharts, D3
* **Backend:** Node.js, Express, JSON Web Tokens (JWT), Bcrypt (Blowfish-hashing)
* **Storage:** Firebase Firestore (NoSQL, encrypted indexing)
* **Bundler:** Vite, Esbuild (Optimized compilation targets)

---

## 🔥 Key Core Features

### 1. Unified Workspace Canvas
* **Kanban Board:** Smooth interactive workflow tracking across status lanes: *To Do*, *In Progress*, *Under Review*, and *Completed*.
* **List Grid:** High-density analysis view supporting dynamic text searches, priority filtering (Low, Medium, High), and category segmentation.
* **Intelligent Metrics:** Performance tracking through real-time state calculation, deadline indicators, and pending alert badges.

### 2. Micro Change Ledger
* Each task contains a granular chronological history of physical adjustments (Creation, Title edits, Priority shifts, Due date scheduling, Status transitions, and Attachments).
* Beautiful color-coded vertical timelines featuring intuitive state-specific iconography.

### 3. Dedicated Admin Overseer Deck
* **Access Control Index:** Secure page for administrators to manage contribution crew members.
* **Account Provisioning:** Direct deployment of new profiles with default encrypted passphrases and customized permission roles (`Admin` vs. `User`).
* **Active Status Suspension:** Ability to instantly revoke permissions or delete user nodes to protect organizational boundaries.
* **Universal Audit Ledger:** Stream of chronological system events tracking security logins, account initialization, and task modifications globally.

---

## 🚀 Setting Up the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file at the root:
```env
JWT_SECRET=your_jwt_private_key_string
FIREBASE_PROJECT_ID=your_firestore_project_id
```

### 3. Launch Development Server
```bash
npm run dev
```
*(The dev compiler automatically triggers Vite assets pipelines on http://localhost:3000)*
