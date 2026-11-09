// The native Google SDK has no module in Expo Go. Importing it at the top of a screen would crash the login screen there. 
// Load it lazily and surface a clear error instead.

type GoogleSdk = typeof import('@react-native-google-signin/google-signin');

function loadSdk(): GoogleSdk {
  try {
    return require('@react-native-google-signin/google-signin');
  } catch {
    throw new Error(
      'Google sign-in needs a development build (it does not run in Expo Go).',
    );
  }
}

let configured = false;

// Returns the ID token, or null if the user cancelled.
export async function getGoogleIdToken(): Promise<string | null> {
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = loadSdk();

  if (!configured) {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
    configured = true;
  }

  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null;   // cancelled
    const idToken = response.data.idToken;
    if (!idToken) throw new Error('Google did not return an ID token');
    return idToken;
  } catch (err) {
    if (isErrorWithCode(err)) {
      if (err.code === statusCodes.IN_PROGRESS) return null;
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services is missing or out of date.');
      }
    }
    throw err;
  }
}

export async function googleSignOut() {
  try {
    await loadSdk().GoogleSignin.signOut();
  } catch {
    // SDK unavailable (Expo Go) or no active session — safe to ignore.
  }
}