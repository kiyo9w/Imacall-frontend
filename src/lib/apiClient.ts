import axios from 'axios';

// Ensure this matches your deployed backend URL.
// It's recommended to use environment variables for this.
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://imacall-wxtz785oca-uc.a.run.app';

// Check if the backend URL is set correctly
if (!baseURL) {
  console.error("Error: NEXT_PUBLIC_API_BASE_URL is not defined. Please set it in your .env.local file.");
}

const apiClient = axios.create({
  baseURL: `${baseURL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the Authorization header if a token exists
apiClient.interceptors.request.use(
  (config) => {
    // Check if running in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// IMPORTANT: If you encounter Network Errors or CORS issues,
// ensure the backend server (FastAPI) is configured to allow requests
// from the frontend's origin (e.g., http://localhost:9002 during development
// or your deployed frontend URL).
// Example FastAPI CORS middleware configuration:
/*
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:9002", # Allow frontend dev server
    "YOUR_DEPLOYED_FRONTEND_URL", # Allow deployed frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
*/


export default apiClient;
