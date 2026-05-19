const CLIENT_ID = "c026d284773b45f7a4c7decc94491a1f";

const REDIRECT_URI = "http://127.0.0.1:5500/index.html";

const AUTH_ENDPOINT =
"https://accounts.spotify.com/authorize";

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state"
];

document
.getElementById("spotifyLoginBtn")
.addEventListener("click", () => {

  const authUrl =
    `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${SCOPES.join("%20")}`;

  window.location.href = authUrl;

});