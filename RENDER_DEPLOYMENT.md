# Render Deployment Guide

## Step 1: Prepare Your Repository
1. Make sure your code is in a Git repository
2. Push to GitHub (or GitLab/Bitbucket)
3. Ensure `.gitignore` excludes sensitive files

## Step 2: Create Render Web Service
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select your `TeamsVoiceExtension` repository
5. Configure the service:
   - **Name**: `teams-voice-extension` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (Free tier, $0/month)

## Step 3: Set Environment Variables
In the Render dashboard, add these environment variables:

**Azure OpenAI Settings:**
- `AZURE_OPENAI_ENDPOINT` = `https://your-resource-name.openai.azure.com/`
- `AZURE_OPENAI_API_KEY` = `[GET_FROM_SHREYA]`
- `AZURE_OPENAI_DEPLOYMENT_NAME` = `gpt-5-mini`
- `AZURE_OPENAI_WHISPER_DEPLOYMENT` = `whisper`
- `AZURE_OPENAI_API_VERSION` = `2024-08-01-preview`

**Production Settings:**
- `NODE_ENV` = `production`
- `PORT` = `3000`

## Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Wait for deployment to complete (usually 2-5 minutes)
4. Note your service URL: `https://your-service-name.onrender.com`

## Step 5: Update Teams Manifest
1. Update `appPackage/manifest.json` with your Render URL
2. Replace all instances of the old ngrok URL
3. Create new Teams app package

## Step 6: Test
1. Test your Render URL in browser
2. Install updated Teams package
3. Test voice recording functionality

## Benefits of Render vs ngrok:
✅ **Always online** - No need to keep laptop running
✅ **Permanent URL** - Never changes
✅ **Free tier available** - $0/month for small apps
✅ **Automatic deployments** - Updates when you push to GitHub
✅ **SSL included** - HTTPS by default
✅ **Team sharing** - Colleagues can use anytime

## Render Free Tier Limits:
- 750 hours/month (enough for always-on)
- Sleeps after 15 minutes of inactivity
- Wakes up automatically on request
- 512MB RAM, 0.5 CPU