# Full Stack Realtime Chat App

Highlights:

- Tech stack: MERN + Socket.io + TailwindCSS + Daisy UI + Firebase Google OAuth + Cloudinary
- Authentication & Authorization with JWT + Firebase Google OAuth
- Email verification system with 6-digit codes
- Real-time messaging with Socket.io
- Message pinning functionality (like WhatsApp)
- Message replies with context display
- Online user status (real-time)
- Profile management with instant updates
- Global state management with Zustand
- Mobile-responsive design with modern UI
- Custom background themes
- Image sharing with Cloudinary integration
- Professional email templates (verification & welcome)
- Comprehensive error handling
- Account deletion functionality
- And much more!

### Setup .env file

```js
MONGODB_URI=...
PORT=5001
JWT_SECRET=...
NODE_ENV=development

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_DEFAULT_AVATAR=


FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

EMAIL_USER=...
EMAIL_PASSWORD=...

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### Start the app

```shell
cd frontend
npm run dev
```

### Start the server

```shell
cd backend
npm run dev
```

## Deployment Guide

### Backend Deployment (Render)

1. **Create a Render Account** and create a new Web Service
2. **Connect your repository** to Render
3. **Configure the service:**
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free tier is available

4. **Set Environment Variables** in Render Dashboard:
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

5. **Important Notes:**
   - Render provides a URL like `https://your-app.onrender.com`
   - The `FRONTEND_URL` should be your Vercel frontend URL
   - For multiple frontend origins, separate with commas: `https://app1.vercel.app,https://app2.vercel.app`
   - Render free tier spins down after inactivity, which may cause initial connection delays

### Frontend Deployment (Vercel)

1. **Create a Vercel Account** and import your repository
2. **Configure the project:**
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Set Environment Variables** in Vercel Dashboard:
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

4. **Important Notes:**
   - Replace `https://your-backend.onrender.com` with your actual Render backend URL
   - All Vite environment variables must be prefixed with `VITE_`
   - After deployment, update the backend's `FRONTEND_URL` with your Vercel URL

### Post-Deployment Checklist

- [ ] Backend deployed on Render and accessible
- [ ] Frontend deployed on Vercel and accessible
- [ ] Backend `FRONTEND_URL` environment variable set to Vercel URL
- [ ] Frontend `VITE_BACKEND_URL` environment variable set to Render URL
- [ ] Socket.IO connection working (check browser console)
- [ ] API calls working (check network tab)
- [ ] CORS errors resolved
- [ ] Firebase authentication working
- [ ] MongoDB connection established

### Troubleshooting Socket.IO Issues

If Socket.IO is not working after deployment:

1. **Check CORS Configuration:**
   - Ensure `FRONTEND_URL` in backend matches your Vercel URL exactly
   - Include protocol (`https://`) in the URL

2. **Check Backend URL:**
   - Ensure `VITE_BACKEND_URL` in frontend matches your Render URL exactly
   - Include protocol (`https://`) in the URL

3. **Check Browser Console:**
   - Look for connection errors
   - Verify WebSocket connections are not blocked

4. **Render Free Tier Limitations:**
   - Free tier services spin down after 15 minutes of inactivity
   - First request after spin-down may take 30-50 seconds
   - Consider upgrading to paid plan for production use

5. **Network Issues:**
   - Socket.IO will automatically fallback to polling if WebSocket fails
   - Check that both `websocket` and `polling` transports are enabled (already configured)
