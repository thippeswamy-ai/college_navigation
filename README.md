# Smart College Navigation and Information Management Website

A modern, responsive, voice-guided college campus navigation website with an integrated **Admin Dashboard** and **Firebase Backend**.

Developed with pure web technologies (**HTML5, CSS3, JavaScript ES Modules, Firebase SDK v10, and Web SpeechSynthesis API**).

---

## 🌟 Key Features

### 1. Student & Visitor Campus Navigation Portal
- **Turn-by-Turn Image Navigation:** Displays high-resolution campus path images sequentially from the campus gate to the department entrance.
- **Automatic Voice Guidance:** Spoken voice directions trigger automatically when each image loads using the browser's native `SpeechSynthesis` API.
- **Synchronized Audio Controls:**
  - Prevents overlapping voices when rapidly changing steps.
  - Controls: **Previous**, **Next**, **Play Voice**, **Pause Voice**, **Restart Voice**, and **Mute/Unmute**.
  - Animated soundwave audio indicator to show when voice is actively speaking.
  - Step counter fraction badge (e.g. `1/5`) and clickable step jumping breadcrumbs.
  - Destination celebration screen on the final image with restart and exit options.
- **Interactive Campus Search:** Instant search across departments, classrooms, laboratories, administrative offices, and campus landmarks with dynamic badges. Clicking any result directly opens its voice navigation sequence.
- **College Information Hub:** Multi-tab interface featuring About College, History, Academic Courses, Campus Facilities, and Official Directory.
- **Notice Board:** Live filterable notices, announcements, and upcoming campus events.

### 2. Administrator Portal & Role-Based Access Control (RBAC)
- **Role Hierarchy:**
  1. **Super Admin:** Complete control over all departments, all navigation sequences, all college information posts, and user administration (create, edit, disable, or delete other admins).
  2. **Admin:** Access restricted to assigned departments for uploading images, editing navigation instructions, and publishing college updates.
- **Live Statistics Overview:**
  - Total Academic Departments
  - Total Uploaded Navigation Images
  - Total College Information Posts
  - Total Authorized Administrators
- **Navigation Image Management:**
  - Department selector.
  - Sequence number ordering with **Move Up / Move Down** controls.
  - Navigation instruction editor with **"Test Voice Preview"** button to hear speech synthesis live before publishing.
  - Image file uploader (Firebase Storage / Base64 fallback) with instant preview.
  - Landmark and checkpoint tagging.
  - **"Preview Full Sequence"** button to test the student voice navigation directly inside the admin console.
- **Department Management:** Full CRUD operations (Add, Edit, Delete, icon, building, floor, HOD, and keywords).
- **College Information Management:** Publish announcements, events, and notices with categories, badges, dates, and banner images.
- **Administrator Management (Super Admin only):** Create new administrator credentials, assign department access, set publishing privileges, and toggle active/disabled states.

---

## 🚀 Quick Start (Running Locally)

This project has **zero external dependencies** required to run locally.

### Option A: Using the built-in Node.js server
```bash
# In the project directory, run:
node server.js
```
Open your browser at: **`http://localhost:3000`**

### Option B: Using standard static servers
```bash
# Using npx serve:
npx serve . -p 3000

# Or using Python:
python -m http.server 3000
```

---

## 🔐 Demo Administrator Accounts

You can test the Admin Dashboard immediately using the pre-configured demo profiles:

| Account Type | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `kthippeswamy109@gmail.com` | `123456789` | Full unrestricted access to all departments, navigation sequences, admins, and system settings. |
| **Department Admin** | `cse.admin@college.edu` | `Admin@1234` | Restricted to Computer Science (CSE) and Artificial Intelligence (AI) departments. |
| **Department Admin** | `science.admin@college.edu` | `Admin@1234` | Restricted to Botany and Zoology departments. |

---

## ☁️ Firebase Configuration & Integration Guide

The project is wired for **Firebase Authentication**, **Cloud Firestore**, and **Firebase Storage**.

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it (e.g., `smart-college-navigation`).
3. Under **Project settings** > **General**, scroll to **Your apps**, click the **Web icon (`</>`)**, and register the app.
4. Copy the `firebaseConfig` object provided by Firebase.

### Step 2: Configure Credentials in the Application
Open `js/firebase-config.js` and replace the placeholder keys with your project values:

```javascript
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```
*Alternatively, you can click the **Setup** button next to the Firebase indicator in the Admin Dashboard to paste your Firebase config JSON directly into the UI!*

### Step 3: Enable Firebase Authentication
1. In Firebase Console, go to **Build** > **Authentication**.
2. Click **Get Started** and select **Email/Password**.
3. Enable **Email/Password** and click **Save**.
4. Create the initial Super Admin account under the **Users** tab with email `kthippeswamy109@gmail.com`.

### Step 4: Enable Cloud Firestore
1. In Firebase Console, go to **Build** > **Firestore Database**.
2. Click **Create database** (choose Production mode).
3. Under the **Rules** tab, deploy the rules found in `firestore.rules`.

