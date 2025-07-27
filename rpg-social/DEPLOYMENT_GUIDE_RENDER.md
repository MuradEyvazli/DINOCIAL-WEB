# RPG Social - Render Deployment Guide

## Overview
This guide explains how to deploy the RPG Social application on Render. The application consists of a Next.js frontend with a custom Socket.IO server for real-time messaging functionality.

## Prerequisites

### 1. MongoDB Atlas Setup
1. Create a free MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (M0 free tier is sufficient for testing)
3. Create a database user with read/write permissions
4. Get your connection string (it should look like: `mongodb+srv://username:password@cluster.mongodb.net/database-name`)
5. Add `0.0.0.0/0` to IP whitelist for Render access (or use Render's static IPs for better security)

### 2. Cloudinary Setup
1. Create a free Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. From your dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret

### 3. GitHub Repository
1. Push your code to a GitHub repository
2. Make sure the `rpg-social` folder is in the repository

## Deployment Steps

### Step 1: Create Render Account
1. Sign up for a free Render account at [render.com](https://render.com)
2. Connect your GitHub account

### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `rpg-social`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `rpg-social`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Start with free tier, upgrade as needed

### Step 3: Configure Environment Variables
In the Render dashboard, add these environment variables:

#### Required Variables:
```bash
# MongoDB Connection
MONGODB_URI=your_mongodb_atlas_connection_string

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Configuration (Render will auto-generate if using render.yaml)
JWT_SECRET=click_generate_to_create_secure_key
JWT_EXPIRES_IN=7d

# NEXUS Admin Panel (Render will auto-generate if using render.yaml)
NEXUS_MASTER_KEY=click_generate_to_create_secure_key
NEXUS_QUANTUM_SALT=click_generate_to_create_secure_key
NEXUS_BIOMETRIC_SECRET=click_generate_to_create_secure_key

# Node Environment
NODE_ENV=production
```

#### Optional Variables (for email functionality):
```bash
EMAIL_FROM=noreply@yourdomain.com
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email@gmail.com
EMAIL_SERVER_PASSWORD=your_app_password
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Wait for the build to complete (usually 5-10 minutes)
4. Your app will be available at `https://rpg-social.onrender.com`

## Using render.yaml (Recommended)

If you have the `render.yaml` file in your repository:

1. In Render dashboard, click "New +" → "Blueprint"
2. Connect your repository
3. Render will automatically detect the `render.yaml` file
4. Click "Apply" to create the service with all configurations
5. Add the sensitive environment variables manually:
   - `MONGODB_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - Email credentials (if using)

## Post-Deployment Setup

### 1. Create Upload Directories
The application needs these directories for file uploads:
- `/public/uploads/avatars/`
- `/public/uploads/messages/`
- `/public/uploads/stories/`

These are created automatically when users upload files.

### 2. Seed Initial Data (Optional)
1. Access your application
2. Run these endpoints to seed initial data:
   - `/api/seed/users` - Creates test users
   - `/api/quests/seed` - Creates initial quests
   - `/api/levels/progression` - Sets up level system

### 3. Test Real-time Features
1. Create two user accounts
2. Test messaging between users
3. Verify Socket.IO connection in browser console

## Important Considerations

### Socket.IO on Render
- Render supports WebSocket connections on all paid plans
- Free tier has limitations but should work for testing
- Socket.IO will automatically fall back to polling if needed

### File Storage
- Uploaded files are stored temporarily on Render's filesystem
- For production, consider using Cloudinary for all uploads
- Render's filesystem is ephemeral - files are lost on redeploy

### Performance
- Free tier has slow cold starts (30+ seconds)
- Consider upgrading to Starter plan for better performance
- Enable auto-scaling for high traffic

### Custom Domain
1. In Render dashboard, go to Settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable

## Troubleshooting

### Build Failures
- Check Node version compatibility (requires Node 18+)
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### Socket.IO Connection Issues
- Ensure `NEXTAUTH_URL` matches your Render URL
- Check browser console for WebSocket errors
- Verify JWT_SECRET is set correctly

### MongoDB Connection Issues
- Verify connection string format
- Check IP whitelist includes `0.0.0.0/0`
- Ensure database user has correct permissions

### Environment Variables
- All variables must be set before deployment
- Use Render's "Generate" button for secure keys
- Never commit sensitive data to Git

## Monitoring

### Health Checks
- Render automatically monitors `/api/nexus/realtime`
- Set up alerts for downtime
- Monitor response times in Render dashboard

### Logs
- Access logs via Render dashboard
- Use `console.log` for debugging
- Consider adding proper logging service for production

## Scaling

### When to Upgrade
- Consistent traffic over 100 concurrent users
- Need for faster response times
- Require persistent file storage

### Scaling Options
1. Upgrade to Standard/Performance plans
2. Enable auto-scaling
3. Add CDN for static assets
4. Implement caching strategies

## Security Checklist
- [ ] Strong JWT_SECRET generated
- [ ] MongoDB connection uses SSL
- [ ] Cloudinary credentials are secure
- [ ] NEXUS admin keys are unique
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation active

## Support
- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Project Issues: [Your GitHub Issues URL]