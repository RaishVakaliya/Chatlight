# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables documented
- [ ] Code changes committed and pushed to repository
- [ ] Local testing completed

## Backend Deployment (Render)

### Step 1: Create Render Service
- [ ] Go to [Render Dashboard](https://dashboard.render.com)
- [ ] Click "New +" → "Web Service"
- [ ] Connect your repository
- [ ] Select the repository

### Step 2: Configure Service
- [ ] **Name**: `chatlight-backend` (or your preferred name)
- [ ] **Root Directory**: `backend`
- [ ] **Environment**: `Node`
- [ ] **Build Command**: `npm install`
- [ ] **Start Command**: `npm start`
- [ ] **Plan**: Select Free or Paid

### Step 3: Set Environment Variables
Add these in Render Dashboard → Environment:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_DEFAULT_AVATAR=your_default_avatar_url
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**Important**: 
- Replace `https://your-frontend.vercel.app` with your actual Vercel URL (you'll get this after deploying frontend)
- For `FIREBASE_PRIVATE_KEY`, include the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- You can update `FRONTEND_URL` after frontend deployment

### Step 4: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete
- [ ] Copy the service URL (e.g., `https://your-app.onrender.com`)

## Frontend Deployment (Vercel)

### Step 1: Create Vercel Project
- [ ] Go to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Click "Add New..." → "Project"
- [ ] Import your repository

### Step 2: Configure Project
- [ ] **Root Directory**: `frontend`
- [ ] **Framework Preset**: Vite (should auto-detect)
- [ ] **Build Command**: `npm run build` (should auto-detect)
- [ ] **Output Directory**: `dist` (should auto-detect)
- [ ] **Install Command**: `npm install` (should auto-detect)

### Step 3: Set Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_BACKEND_URL=https://your-backend.onrender.com
```

**Important**: 
- Replace `https://your-backend.onrender.com` with your actual Render backend URL
- All frontend environment variables MUST have the `VITE_` prefix

### Step 4: Deploy
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Copy the deployment URL (e.g., `https://your-app.vercel.app`)

## Post-Deployment

### Update Backend Configuration
- [ ] Go back to Render Dashboard
- [ ] Update `FRONTEND_URL` environment variable with your Vercel URL
- [ ] Restart the Render service (or it will auto-restart)

### Testing Checklist
- [ ] Frontend loads without errors
- [ ] Backend API is accessible
- [ ] Socket.IO connection established (check browser console)
- [ ] User authentication works (signup/login)
- [ ] Google OAuth works
- [ ] Real-time messaging works
- [ ] Online users status updates
- [ ] Image uploads work
- [ ] Email verification works

### Troubleshooting

#### Socket.IO Not Connecting
1. Check browser console for errors
2. Verify `VITE_BACKEND_URL` in Vercel matches Render URL exactly
3. Verify `FRONTEND_URL` in Render matches Vercel URL exactly
4. Check CORS errors in browser network tab
5. Ensure both URLs include `https://` protocol

#### API Calls Failing
1. Check `VITE_BACKEND_URL` is set correctly
2. Verify backend is running (Render dashboard)
3. Check network tab for CORS errors
4. Verify cookies are being sent (`withCredentials: true`)

#### Render Free Tier Issues
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-50 seconds
- Consider upgrading to paid plan for production

## Environment Variables Reference

### Backend (.env or Render)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=...
JWT_SECRET=...
FRONTEND_URL=https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_DEFAULT_AVATAR=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
EMAIL_USER=...
EMAIL_PASSWORD=...
```

### Frontend (Vercel Environment Variables)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_BACKEND_URL=https://your-backend.onrender.com
```

