# CORS Fix for Browser Preview

## Issue
When using the browser preview proxy (e.g., `http://127.0.0.1:59098`), the frontend was getting **Network Errors** when trying to connect to the backend API at `http://localhost:8000`.

### Error Message
```
AxiosError: Network Error
code: "ERR_NETWORK"
```

## Root Cause
The backend CORS configuration only allowed specific origins:
- `http://localhost:5173`
- `http://localhost:3000`

Browser preview proxies use different ports (e.g., `127.0.0.1:59098`), which were not in the allowed origins list, causing CORS to block the requests.

## Solution
Updated the CORS middleware in `backend/main.py` to allow all origins during development:

```python
# CORS middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
# Add support for all localhost and 127.0.0.1 origins (for development)
allowed_origins.extend([
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
])
# Allow all origins with 127.0.0.1 for browser preview proxies
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Important Notes

### Development vs Production
- **Development**: `allow_origins=["*"]` allows all origins for easy testing
- **Production**: Should restrict to specific domains for security

### For Production Deployment
Replace the CORS configuration with specific allowed origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://www.yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing
After applying this fix:

1. ✅ Backend accepts requests from `localhost:5173`
2. ✅ Backend accepts requests from `127.0.0.1:5173`
3. ✅ Backend accepts requests from browser preview proxies
4. ✅ All API endpoints accessible from frontend

## Verification
Test the connection:
```bash
curl http://localhost:8000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "services": {
    "vision_analyzer": "active",
    "speech_analyzer": "active",
    "ai_service": "active"
  },
  "openai_configured": true
}
```

## Files Modified
- ✅ `backend/main.py` - Updated CORS middleware configuration

## Status
✅ **Fixed** - Frontend can now connect to backend through browser preview proxy
