# OAuth Troubleshooting Guide for Vercel Deployment

## 🚨 Common Issues & Solutions

### 1. **Environment Variables Missing on Vercel**
**Symptoms:** Silent OAuth failure, `auth/invalid-api-key` errors
**Solution:** Add these environment variables to Vercel Dashboard → Project → Settings → Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
```

**After adding:** Redeploy your app

### 2. **Firebase Domain Not Authorized**
**Symptoms:** `auth/unauthorized-domain` errors
**Solution:** 
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your Vercel domain: `your-app.vercel.app`
3. Add any custom domains you're using
4. Keep `localhost` for local development

### 3. **Google Sign-In Not Enabled**
**Symptoms:** `auth/operation-not-allowed` errors
**Solution:**
1. Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Set support email
4. Configure OAuth consent screen if needed

### 4. **Preview Deployments Not Working**
**Issue:** Firebase doesn't support wildcards for `*.vercel.app`
**Solutions:**
- **Option A:** Add specific preview domain to Firebase authorized domains
- **Option B:** Disable OAuth on previews, show fallback login

## 🔍 Debugging Steps

### Step 1: Check Browser Console
Open DevTools → Console on your Vercel deployment and look for:
- Firebase initialization errors
- Authentication error codes
- Missing environment variable warnings

### Step 2: Verify Environment Variables
Add this temporary debug code to your page:
```tsx
console.log('Firebase Config Check:', {
  apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
```

### Step 3: Test Firebase Connection
Check if Firebase is initializing properly by looking for:
- "Firebase config loaded successfully" in console
- "Firebase project ID: [your-project-id]" in console

## 🛠️ Quick Fixes

### Immediate Actions:
1. ✅ Set all environment variables on Vercel
2. ✅ Add Vercel domain to Firebase authorized domains
3. ✅ Enable Google sign-in in Firebase
4. ✅ Redeploy after changes

### If Still Not Working:
1. Check Firebase project settings
2. Verify OAuth consent screen configuration
3. Test with a fresh browser session
4. Check for CORS issues

## 📱 Testing Checklist

- [ ] Local development works
- [ ] Environment variables set on Vercel
- [ ] Vercel domain added to Firebase
- [ ] Google sign-in enabled in Firebase
- [ ] App redeployed after changes
- [ ] Browser console shows no errors
- [ ] OAuth popup opens
- [ ] User can complete sign-in flow

## 🆘 Still Having Issues?

1. **Check Firebase Console logs** for authentication attempts
2. **Verify OAuth consent screen** configuration
3. **Test with incognito mode** to rule out browser issues
4. **Check Vercel deployment logs** for build errors

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