### Step 5: Enable Firebase Storage
1. In Firebase Console, go to **Build** > **Storage**.
2. Click **Get Started**.
3. Under the **Rules** tab, deploy the rules found in `storage.rules`.

### Step 6: 1-Click Starter Campus Data Seeder
1. Sign in to the Admin Dashboard (`http://localhost:3000/login.html`) as Super Admin.
2. Click the **"Seed Data to Firestore"** button at the top right of the Overview tab.
3. This will populate all 4 database collections (`departments`, `navigationImages`, `collegeInformation`, and `administrators`) with starter campus sequences, images, and voice instructions!

---

## 🗄️ Firestore Database Collections Schema

### 1. `departments`
```typescript
{
  id: string,               // e.g. "cse"
  name: string,             // "Computer Science & Engineering"
  code: string,             // "CSE"
  building: string,         // "Science & Tech Block A"
  floor: string,            // "2nd Floor"
  hod: string,              // "Dr. Eleanor Vance"
  description: string,      // Brief department summary
  thumbnail: string,        // Storage or image URL
  keywords: string[],       // Array of searchable terms
  order: number,            // Sort display order
  status: "published" | "draft"
}
```

### 2. `navigationImages`
```typescript
{
  id: string,               // e.g. "nav-cse-1"
  departmentId: string,     // Reference to department id ("cse")
  departmentName: string,   // Display name
  sequence: number,         // 1, 2, 3, 4, 5...
  title: string,            // "Science Block A Foyer & Staircase"
  instruction: string,      // Spoken voice text guidance
  imageUrl: string,         // High-res checkpoint photo URL
  landmarks: string[],      // Checkpoint markers e.g. ["Security Gate", "ATM"]
  status: "published" | "draft"
}
```

### 3. `collegeInformation`
```typescript
{
  id: string,               // e.g. "info-notice-1"
  category: string,         // "announcements" | "events" | "notices" | "about" | "history" | "courses" | "facilities" | "contact"
  title: string,            // Notice/Post title
  summary: string,          // Short preview
  content: string,          // Full details
  date: string,             // e.g. "Nov 12, 2026"
  badge: string,            // e.g. "Urgent", "New", "Flagship"
  imageUrl: string,         // Optional banner image URL
  pinned: boolean,          // Whether pinned to top
  status: "published" | "draft"
}
```

### 4. `administrators`
```typescript
{
  id: string,               // Firebase Auth UID or username
  email: string,            // "kthippeswamy109@gmail.com"
  displayName: string,      // "Thippeswamy (Super Admin)"
  role: "superadmin" | "admin",
  assignedDepartments: string[], // ["*"] for all, or ["cse", "ai"]
  canPublishInfo: boolean,
  status: "active" | "disabled",
  createdAt: string
}
```

---

## 🛡️ Security Rules

- **Firestore (`firestore.rules`):**
  - Unauthenticated public visitors can only **read** published departments, navigation sequences, and announcements.
  - Only authenticated administrators can write or modify data.
  - Department Admins can only edit navigation steps for their assigned departments.
  - Only the **Super Admin** can create, modify, or delete administrator profiles and departments.
- **Storage (`storage.rules`):**
  - Public read access for navigation images.
  - Upload access restricted to authenticated administrators.
  - Enforces image file types and maximum 15MB file size limit.

---

## 🌐 Deploying to Firebase Hosting

To deploy the website live on Firebase Hosting:

```bash
# 1. Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize & connect to your project
firebase init hosting

# 4. Deploy all assets, Firestore rules, and Storage rules
firebase deploy
```

---

## 📁 Project Structure

```
college-navigation/
├── index.html                 # Main public portal (Navigation viewer, search, departments, notices)
├── login.html                 # Secure administrator login portal
├── admin.html                 # Full Administrator Dashboard
├── server.js                  # Local development zero-dependency HTTP server
├── package.json               # Package metadata and start scripts
├── firebase.json              # Firebase Hosting configuration
├── firestore.rules            # Cloud Firestore security rules
├── storage.rules              # Firebase Storage security rules
├── README.md                  # Comprehensive documentation and setup guide
├── css/
│   ├── main.css               # Design system (Collegiate blue, emerald green, responsive grid)
│   ├── navigation.css         # Step-by-step viewer stage, waveform animation, completion card
│   └── admin.css              # Dashboard layout, metrics cards, tables, forms, modals
└── js/
    ├── firebase-config.js     # Firebase SDK init & unified Firestore/Storage/Demo services
    ├── seed-data.js           # Authentic campus starter dataset (30+ steps, 6 departments, posts)
    ├── auth.js                # Firebase Authentication & Role-Based Access Control
    ├── voice-helper.js        # SpeechSynthesis engine, audio synchronization, voice previewer
    ├── search.js              # Campus search engine across departments, labs, classrooms, facilities
    ├── navigation.js          # Interactive image navigation controller & audio sync logic
    ├── home.js                # Public home page controller & dynamic renderers
    └── admin.js               # Admin dashboard controller (CRUD, voice testing, user admin)
```
