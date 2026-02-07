#!/bin/bash

# Vercel Deployment Script for Lanka Tech API

echo "🚀 Starting Vercel deployment process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    vercel login
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your API is now live on Vercel"
    echo "📋 Don't forget to:"
    echo "   1. Set environment variables in Vercel dashboard"
    echo "   2. Run database migrations if needed"
    echo "   3. Update your frontend API base URL"
else
    echo "❌ Deployment failed. Check the logs above for details."
    exit 1
fi