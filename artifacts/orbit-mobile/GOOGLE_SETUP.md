# Google Contacts Import — Setup

The Google contacts import is fully built, but it needs OAuth client IDs that
only you can create (they live under your Google account). This is about 10
minutes. Until it's done, the "Google contacts" import screen shows a friendly
"not configured yet" message; nothing else is affected.

## 1. Create a Google Cloud project
1. Go to https://console.cloud.google.com/ and create a new project (e.g. "Orbit").

## 2. Enable the People API
1. APIs & Services → Library → search "People API" → **Enable**.
   (This is the API that returns a user's contacts.)

## 3. Configure the OAuth consent screen
1. APIs & Services → OAuth consent screen.
2. User type: **External**. Fill in app name, your support email, developer email.
3. Scopes → add `.../auth/contacts.readonly` (the People API read-only contacts scope).
4. Test users → add your own Google address (and any testers). While the app is
   in "Testing", ONLY these users can sign in — no Google review needed yet.
5. Going public later requires Google verification (privacy policy, a demo video,
   possibly a security review). That's only needed for public App Store release,
   not for you/TestFlight testers.

## 4. Create OAuth client IDs
APIs & Services → Credentials → Create credentials → OAuth client ID. Create:

- **iOS** client:
  - Bundle ID: `com.anonymous.orbit-mobile` (matches `app.json` → `ios.bundleIdentifier`).
- **Web** client (expo-auth-session uses this under the hood on some flows):
  - No redirect URI needed for the basic native flow, but create it so the id exists.
- **Android** client (only if/when you build for Android):
  - Package name `com.anonymous.orbit-mobile` + your signing SHA-1.

## 5. Paste the IDs into the app
Put the client IDs into `artifacts/orbit-mobile/.env.local`:

```
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com   # optional
```

Then restart the Expo dev server so the values are baked in.

## 6. iOS URL scheme
`expo-auth-session`'s Google provider needs the reversed iOS client ID as a URL
scheme so the OAuth redirect can return to the app. Add it to `app.json` under
`ios.infoPlist.CFBundleURLTypes` (or via the `expo-build-properties` plugin):

```
"com.googleusercontent.apps.xxxxxxxx"   // the iOS client ID, reversed
```

(Ping me once you have the iOS client ID and I'll wire this scheme in exactly.)

## 7. Test
Run the app, People tab → import button → **Google contacts** → Continue with
Google → sign in with a test user → your Google contacts appear in the same
review-and-select screen as phone contacts.

## Notes
- This is a one-time data grant, not a login. Orbit uses the token to fetch
  contacts once and drops it; it never stores your Google password.
- The import goes through the same `POST /api/people/import` endpoint and the
  same dedupe as every other source.
