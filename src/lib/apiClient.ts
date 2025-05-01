import axios from 'axios';

// Ensure this matches your deployed backend URL.
// It's recommended to use environment variables for this.
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://imacall-backend.onrender.com';

// Check if the backend URL is set correctly
if (!baseURL) {
  console.error("Error: NEXT_PUBLIC_API_BASE_URL is not defined. Please set it in your .env.local file or ensure the default is correct.");
} else {
  console.log("API Base URL:", `${baseURL}/api/v1`);
}

/*
==================================================
TROUBLESHOOTING "NETWORK ERROR" or CORS ISSUES:
==================================================

If you are seeing "Network Error" in the browser console when making API calls,
it's most likely a Cross-Origin Resource Sharing (CORS) issue or the backend
server is not reachable.

1.  Verify Backend URL:
    - Double-check that the `baseURL` variable above (`${baseURL}`) points to your correctly running backend server.
    - Ensure the backend server is running and accessible from your browser.

2.  Check Backend CORS Configuration:
    - The backend server (FastAPI) **MUST** be configured to allow requests from the frontend's origin.
    - The frontend origin is typically `http://localhost:9002` (or your specified port) during development, and your deployed frontend URL in production.
    - You need to add `CORSMiddleware` in your FastAPI application.

    Example FastAPI CORS Configuration (in your main backend Python file):
    --------------------------------------------------
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI()

    # Define allowed origins
    origins = [
        "http://localhost:9002",        # Allow frontend dev server (replace 9002 if needed)
        "YOUR_DEPLOYED_FRONTEND_URL",   # e.g., "https://your-frontend.vercel.app"
        # Add any other origins if necessary
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,          # List of origins allowed to make requests
        allow_credentials=True,         # Allow cookies to be included in requests
        allow_methods=["*"],            # Allow all methods (GET, POST, PUT, DELETE, etc.)
        allow_headers=["*"],            # Allow all headers
    )

    # ... rest of your FastAPI application setup ...
    --------------------------------------------------

3.  Browser Developer Tools:
    - Open your browser's developer tools (usually F12).
    - Check the "Console" tab for more specific error messages related to CORS.
    - Check the "Network" tab. Find the failing request (it might be highlighted in red), look at its "Headers" and "Response" tabs for clues. A common sign of CORS issues is seeing the request status as `(failed)` with `net::ERR_FAILED` or a CORS-related message in the console.

==================================================
*/


const apiClient = axios.create({
  baseURL: `${baseURL}/api/v1`,
  headers: {
    'Content-Type': 'application/json', // Default Content-Type
  },
});

// Interceptor to add the Authorization header if a token exists
apiClient.interceptors.request.use(
  (config) => {
    // Check if running in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Ensure we don't overwrite Authorization if it's already set (e.g., by fetchUser)
        if (!config.headers['Authorization']) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }
    // Content-Type is set here for most JSON requests.
    // Specific calls (like login which needs form-urlencoded) override this in their call options.
    if (!config.headers['Content-Type'] && config.method?.toLowerCase() !== 'get') {
       config.headers['Content-Type'] = 'application/json';
    }
    // console.log("Request Config:", config); // Debugging requests
    return config;
  },
  (error) => {
    console.error("Request Error Interceptor:", error); // Debugging request errors
    return Promise.reject(error);
  }
);

// Interceptor to log responses or handle global errors
apiClient.interceptors.response.use(
  (response) => {
    // console.log("Response Data:", response.data); // Debugging responses
    return response;
  },
  (error) => {
    console.error("Response Error Interceptor:", error); // Debugging response errors
    // Handle potential 401 Unauthorized errors globally if needed,
    // although the AuthContext currently handles this specifically in fetchUser.
    // if (error.response && error.response.status === 401) {
    //   // Potentially trigger logout or token refresh here
    // }
    return Promise.reject(error);
  }
);



export default apiClient;
