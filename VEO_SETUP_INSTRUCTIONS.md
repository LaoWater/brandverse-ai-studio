# Veo 3.1 Setup Instructions

## ⚠️ Important: Veo Uses Vertex AI (Different Auth)

Unlike Gemini (which uses simple API keys), **Veo 3.1 requires Google Cloud Vertex AI** with more complex authentication.

---

## 🔧 Option 1: Service Account (Recommended)

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID**

### Step 2: Enable Vertex AI API
```bash
gcloud services enable aiplatform.googleapis.com
```

Or enable via console:
1. Go to **APIs & Services > Library**
2. Search for "Vertex AI API"
3. Click **Enable**

### Step 3: Create Service Account
1. Go to **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Name: `veo-video-generation`
4. Grant role: **Vertex AI User**
5. Click **Done**

### Step 4: Create Service Account Key
1. Click on your service account
2. Go to **Keys** tab
3. Click **Add Key > Create New Key**
4. Choose **JSON**
5. Download the JSON file

### Step 5: Set Supabase Secrets
```bash
# Set the entire JSON as a secret
supabase secrets set GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY="$(cat path/to/your-service-account-key.json)"

# Set your project ID
supabase secrets set GOOGLE_CLOUD_PROJECT_ID="your-project-id"
```

---

## 🔧 Option 2: Use Imagen 3 Instead (Simpler)

If Vertex AI setup is too complex, we can **temporarily use Imagen 3** for video generation, which uses the same API key as Gemini:

### Imagen 3 Video Capabilities
- ✅ Uses simple `GOOGLE_API_KEY` (already configured)
- ✅ Text-to-video generation
- ✅ Faster setup (no Vertex AI needed)
- ⚠️ Lower quality than Veo 3.1
- ⚠️ Fewer features (no keyframe mode)

**Would you prefer this option?** It would let you test video generation immediately while we set up Veo later.

---

## 🔧 Option 3: Alternative - Update Edge Function for Service Account

If you go with Option 1, I'll need to update the edge function to:
1. Parse the service account JSON
2. Generate OAuth 2.0 access tokens
3. Use those tokens for Vertex AI authentication

---

## 📝 Which Option Do You Prefer?

**For quickest testing:**
- Choose **Option 2** (Imagen 3) - works with current setup

**For best quality:**
- Choose **Option 1** (Veo 3.1 + Service Account) - requires setup

Let me know which path you'd like to take, and I'll implement it! 🚀
