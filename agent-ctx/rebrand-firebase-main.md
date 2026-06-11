# Task: Rebrand NeuraCanvas AI → Pixora.ai + Firebase Integration

## Summary
Completed full rebrand from "NeuraCanvas AI" to "Pixora.ai" and replaced entire backend from Vercel KV/Blob + in-memory storage to Firebase (Auth, Firestore, Storage).

## Files Created
1. `/home/z/my-project/src/lib/firebase.ts` - Firebase Client SDK (lazy init, null-safe when unconfigured)
2. `/home/z/my-project/src/lib/firebase-admin.ts` - Firebase Admin SDK (server-side API routes)
3. `/home/z/my-project/src/contexts/auth-context.tsx` - Auth Provider (email/password + Google OAuth)
4. `/home/z/my-project/src/app/auth/login/page.tsx` - Glassmorphism login page
5. `/home/z/my-project/src/app/auth/signup/page.tsx` - Glassmorphism signup page (50 free credits)
6. `/home/z/my-project/src/app/api/auth/user/route.ts` - User API (GET/POST Firestore users)
7. `/home/z/my-project/src/app/api/credits/route.ts` - Credits API (GET/POST credit management)
8. `/home/z/my-project/.env.local.example` - Environment variable template

## Files Modified
1. `src/lib/storage.ts` - Full rewrite: Vercel KV/Blob → Firestore + Firebase Storage (with in-memory/local fallback)
2. `src/app/api/generate/route.ts` - Added userId, Firestore credit check/deduction, user_images collection
3. `src/app/api/generate/status/route.ts` - Now reads from Firestore via storage.ts
4. `src/app/api/image/[imageId]/route.ts` - Redirects to Firebase Storage URL with local fallback
5. `src/store/use-app-store.ts` - Added `user` field and `setUser` action
6. `src/components/navbar.tsx` - Auth UI: avatar dropdown when logged in, "Sign In" button when not, credits from Firestore
7. `src/components/generator-section.tsx` - Auth gate: shows sign-in prompt when not logged in, credit sync with server
8. `src/components/footer.tsx` - Rebranded to Pixora.ai
9. `src/app/layout.tsx` - Wrapped with AuthProvider, rebranded metadata
10. `src/app/page.tsx` - No changes needed (already clean)
11. `next.config.ts` - Removed `output: "standalone"`, added Firebase Storage remote image patterns
12. `package.json` - Name changed to "pixora-ai"

## Key Design Decisions
- Firebase Client SDK is lazy-initialized: only initializes when NEXT_PUBLIC_FIREBASE_API_KEY is set
- All Firebase-dependent code gracefully handles unconfigured state (null checks everywhere)
- In-memory + local filesystem fallback when Firebase is not configured (dev mode)
- Credits are synced from server to client via both auth context and periodic API polling
- Job-based architecture preserved: POST returns jobId, client polls status
- z-ai-web-dev-sdk still used server-side for AI image generation (unchanged logic)
- All beautiful UI/UX preserved: glassmorphism, aurora effects, animations intact

## Lint Status
Passing (0 errors, 0 warnings)

## Dev Server Status
Running on port 3000, returning 200 responses
