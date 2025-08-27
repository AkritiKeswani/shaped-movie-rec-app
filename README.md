# MovieLens Personalized Movie Recommendations

A personalized movie recommendation web application powered by Shaped AI, featuring a "For You" feed that learns from user interactions.

## 🚀 Live Demo

[View Live App](https://shaped-movie-rec-qc0vg50zb-akriti.vercel.app)

## ✨ Features

- **User Authentication**: Google OAuth integration via Firebase
- **Movie Discovery**: Browse MovieLens dataset with search and genre filtering
- **Personalized Feed**: "For You" page with Shaped AI-powered recommendations
- **Engagement Tracking**: Upvote movies to improve personalization
- **Real-time Learning**: Every upvote is sent to Shaped API for model improvement

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Firebase Auth
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

### Installation

```bash
git clone https://github.com/AkritiKeswani/shaped-movie-rec-app.git
cd shaped-movie-rec-app
npm install
npm run dev
```

## 📊 Shaped AI Setup

### 1. Create Dataset
- Upload `ratings.csv` to Shaped
- Columns: `user_id`, `item_id`, `rating`, `timestamp`
- Treat ratings ≥4.0 as positive interactions

### 2. Train Model
- Use the dataset to train a personalization model
- Model learns from user upvotes to rank movies

### 3. API Integration
- App sends real-time upvotes to Shaped
- "For You" page uses `/rank` endpoint for personalized results

## 🎯 Core Requirements Met

✅ **User Authentication**: Firebase OAuth (exceeds simple username requirement)  
✅ **MovieLens Dataset**: Complete integration with title + genres  
✅ **Engagement Tracking**: Upvote system mapped to ratings ≥4  
✅ **Personalized Feed**: Shaped AI integration with real-time learning  
✅ **Public Deployment**: Hosted on Vercel with live URL  

## 🔧 API Endpoints

- `/api/interactions` - Send user upvotes to Shaped
- `/api/recommendations` - Get personalized movie rankings
- `/api/status` - Check Shaped API health

## 📱 Usage

1. **Sign in** with Google account
2. **Browse movies** on Discover page
3. **Upvote** movies you like
4. **View personalized** recommendations on "For You" page
5. **Watch as** recommendations improve with more interactions

## 🚀 Deployment

The app is automatically deployed to Vercel on every push to main branch.

## 🤝 Contributing

This is a take-home assignment project. Feel free to fork and experiment!

## 📄 License

MIT License
