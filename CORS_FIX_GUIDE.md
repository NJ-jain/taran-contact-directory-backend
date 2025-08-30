# 🔧 CORS Issue Resolution Guide

## 🚨 **Problem Identified**
You're experiencing CORS (Cross-Origin Resource Sharing) errors because:
1. **Backend** is running on `http://localhost:5000`
2. **Frontend** is running on `http://localhost:3000`
3. **Backend CORS** was only allowing `https://www.taran.co.in`

## ✅ **Solution Applied**

### **1. Backend CORS Configuration Updated**
- ✅ Modified `index.js` to allow localhost origins
- ✅ Added flexible CORS origin handling
- ✅ Updated OPTIONS preflight handler
- ✅ Maintained production domain support

### **2. Frontend API Calls Cleaned**
- ✅ Removed unnecessary CORS headers from frontend
- ✅ Added proper error handling for all API calls
- ✅ CORS should be handled by backend only

## 🚀 **Steps to Fix CORS**

### **Step 1: Restart Backend Server**
```bash
# Navigate to backend directory
cd taran-contact-directory-backend

# Stop the current server (Ctrl+C if running)
# Then restart
npm start
```

### **Step 2: Verify CORS Configuration**
The backend now allows:
- ✅ `http://localhost:3000` (Frontend)
- ✅ `http://localhost:5000` (Backend)
- ✅ `https://www.taran.co.in` (Production)
- ✅ All origins in development mode

### **Step 3: Test CORS Configuration**
```bash
# Run the CORS test script
node test-cors.js
```

## 🧪 **Testing the Fix**

### **Test 1: Backend Health Check**
```bash
curl http://localhost:5000/api
```

### **Test 2: Frontend API Call**
```bash
# From frontend directory
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"test@example.com"}'
```

### **Test 3: Browser Test**
1. Open browser console on frontend
2. Navigate to forgot password page
3. Submit email form
4. Check for CORS errors in console

## 🔍 **Common CORS Error Messages**

### **Error: "Access to XMLHttpRequest blocked by CORS policy"**
- ✅ **Fixed**: Backend now allows localhost origins

### **Error: "No 'Access-Control-Allow-Origin' header"**
- ✅ **Fixed**: CORS headers properly configured

### **Error: "Method not allowed"**
- ✅ **Fixed**: All HTTP methods allowed

## 🛠️ **Troubleshooting**

### **If CORS still doesn't work:**

1. **Check Backend Server Status**
   ```bash
   curl http://localhost:5000/api
   ```

2. **Verify CORS Configuration**
   ```bash
   node test-cors.js
   ```

3. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Network tab
   - Look for failed requests

4. **Restart Both Servers**
   ```bash
   # Backend
   cd taran-contact-directory-backend
   npm start
   
   # Frontend (new terminal)
   cd taran-contact-directory-frontend
   npm start
   ```

## 📋 **Environment Variables Check**

Make sure these are set in your backend `.env`:
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_secret_here
```

## 🎯 **Expected Results**

After applying the fix:
- ✅ Frontend can call backend APIs
- ✅ No CORS errors in browser console
- ✅ Forgot password flow works completely
- ✅ All API endpoints accessible

## 🚨 **If Still Having Issues**

1. **Clear Browser Cache**
2. **Check if ports are correct**
3. **Verify firewall settings**
4. **Check if other services are using port 5000**

## 📞 **Next Steps**

1. Restart backend server
2. Test CORS with `node test-cors.js`
3. Try the forgot password flow
4. Check browser console for errors

The CORS issue should now be resolved! 🎉
