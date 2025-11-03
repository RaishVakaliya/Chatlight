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

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

NODE_ENV=development

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

EMAIL_USER=...
EMAIL_PASSWORD=...
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