import axios from 'axios';

// Ensure this matches your deployed backend URL.
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://imacall-backend.onrender.com';

// Check if the backend URL is set correctly
if (!baseURL) {
  console.error("Error: NEXT_PUBLIC_API_BASE_URL is not defined. Please set it in your .env.local file or ensure the default 'https://imacall-backend.onrender.com' is correct.");
} else {
  // Log the final base URL being used
  console.log("API Client Initialized. Base URL:", `${baseURL}/api/v1`);
}

/*
==================================================
TROUBLESHOOTING "NETWORK ERROR" or CORS ISSUES:
==================================================

If you are seeing "Network Error" in the browser console when making API calls,
it's **almost certainly** a Cross-Origin Resource Sharing (CORS) issue or the backend
server is not reachable from the browser. Browsers enforce CORS, tools like curl do not.

1.  **Verify Backend URL:**
    - Double-check that the `baseURL` variable above (`${baseURL}`) points to your correctly running backend server.
    - Ensure the backend server is running and accessible *from your browser* (try pasting the base URL directly into your browser).

2.  **Check Backend CORS Configuration:**
    - The backend server (FastAPI) **MUST** be configured to allow requests **from the frontend's origin**.
    - The frontend origin is the URL shown in your browser's address bar (e.g., `http://localhost:9002` during development, or your deployed URL like `https://your-app.vercel.app`).
    - You need to add `CORSMiddleware` in your FastAPI application and **include your specific frontend origin(s)** in the `allow_origins` list.

    Example FastAPI CORS Configuration (in your main backend Python file):
    --------------------------------------------------
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI()

    # Define allowed origins - VERY IMPORTANT!
    origins = [
        "http://localhost:9002",        # Allow frontend dev server (replace 9002 if needed)
        "https://your-frontend-deployment.com", # Add your deployed frontend URL
        # Add any other origins if necessary
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,          # ** Crucial: List specific origins **
        allow_credentials=True,         # Allow cookies (if using session auth)
        allow_methods=["*"],            # Allow all standard methods
        allow_headers=["*"],            # Allow all headers (including Authorization)
    )

    # ... rest of your FastAPI application setup ...
    --------------------------------------------------
    **After updating backend CORS, you MUST redeploy the backend.**

3.  Browser Developer Tools:
    - Open your browser's developer tools (usually F12).
    - Check the "Console" tab for explicit CORS errors (e.g., "Access to fetch at '...' from origin '...' has been blocked by CORS policy...").
    - Check the "Network" tab. Find the failing request (it might be highlighted in red). Look at its "Headers" tab. The "Response Headers" section *should* include `Access-Control-Allow-Origin: YOUR_FRONTEND_ORIGIN`. If it's missing or has the wrong value, CORS is misconfigured on the backend.

==================================================
*/


const apiClient = axios.create({
  baseURL: `${baseURL}/api/v1`,
  // Note: Default Content-Type is set in the request interceptor below
  // to handle different types like application/json and form-urlencoded.
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

    // Set Content-Type default to JSON unless explicitly overridden later
    // The login call overrides this with 'application/x-www-form-urlencoded'
    if (!config.headers['Content-Type']) {
       config.headers['Content-Type'] = 'application/json';
    }

    // Log request details for debugging
    // console.log(`Making API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.headers, config.data);

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
    // console.log("API Response Status:", response.status);
    // console.log("API Response Data:", response.data);
    return response;
  },
  (error) => {
    console.error("Response Error Interceptor:", error.response?.status, error.message, error.config?.url);
    // Log more details for network errors
    if (error.message === 'Network Error' && !error.response) {
        console.error("Network Error Details: This usually means a CORS issue or the backend server is down/unreachable from the browser. Check backend logs and CORS configuration.");
    }
    // You could add global error handling here (e.g., for 401 Unauthorized)
    // if (error.response && error.response.status === 401) {
    //   console.log("Global 401 handler: Redirecting to login or refreshing token...");
    //   // Example: window.location.href = '/login';
    // }
    return Promise.reject(error);
  }
);



export default apiClient;
