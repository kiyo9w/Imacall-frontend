import axios from 'axios';

// Ensure this matches your deployed backend URL.
// Use the environment variable first, fall back to the Render URL.
const baseURL = 'https://imacall-backend.onrender.com';

// Check if the backend URL is set correctly
if (!baseURL) {
  // This should ideally not happen with a default value set.
  console.error("Error: API Base URL is not defined. Please set NEXT_PUBLIC_API_BASE_URL or check the default in apiClient.ts.");
} else {
  // Log the final base URL being used
  console.log("API Client Initialized. Base URL:", `${baseURL}/api/v1`);
}

/*
==================================================
!!! TROUBLESHOOTING "NETWORK ERROR" or CORS ISSUES !!!
==================================================

If you are seeing "Network Error" in the browser console when making API calls (like login or registration),
it's **almost certainly** a Cross-Origin Resource Sharing (CORS) issue or the backend
server is not reachable from the browser. Browsers enforce CORS security policies; tools like curl do not.

**THIS IS A BACKEND CONFIGURATION ISSUE.** You need to configure your FastAPI backend
to explicitly allow requests from your frontend's domain (origin).

**Steps to Fix:**

1.  **Identify Frontend Origin:**
    - During **development**, this is usually `http://localhost:xxxx` (e.g., `http://localhost:9002`) or a cloud-based dev URL (e.g., `https://....cloudshell.dev`). Check your browser's address bar.
    - For your **deployed** frontend, this is its public URL (e.g., `https://your-imacall-app.vercel.app`).

2.  **Configure Backend CORS:**
    - In your **FastAPI backend code** (likely your main `main.py` or `app.py`), you **MUST** configure the `CORSMiddleware`.
    - **Crucially, add your specific frontend origin(s) to the `allow_origins` list.**

    ```python
    # Example FastAPI CORS Configuration (in your backend's main Python file)
    # --------------------------------------------------
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    import os # Import os to read environment variables

    app = FastAPI()

    # Define allowed origins - VERY IMPORTANT!
    # Read origins from an environment variable, fallback to a default list for local dev
    # Example: BACKEND_CORS_ORIGINS="http://localhost:9002,https://your-deployed-frontend.com"
    cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:9002").split(",")
    # Add any other always-allowed origins if necessary
    # cors_origins.append("https://another-allowed-origin.com")

    print(f"Configuring CORS for origins: {cors_origins}") # Log the origins being used

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[origin.strip() for origin in cors_origins if origin.strip()], # *** Use the origins list ***
        allow_credentials=True,         # Allow cookies (important for auth headers)
        allow_methods=["*"],            # Allow standard HTTP methods (GET, POST, PUT, DELETE, etc.)
        allow_headers=["*"],            # Allow all headers (including 'Authorization' and 'Content-Type')
    )

    # ... rest of your FastAPI application setup ...
    # --------------------------------------------------
    ```

3.  **Set Backend Environment Variable:** Ensure the `BACKEND_CORS_ORIGINS` environment variable is set correctly in your backend hosting environment (e.g., Render, Cloud Run). It should be a comma-separated string of allowed URLs.
4.  **Redeploy Backend:** After updating the CORS middleware or environment variables in your backend, you **MUST** redeploy your backend server for the changes to take effect.

5.  **Verify in Browser:**
    - Open your browser's developer tools (F12).
    - Go to the "Network" tab.
    - Attempt the action that caused the error (e.g., login).
    - Find the failing request (it might be red). Click on it.
    - Check the "Headers" tab. The "Response Headers" from the server **must** include `Access-Control-Allow-Origin: YOUR_FRONTEND_ORIGIN` (where `YOUR_FRONTEND_ORIGIN` is the URL in your browser's address bar). If this header is missing or incorrect, the backend CORS configuration is still wrong.
    - Check the "Console" tab for any specific CORS error messages.

**Common Mistakes:**
*   Using `allow_origins=["*"]`: While this might seem like a quick fix, it's insecure for production and might not work correctly with credentials. **Always list specific origins.**
*   Forgetting to redeploy the backend after changing CORS settings.
*   Typos in the origin URLs in the `BACKEND_CORS_ORIGINS` environment variable or the `origins` list in the code.
*   Not including `http://` or `https://`.
*   Frontend URL in the browser doesn't exactly match one of the URLs listed in the backend's `allow_origins`.

**Frontend Code (`apiClient.ts`) is likely correct if the `baseURL` points to the right server. The issue is almost always backend CORS configuration.**
==================================================
*/


const apiClient = axios.create({
  baseURL: `${baseURL}/api/v1`,
  // Note: Default Content-Type is set dynamically in the request interceptor below
  // to handle application/json vs form-urlencoded correctly.
});

// Interceptor to add the Authorization header if a token exists
apiClient.interceptors.request.use(
  (config) => {
    // Only access localStorage in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && !config.headers['Authorization']) { // Add token if found and not already set
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Default Content-Type to JSON *unless* data is FormData.
    // The login call specifically sets 'application/x-www-form-urlencoded'.
    // Other requests sending JSON should work automatically.
    if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Log request details for debugging (uncomment if needed)
    // console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    // console.log("Headers:", config.headers);
    // console.log("Data:", config.data);

    return config;
  },
  (error) => {
    console.error("Request Error Interceptor:", error);
    return Promise.reject(error);
  }
);

// Interceptor to log responses or handle global errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response details (uncomment if needed)
    // console.log("API Response Status:", response.status);
    // console.log("API Response URL:", response.config.url);
    // console.log("API Response Data:", response.data);
    return response;
  },
  (error) => {
    console.error("Response Error Interceptor:", error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    // Log more details for network errors (likely CORS)
    if (error.message === 'Network Error' && !error.response) {
        console.error(
            "------\n" +
            "NETWORK ERROR DETECTED:\n" +
            "This usually means a CORS issue or the backend server is down/unreachable from the browser.\n" +
            "1. Verify the backend server at '" + baseURL + "' is running.\n" +
            "2. **CRITICAL**: Ensure the backend's CORS configuration allows requests from this frontend's origin:\n" +
            "   - Frontend Origin: " + (typeof window !== 'undefined' ? window.location.origin : "Cannot determine origin (not in browser)") + "\n" +
            "   - See detailed CORS instructions in the comments within 'src/lib/apiClient.ts'.\n" +
            "3. Check the browser's Network tab for the failed request and look at the 'Headers' -> 'Response Headers'. Is 'Access-Control-Allow-Origin' present and correct?\n" +
            "------"
        );
    } else if (error.response) {
        // Log backend error details if available
        console.error("Backend Error Response Status:", error.response.status);
        console.error("Backend Error Response Data:", error.response.data);
    }

    // Example: Global handling for 401 Unauthorized
    // if (error.response && error.response.status === 401) {
    //   console.log("Global 401 handler: Token might be invalid/expired. Clearing token and potentially redirecting.");
    //   if (typeof window !== 'undefined') {
    //       localStorage.removeItem('accessToken');
    //       // Optionally redirect to login, checking to avoid infinite loops
    //       if (window.location.pathname !== '/login') {
    //           // window.location.href = '/login?sessionExpired=true';
    //       }
    //   }
    //   // Returning the rejected promise allows specific error handling in components/hooks too
    // }

    return Promise.reject(error); // IMPORTANT: Re-reject the error so calling code can handle it
  }
);

export default apiClient;
