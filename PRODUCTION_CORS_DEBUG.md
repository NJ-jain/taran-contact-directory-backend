# 🔧 Production CORS Debugging Guide

## Issue Description
Frontend at `https://www.taran.co.in` cannot access backend at `https://taran-contact-directory-backend.vercel.app/api/members` due to CORS policy violation.

## What I Fixed

### 1. Express.js CORS Configuration
- **Before**: Generic CORS with `origin: true` (allowed all origins)
- **After**: Specific CORS with `origin: ['https://www.taran.co.in', 'https://taran.co.in']`
- **Added**: `preflightContinue: false` to properly handle OPTIONS requests

### 2. Preflight Request Handling
- **Before**: Complex preflight handling that might conflict
- **After**: Clean, explicit OPTIONS handling with proper status codes
- **Key**: All OPTIONS requests now return `200` status (not `204` or other codes)

### 3. Vercel Configuration
- **Before**: Complex route-level CORS headers that conflicted with Express
- **After**: Simple routing, letting Express handle all CORS logic

## Current CORS Configuration

```javascript
const corsOptions = {
  origin: ['https://www.taran.co.in', 'https://taran.co.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Adminauthorization'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};
```

## Testing Steps

### 1. Wait for Vercel Deployment
- Changes are now pushed to GitHub
- Vercel should auto-deploy in 1-2 minutes
- Check deployment status at: https://vercel.com/dashboard

### 2. Test the API Endpoint
```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://www.taran.co.in" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://taran-contact-directory-backend.vercel.app/api/members

# Test actual request
curl -H "Origin: https://www.taran.co.in" \
  https://taran-contact-directory-backend.vercel.app/api/members
```

### 3. Browser Developer Tools
- Open https://www.taran.co.in in browser
- Open Developer Tools → Network tab
- Try to access the members API
- Check if OPTIONS request returns 200 status
- Check if GET request succeeds

## Common CORS Issues & Solutions

### Issue 1: Preflight Fails (OPTIONS returns non-200)
**Solution**: Ensure OPTIONS requests return exactly `200` status

### Issue 2: Origin Mismatch
**Solution**: Verify the exact origin in CORS configuration matches your frontend

### Issue 3: Headers Not Allowed
**Solution**: Check `allowedHeaders` includes all headers your frontend sends

### Issue 4: Vercel vs Express Conflict
**Solution**: Let Express handle CORS, keep Vercel config simple

## Debugging Commands

### Check Vercel Logs
```bash
# View real-time logs
vercel logs taran-contact-directory-backend

# View specific function logs
vercel logs taran-contact-directory-backend --function=index
```

### Test Different Origins
```bash
# Test with exact origin
curl -H "Origin: https://www.taran.co.in" \
  https://taran-contact-directory-backend.vercel.app/api

# Test with www subdomain
curl -H "Origin: https://taran.co.in" \
  https://taran-contact-directory-backend.vercel.app/api
```

## If Issues Persist

### 1. Check Vercel Function Logs
- Go to Vercel dashboard
- Check function logs for CORS errors
- Verify the function is receiving requests

### 2. Verify Environment Variables
- Ensure all environment variables are set in Vercel
- Check if database connection is working

### 3. Test with Postman/Insomnia
- Use API testing tools to isolate CORS vs other issues
- Test with and without CORS headers

## Expected Behavior After Fix

✅ OPTIONS requests return `200` status  
✅ GET requests succeed with proper CORS headers  
✅ Frontend can access `/api/members` endpoint  
✅ No more "Response to preflight request doesn't pass access control check" errors  

## Monitoring
- Check Vercel function logs for any CORS-related errors
- Monitor frontend console for CORS violations
- Verify API responses include proper CORS headers
