# MovieLens Personalized Movie Recommendations

A personalized movie recommendation web application powered by Shaped AI, featuring a "For You" feed that learns from user interactions.

## 🚀 Live Demo

[View Live App](https://shaped-movie-rec-bj5k74w6t-akriti.vercel.app)

## ✨ Features

- **User Authentication**: Google OAuth integration via Firebase
- **Movie Discovery**: Browse MovieLens dataset with search and genre filtering  
- **Personalized Feed**: "For You" page with Shaped AI-powered recommendations
- **Engagement Tracking**: Upvote movies to improve personalization
- **Real-time Learning**: Every upvote is sent to Shaped API for model improvement

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Firebase Auth with Google OAuth
- **AI/ML**: Shaped AI API for personalized recommendations
- **Data**: MovieLens "small" dataset
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Firebase project
- Shaped AI account

### Environment Variables

Create `.env.local` with:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com

# Shaped AI
SHAPED_API_KEY=your_shaped_api_key
SHAPED_DATASET_ID=your_dataset_id
SHAPED_MODEL_ID=your_model_id
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Enable Google Authentication
4. Get your Firebase config values
5. Add your Vercel domains to authorized domains

### Installation

```bash
git clone https://github.com/AkritiKeswani/shaped-movie-rec-app.git
cd shaped-movie-rec-app
npm install
npm run dev
```

## 📊 Shaped AI Integration

### Dataset Structure
- Uses MovieLens ratings data mapped to user interactions
- Positive interactions: ratings ≥ 4.0 or explicit upvotes
- Real-time learning from user engagement

### API Endpoints
- **POST** `/api/interactions` - Send user upvotes to Shaped
- **GET** `/api/recommendations` - Get personalized movie rankings
- **GET** `/api/status` - Check Shaped API connectivity

## 🎯 Core Features

✅ **User Authentication**: Google OAuth with Firebase (exceeds simple username requirement)  
✅ **MovieLens Dataset**: Complete integration with movie titles and genres  
✅ **Engagement Tracking**: Upvote system for preference learning  
✅ **Personalized Recommendations**: Shaped AI-powered "For You" feed  
✅ **Real-time Learning**: Immediate model updates from user interactions  
✅ **Public Deployment**: Live on Vercel with proper domain configuration

## 📱 User Flow

1. **Authentication**: Sign in with Google account via Firebase
2. **Discovery**: Browse movies on Discover page with search/filtering
3. **Engagement**: Upvote movies to indicate preferences
4. **Personalization**: View tailored recommendations on "For You" page
5. **Learning**: System improves recommendations with each interaction

## 🔧 Technical Implementation

- **Client-side**: React components with Tailwind CSS styling
- **Server-side**: Next.js API routes for Shaped AI integration
- **Authentication**: Firebase handles OAuth flow and user sessions
- **Data Flow**: User interactions → API routes → Shaped AI → Updated recommendations

## 🚀 Deployment

Deployed on Vercel with:
- Automatic deployments from main branch
- Environment variables configured in Vercel dashboard
- Multiple Vercel domains authorized in Firebase for OAuth

## 🔑 Firebase Domain Authorization

For OAuth to work, add these Vercel domains to Firebase:
- `shaped-movie-rec-bj5k74w6t-akriti.vercel.app`
- `shaped-movie-rec-app.vercel.app`
- `shaped-movie-rec-app-git-main-akriti.vercel.app`
- `shaped-movie-rec-app-akriti.vercel.app`

## 🤝 Contributing

This project demonstrates modern web development practices with AI integration. Fork and experiment with different recommendation approaches!

## 📄 License

MIT License
