/* spotifyAuth.js
 *
 * Implements Spotify Authorization Code flow with PKCE.
 *
 * Implicit grant flow is deprecated and will be removed:contentReference[oaicite:3]{index=3},
 * so we use Authorization Code with PKCE.
 *
 * Steps:
 * 1. Generate code_verifier and code_challenge.
 * 2. Redirect user to authorize endpoint with response_type=code and code_challenge.
 * 3. After redirect, parse ?code=... from URL, exchange for access_token and refresh_token.
 * 4. Save tokens in sessionStorage, handle refresh when expired.
 */

const CLIENT_ID = "7b28e1a8d13440d78d32cbaca93a7656";
const REDIRECT_URI = "http://127.0.0.1:5173/"; // must match Spotify dashboard
const SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-email",
  "user-read-private",
];

/** Utility: generate a random string for code_verifier */
function generateRandomString(length = 96) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

/** Utility: SHA-256 digest then base64url encode */
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}
function base64urlencode(buf) {
  let str = "";
  buf.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function generateCodeChallenge(codeVerifier) {
  const digest = await sha256(codeVerifier);
  return base64urlencode(digest);
}

/** Save access token with expiry; also store refresh token if provided */
function saveToken(token, expiresIn, refreshToken) {
  const expiresAt = Date.now() + Number(expiresIn) * 1000;
  sessionStorage.setItem("spotify_access_token", token);
  sessionStorage.setItem("spotify_token_expires_at", String(expiresAt));
  if (refreshToken) {
    sessionStorage.setItem("spotify_refresh_token", refreshToken);
  }
}

/** Read access token if not expired */
function readToken() {
  const token = sessionStorage.getItem("spotify_access_token");
  const expStr = sessionStorage.getItem("spotify_token_expires_at");
  if (!token || !expStr) return null;
  const exp = Number(expStr);
  if (Date.now() >= exp) return null;
  return token;
}

/** Parse code or error from query string. */
function parseCodeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  // Clear query string to avoid repeated parsing
  if (code || error) {
    if (window.history.replaceState) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }
  return { code, error };
}

/** Exchange authorization code for access_token & refresh_token */
async function exchangeCodeForToken(code) {
  const codeVerifier = sessionStorage.getItem("spotify_code_verifier");
  if (!codeVerifier) throw new Error("Missing code_verifier");
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(
      `Token exchange failed ${response.status}: ${await response.text()}`
    );
  }
  const data = await response.json();
  saveToken(data.access_token, data.expires_in, data.refresh_token);
  return data.access_token;
}

/** Refresh token using refresh_token */
async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem("spotify_refresh_token");
  if (!refreshToken) return null;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Some responses may not include a new refresh_token; keep old one
  saveToken(data.access_token, data.expires_in, data.refresh_token || refreshToken);
  return data.access_token;
}

/** Build authorize URL with PKCE and redirect */
async function buildAuthUrl() {
  const codeVerifier = generateRandomString();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  sessionStorage.setItem("spotify_code_verifier", codeVerifier);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/** Main: ensure we have a valid token; handle exchange & refresh */
export async function ensureSpotifyToken() {
  // 1. Return cached token if valid
  const cached = readToken();
  if (cached) return cached;

  // 2. Check query string for code or error
  const { code, error } = parseCodeFromQuery();
  if (error) {
    console.error("Spotify authorization error:", error);
    return null;
  }
  if (code) {
    try {
      return await exchangeCodeForToken(code);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // 3. Try refresh token
  const refreshed = await refreshAccessToken();
  if (refreshed) return refreshed;

  // 4. Otherwise, initiate authorization
  const url = await buildAuthUrl();
  window.location.assign(url);
  // return a promise that never resolves, since we redirect
  return new Promise(() => {});
}
