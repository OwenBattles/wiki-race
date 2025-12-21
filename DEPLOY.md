# Deploying Wiki Race to Render

This guide explains how to deploy your Wiki Race application to Render with automatic deployments from GitHub.

## Overview

Your app has two parts:
- **Backend**: Node.js server with Express and Socket.IO (in `/server`)
- **Frontend**: React app with Vite (in `/client`)

Render will deploy these as **two separate services** that communicate with each other.

## Prerequisites

1. Push your code to a GitHub repository
2. Have a Render account (free tier works fine)

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Push render.yaml to your repo** (already created)

2. **In Render Dashboard**:
   - Go to Dashboard → New → Blueprint
   - Connect your GitHub repository
   - Select the repository
   - Render will automatically detect `render.yaml` and create both services

### Option 2: Manual Setup

#### Backend Service

1. **Create New Web Service**:
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository

2. **Configure Backend**:
   - **Name**: `wiki-race-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free

3. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = Leave blank (Render auto-assigns)
   - `CLIENT_URL` = You'll set this after creating the frontend service (e.g., `https://wiki-race-frontend.onrender.com`)

#### Frontend Service

1. **Create New Web Service**:
   - Go to Render Dashboard → New → Web Service
   - Connect the same GitHub repository

2. **Configure Frontend**:
   - **Name**: `wiki-race-frontend`
   - **Root Directory**: `client`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview -- --port $PORT --host`
   - **Plan**: Free

3. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `VITE_API_URL` = Your backend URL (e.g., `https://wiki-race-backend.onrender.com`)

4. **After Backend is Deployed**:
   - Update backend's `CLIENT_URL` to your frontend URL
   - Update frontend's `VITE_API_URL` to your backend URL

## Automatic Deployments

✅ **Yes, Render automatically deploys on push to main branch!**

- Go to your service settings
- Under "Auto-Deploy", ensure "Yes" is selected
- Every push to your main/master branch triggers a new deployment
- You can also manually deploy from other branches

## Socket.IO & Real-time Features

✅ **Lobbies and real-time features will work!**

Render supports WebSockets and Socket.IO. The configuration is already set up in your code:

- Backend uses `process.env.CLIENT_URL` for CORS
- Frontend uses `process.env.VITE_API_URL` for API calls
- Socket.IO client connects automatically in production

### Important Notes:

1. **Free Tier Limitations**:
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds (cold start)
   - Upgrade to paid plan ($7/month) for always-on services

2. **CORS Configuration**:
   - Backend accepts requests from your frontend URL
   - Make sure `CLIENT_URL` matches your frontend service URL exactly

3. **Socket.IO on Render**:
   - Works perfectly with default configuration
   - No additional setup needed
   - Connections persist across service restarts

## Troubleshooting

### Services Can't Connect

- Check that `CLIENT_URL` in backend matches frontend URL exactly (including `https://`)
- Check that `VITE_API_URL` in frontend matches backend URL exactly
- Ensure both services are deployed and running

### Socket.IO Connection Issues

- Verify CORS origin in backend includes your frontend URL
- Check browser console for connection errors
- Ensure backend service is running (not spun down)

### Build Failures

- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility (Render uses Node 18+ by default)

## Environment Variables Summary

**Backend (`server/`)**:
- `PORT` - Auto-set by Render
- `NODE_ENV` - `production`
- `CLIENT_URL` - Your frontend service URL

**Frontend (`client/`)**:
- `NODE_ENV` - `production`
- `VITE_API_URL` - Your backend service URL

## Testing Locally with Production Config

To test with production-like setup locally:

1. Create `.env` file in `server/`:
   ```
   CLIENT_URL=http://localhost:5173
   PORT=3000
   ```

2. Create `.env` file in `client/`:
   ```
   VITE_API_URL=http://localhost:3000
   ```

3. Start both services

## URLs After Deployment

After deployment, you'll get URLs like:
- Backend: `https://wiki-race-backend.onrender.com`
- Frontend: `https://wiki-race-frontend.onrender.com`

Users will access the **frontend URL** to play the game!

