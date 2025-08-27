# 🎬 MovieLens Recommendation App

A personalized movie recommendation web application powered by **Shaped AI** and built with **Next.js 14**. This app demonstrates how to build a production-ready recommendation system using the MovieLens dataset and modern AI personalization APIs.

## ✨ Features

- **🔐 Google OAuth Authentication** - Secure user sign-in with Firebase
- **🎯 Personalized "For You" Feed** - AI-powered recommendations via Shaped API
- **🎭 Movie Discovery** - Browse and search through MovieLens dataset
- **👍 Upvoting System** - Track user engagement and preferences
- **📱 Responsive Design** - Clean, modern UI with Tailwind CSS
- **🚀 Production Ready** - Built for deployment on Vercel/Netlify

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │────│   Firebase      │────│   Google OAuth  │
│   (Frontend)   │    │   (Auth/DB)     │    │   (Identity)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Shaped AI     │    │   MovieLens     │
│   (ML Model)    │    │   (Dataset)     │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project
- Shaped AI account

### 1. Clone & Install

```bash
git clone https://github.com/AkritiKeswani/shaped-movie-rec-app.git
cd shaped-movie-rec-app
npm install
```

### 2. Environment Setup

Create a `.env.local` file in your project root:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Shaped API Configuration
SHAPED_API_KEY=your_shaped_api_key
SHAPED_BASE_URL=https://api.shaped.ai/v1
SHAPED_DATASET_ID=your_dataset_id
SHAPED_MODEL_ID=your_model_id
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Setup Guide

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Google Authentication

2. **Get Configuration**
   - Project Settings → General → Your Apps
   - Add Web App
   - Copy config values to `.env.local`

### Shaped AI Setup

1. **Sign Up**
   - Visit [shaped.ai](https://shaped.ai)
   - Create free trial account
   - Get API key from dashboard

2. **Upload Dataset**
   - Create new dataset in Shaped
   - Upload `movies.csv` and `ratings.csv`
   - Wait for processing

3. **Train Model**
   - Create personalization model
   - Select your dataset
   - Start training (10-30 minutes)

## 📊 Data Structure

### MovieLens Dataset

The app uses the MovieLens 100k dataset:

- **movies.csv**: Movie metadata (ID, title, genres)
- **ratings.csv**: User ratings (userID, movieID, rating, timestamp)
- **u.item**: Additional movie information
- **u.data**: User-movie interactions

### Rating to Upvote Conversion

- **Ratings ≥4.0** → Treated as "upvotes" (positive feedback)
- **Ratings <4.0** → Treated as negative feedback
- **No rating** → Neutral (no preference)

## 🎯 Core Features

### 1. User Authentication
- Google OAuth via Firebase
- Session persistence
- User profile management

### 2. Movie Discovery
- Browse all movies in dataset
- Search by title or genre
- Filter by release year

### 3. Personalized Recommendations
- AI-powered "For You" feed
- Real-time personalization
- Fallback to popular movies

### 4. Engagement Tracking
- Upvote movies
- Track user preferences
- Send interactions to Shaped

## 🏗️ Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Manrope fonts
- **Authentication**: Firebase Auth, Google OAuth
- **Database**: Firebase Firestore
- **AI/ML**: Shaped AI API
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with AuthProvider
│   ├── page.tsx           # Main application page
│   └── globals.css        # Global styles
├── components/             # Reusable UI components
├── contexts/               # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                    # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   ├── shaped-api.ts      # Shaped AI integration
│   ├── movielens-data.ts  # MovieLens data service
│   └── movielens-processor.ts # Data processing
└── types/                  # TypeScript type definitions
```

## 🔌 API Integration

### Shaped AI Endpoints

- **`GET /datasets/{id}`** - Dataset information
- **`GET /models/{id}`** - Model status
- **`POST /models/{id}/rank`** - Personalized rankings
- **`POST /datasets/{id}/interactions`** - User interactions

### Firebase Services

- **Authentication** - Google OAuth
- **Firestore** - User data storage
- **Hosting** - Static file serving

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables**
   - Add all variables from `.env.local` to Vercel dashboard

3. **Deploy**
   - Push to main branch triggers automatic deployment

### Other Platforms

- **Netlify**: Similar process, use `netlify.toml`
- **Railway**: Container-based deployment
- **AWS Amplify**: Full-stack hosting

## 🧪 Testing

### Local Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### Testing Features

1. **Authentication**: Test Google sign-in/sign-out
2. **Recommendations**: Verify "For You" feed loads
3. **Search**: Test movie search functionality
4. **Upvoting**: Test engagement tracking

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Configuration Error**
   - Check `.env.local` exists
   - Verify Firebase project setup
   - Ensure Google Auth is enabled

2. **Shaped API Errors**
   - Verify API key in environment
   - Check dataset/model status
   - Ensure model training is complete

3. **MovieLens Data Issues**
   - Verify CSV files in `public/` folder
   - Check file format and encoding
   - Ensure proper parsing logic

### Debug Mode

Enable debug logging in browser console:

```typescript
// Check Firebase status
console.log('Firebase config:', firebaseConfig);

// Check Shaped status
console.log('Shaped status:', await shapedClient.getStatus());
```

## 📈 Performance

### Optimization Features

- **Lazy Loading**: Components load on demand
- **Caching**: Firebase and Shaped responses cached
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic bundle optimization

### Monitoring

- **Firebase Analytics**: User engagement tracking
- **Vercel Analytics**: Performance monitoring
- **Console Logging**: Development debugging

## 🔒 Security

### Best Practices

- **Environment Variables**: Never commit secrets
- **Firebase Rules**: Secure database access
- **API Keys**: Server-side validation
- **HTTPS**: Secure communication

### Security Checklist

- [ ] `.env.local` in `.gitignore`
- [ ] Firebase security rules configured
- [ ] API rate limiting implemented
- [ ] Input validation on all forms

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MovieLens**: For the movie dataset
- **Shaped AI**: For AI personalization platform
- **Firebase**: For authentication and hosting
- **Next.js Team**: For the amazing framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/AkritiKeswani/shaped-movie-rec-app/issues)
- **Documentation**: [Shaped AI Docs](https://docs.shaped.ai)
- **Firebase Help**: [Firebase Support](https://firebase.google.com/support)

---

**Built with ❤️ for the Growth Engineer Take-Home Assignment**

*Your app is now ready for AI-powered personalized movie recommendations! 🎬✨*
# Force redeploy
