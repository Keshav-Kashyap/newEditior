// API configuration based on environment
// Defaults to production, only uses localhost in development mode
const API_URL = import.meta.env.MODE === 'development'
    ? 'http://localhost:3000'
    : 'https://neweditior-backend.onrender.com'

export default API_URL
