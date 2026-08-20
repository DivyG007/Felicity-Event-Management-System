# Felicity Event Management System

## Overview
A centralized event management platform for the Felicity fest, built using the MERN stack.

## Technology Stack
- **MongoDB** — Database (via Mongoose ODM)
- **Express.js** — Backend REST API framework
- **React** (Vite) — Frontend SPA
- **Node.js** — Runtime

## Libraries & Justification
| Library | Purpose |
|---------|---------|
| `bcryptjs` | Secure password hashing (required by spec) |
| `jsonwebtoken` | JWT-based authentication for protected routes |
| `nodemailer` | Sending registration confirmation & ticket emails |
| `qrcode` | Generating QR codes for event tickets |
| `multer` | Handling file uploads (payment proofs, form attachments) |
| `socket.io` | Real-time discussion forum (Tier B) |
| `uuid` | Generating unique ticket IDs |
| `cors` | Cross-origin resource sharing between frontend/backend |
| `axios` | HTTP client for frontend API calls |
| `react-router-dom` | Client-side routing |

## Advanced Features Implemented

1. **Merchandise Payment Approval Workflow** — Payment proof upload, organizer approval/rejection, conditional ticket generation
2. **QR Scanner & Attendance Tracking** — Camera-based QR scanning, duplicate rejection, live attendance dashboard, CSV export
3. **Organizer Password Reset Workflow** — Request/approve/reject flow via Admin dashboard
4. **Real-Time Discussion Forum** — Socket.IO powered event discussion with moderation
5. **Anonymous Feedback System** — Star ratings + text comments for completed events

## Setup & Installation

### Step 1: Verify Prerequisites

Make sure the following are installed on your machine before proceeding:

1. **Node.js v18+** — Check by running:
   ```bash
   node --version
   ```
2. **MongoDB** — Either a local MongoDB instance or a MongoDB Atlas cloud cluster.
   - For local: ensure `mongod` is running (default port 27017).
   - For Atlas: have your connection string ready (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/felicity`).

### Step 2: Set Up the Backend

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install all backend dependencies:
   ```bash
   npm install
   ```

3. Create a file called `.env` inside the `backend/` folder with the following contents:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/felicity
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:5173

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password

   ADMIN_EMAIL=admin@felicity.iiit.ac.in
   ADMIN_PASSWORD=Admin@123
   ```
   > Replace `SMTP_USER` and `SMTP_PASS` with real Gmail credentials if you need email functionality.

5. Seed the admin account into the database:
   ```bash
   node seed/adminSeed.js
   ```
   You should see: `Admin created successfully: admin@felicity.iiit.ac.in`

6. Start the backend server:
   ```bash
   npm run dev
   ```
   You should see:
   ```
   Server running on port 5000
   MongoDB Connected: localhost
   ```
   **Keep this terminal open** — the backend needs to stay running.

### Step 3: Set Up the Frontend

1. Open a **new/second terminal** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install all frontend dependencies:
   ```bash
   npm install
   ```

3. Verify the `frontend/.env` file exists and contains:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
   This tells the frontend where the backend API is running.

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   You should see:
   ```
   VITE ready in XXX ms
   ➜  Local: http://localhost:5173/
   ```

5. Open **http://localhost:5173/** in your browser. You should see the Felicity login page.

### Step 4: Log In

- **Admin**: Use the credentials from your `.env` file (default: `admin@felicity.iiit.ac.in` / `Admin@123`).
- **Participant**: Click "Sign Up" to create a new account.
- **Organizer**: Organizer accounts are created by the Admin from the Admin Dashboard.

## Deployment

### Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a new **Shared Cluster** (free tier is fine).
3. Under **Database Access**, create a database user with a username and password.
4. Under **Network Access**, click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Go to your cluster → **Connect** → **Connect your application** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/felicity?retryWrites=true&w=majority
   ```
   Replace `<username>` and `<password>` with your database user credentials.

### Step 2: Deploy Backend to Render

1. Push your project to a **GitHub repository**.
2. Go to [Render](https://render.com) and sign in with GitHub.
3. Click **New** → **Web Service** → connect your GitHub repo.
4. Configure the service:
   - **Name**: `felicity-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `MONGO_URI` | Your MongoDB Atlas connection string from Step 1 |
   | `JWT_SECRET` | Any random secret string |
   | `JWT_EXPIRE` | `7d` |
   | `CLIENT_URL` | (leave blank for now, fill after Step 3) |
   | `ADMIN_EMAIL` | `admin@felicity.iiit.ac.in` |
   | `ADMIN_PASSWORD` | `Admin@123` |
6. Click **Create Web Service**. Wait for the deploy to finish.
7. Copy the deployed URL (e.g. `https://felicity-backend.onrender.com`).
8. After deploying, open a terminal and seed the admin:
   ```bash
   # Or use Render's shell feature to run:
   node seed/adminSeed.js
   ```

### Step 3: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project** → import your GitHub repo.
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
4. Under **Environment Variables**, add:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | Your Render backend URL + `/api` (e.g. `https://felicity-backend.onrender.com/api`) |
5. Click **Deploy**. Wait for the build to finish.
6. Copy the deployed URL (e.g. `https://felicity-events.vercel.app`).

### Step 4: Connect Frontend ↔ Backend

1. Go back to your **Render** dashboard → your backend service → **Environment**.
2. Set `CLIENT_URL` to your Vercel frontend URL (e.g. `https://felicity-events.vercel.app`).
3. Render will auto-redeploy with the new CORS origin.

### Step 5: Update deployment.txt

Update `deployment.txt` in the project root with the actual URLs:
```
Frontend URL: https://felicity-events.vercel.app
Backend API URL: https://felicity-backend.onrender.com
```
