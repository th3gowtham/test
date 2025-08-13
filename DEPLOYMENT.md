# Deployment Guide for The Honey Bee

This guide explains how to deploy The Honey Bee application to Netlify (frontend) and Render (backend).

## Environment Variables Setup

### Local Development

For local development, the application uses the following environment variables:

#### Frontend (.env)
```
VITE_API_URL='http://localhost:5000'
VITE_CLIENT_URL='http://localhost:5173'
```

#### Backend (.env)
```
PORT=5000
CLIENT_URL=http://localhost:5173
```

## Deploying to Production

### Frontend Deployment (Netlify)

1. Push your code to GitHub
2. Sign up for Netlify and connect your GitHub repository
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Set environment variables in Netlify:
   - Go to Site settings > Build & deploy > Environment
   - Add the following variables:
     - `VITE_API_URL`: Your Render backend URL (e.g., https://your-app.onrender.com)
     - `VITE_CLIENT_URL`: Your Netlify URL (e.g., https://your-app.netlify.app)

**Note**: The `netlify.toml` file already includes these variables, but you should update them with your actual URLs.

### Backend Deployment (Render)

1. Sign up for Render and create a new Web Service
2. Connect your GitHub repository
3. Configure the build settings:
   - Build command: `npm install`
   - Start command: `node server.js`
4. Set environment variables in Render:
   - Go to Environment
   - Add all variables from `.env.render.sample`
   - Make sure to update `CLIENT_URL` with your Netlify URL

## Verifying Deployment

1. After deployment, visit your Netlify URL
2. Test the authentication and payment features
3. Check the browser console for any errors related to API connections

## Troubleshooting

### CORS Issues
- Ensure `CLIENT_URL` in your backend environment variables exactly matches your Netlify URL
- Check for any protocol mismatches (http vs https)

### API Connection Issues
- Verify that `VITE_API_URL` in your frontend environment points to the correct Render URL
- Ensure your Render service is running

### Authentication Problems
- Check that cookies are being properly set and sent with requests
- Ensure your Firebase configuration is correct in both environments