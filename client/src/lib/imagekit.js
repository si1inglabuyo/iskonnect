import IKB from "imagekit-javascript";

// Prefer an explicit API base URL from env, fall back to port 5000 on same host.
const API_BASE = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`;

const imagekit = new IKB({
     publicKey: "public_y0UlaHviD46GCgtdp45VgfkUKkU=",
     urlEndpoint: "https://ik.imagekit.io/jsmasteryrevi/",
     authenticationEndpoint: `${API_BASE}/api/upload/auth`,
});

export default imagekit;