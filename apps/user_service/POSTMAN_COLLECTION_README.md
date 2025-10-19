# 📦 User Service - Postman Collection

**Complete API testing collection for the PeerPrep User Service**

---

## 🎯 What's Included

This directory contains a complete Postman collection for testing the User Service API with full RBAC (Role-Based Access Control) support.

### Files

| File | Description |
|------|-------------|
| **User-Service-API.postman_collection.json** | Complete Postman collection (import this!) |
| **USER_SERVICE_POSTMAN_GUIDE.md** | Comprehensive testing guide with examples |
| **USER_SERVICE_QUICK_REFERENCE.md** | Quick reference card for all endpoints |

---

## 🚀 Quick Start

### 1. Import the Collection

```bash
# In Postman:
# 1. Click Import
# 2. Select User-Service-API.postman_collection.json
# 3. Click Import
```

### 2. Start the Service

```bash
cd apps/user_service
pnpm dev
```

### 3. Test It!

```bash
# Health check
curl http://localhost:3001/-/health
# Expected: OK
```

### 4. Open Postman

1. Open **User Service API** collection
2. Click **Health & Observability** → **Health Check**
3. Click **Send**
4. ✅ You're ready!

---

## 📋 What You Can Test

### ✅ Health & Observability
- Health check
- Readiness check (database status)
- Prometheus metrics

### 🔐 Authentication
- Google OAuth flow
- JWT token generation
- Automatic token saving

### 👤 User Profile
- Get my profile
- Update profile (username, description, proficiency)
- Get user by ID (public profiles)

### 🛡️ Admin Functions
- List all users (with pagination & search)
- Delete users
- Update user roles
- Assign permissions

### 🔒 RBAC (Role-Based Access Control)
- List all roles
- List all permissions
- Create custom roles
- Update role permissions
- Delete roles
- Check my permissions

---

## 🎯 Pre-built Test Scenarios

The collection includes 3 complete test scenarios:

### Scenario 1: Complete User Flow
```
Health Check → OAuth → Get Profile → Update Profile → Check Permissions
```

### Scenario 2: Admin User Management
```
List Users → Update Roles → Verify Changes
```

### Scenario 3: RBAC Testing
```
List Roles → List Permissions → Create Role → Update Permissions
```

**Run scenarios:**
- Click scenario folder → **Runner** → **Run**

---

## 🔑 Collection Variables

These variables are automatically managed:

| Variable | Auto-saved? | Description |
|----------|-------------|-------------|
| `baseUrl` | No | Service URL (default: `http://localhost:3001`) |
| `accessToken` | ✅ Yes | JWT from OAuth callback |
| `userId` | ✅ Yes | Current user's ID |

**Collection-level authentication** is pre-configured with Bearer token.

---

## 📖 Documentation

### For Beginners
Start with **USER_SERVICE_QUICK_REFERENCE.md**
- One-page overview of all endpoints
- Quick examples
- Common errors and solutions

### For Detailed Testing
Read **USER_SERVICE_POSTMAN_GUIDE.md**
- Step-by-step testing instructions
- Complete RBAC explanation
- All endpoints documented
- Troubleshooting guide

### For API Reference
Check the **Postman collection descriptions**
- Each request has detailed documentation
- Examples included
- Expected responses shown

---

## 🔐 RBAC Overview

### Hierarchy

```
Users → Roles → Permissions
```

### Default Roles

| Role | Permissions |
|------|-------------|
| **user** (default) | `profile:read`, `profile:update` |
| **moderator** | User permissions + question management |
| **admin** | All permissions |

### Permission Format

```
resource:action
```

**Examples:**
- `profile:read` - View own profile
- `users:update` - Update any user (admin)
- `questions:create` - Create questions
- `roles:delete` - Delete roles (admin)

---

## 🧪 Testing Tips

### 1. Test Without Google OAuth (Development)

For local testing without Google OAuth setup:

**Option A:** Implement a dev login endpoint
```typescript
// In dev environment only
app.post('/v1/auth/dev-login', (req, res) => {
  const { email } = req.body;
  // Create/find user
  // Generate JWT
  // Return token
});
```

**Option B:** Use mock authentication
```javascript
// Similar to collaboration service ENABLE_MOCK_AUTH
```

### 2. Get Admin Access

To test admin endpoints:

```sql
-- 1. Get your user ID
SELECT id, email FROM users WHERE email = 'your@email.com';

-- 2. Assign admin role (role_id = 2)
INSERT INTO user_roles (user_id, role_id) 
VALUES ('your-uuid-here', 2);
```

### 3. Use Collection Runner

Test multiple requests at once:
1. Select a scenario folder
2. Click **Runner**
3. Click **Run User Service API**
4. View results

---

## 📊 Endpoints Summary

### Public (No Auth)
```
GET  /-/health           Health check
GET  /-/ready            Readiness check
GET  /-/metrics          Prometheus metrics
GET  /v1/auth/google     Start OAuth
GET  /v1/auth/google/callback  OAuth callback
```

### Authenticated User
```
GET    /v1/users/me             Get my profile
PATCH  /v1/users/me             Update my profile
GET    /v1/users/:id            Get user by ID
POST   /v1/auth/logout          Logout
GET    /v1/rbac/me/permissions  My permissions
```

### Admin Only
```
GET    /v1/admin/users               List all users
DELETE /v1/admin/users/:id           Delete user
PUT    /v1/admin/users/:id/roles     Update user roles
GET    /v1/rbac/roles                List roles
POST   /v1/rbac/roles                Create role
PUT    /v1/rbac/roles/:id/permissions Update role
DELETE /v1/rbac/roles/:id            Delete role
GET    /v1/rbac/permissions          List permissions
```

---

## 🎯 Common Use Cases

### New User Registration
1. User clicks "Sign in with Google"
2. `GET /v1/auth/google` → Redirects to Google
3. User authenticates with Google
4. `GET /v1/auth/google/callback` → Returns JWT
5. User automatically assigned 'user' role
6. Frontend saves JWT token

### Profile Update
1. User updates profile in UI
2. `PATCH /v1/users/me` with new data
3. Validation (username unique, proficiency valid)
4. Profile updated
5. UI refreshes

### Permission Check
1. Frontend needs to show admin menu
2. `GET /v1/rbac/me/permissions`
3. Check if `users:read` in permissions array
4. Show/hide admin menu accordingly

### Admin Assigns Role
1. Admin views user list
2. `GET /v1/admin/users`
3. Admin selects user, assigns moderator role
4. `PUT /v1/admin/users/:id/roles` with `roleIds: [1, 3]`
5. User immediately has moderator permissions

---

## 🔧 Integration Examples

### With Collaboration Service

```javascript
// User service returns JWT
const token = loginResponse.accessToken;

// Use in collaboration service
// (Set ENABLE_MOCK_AUTH=false in collab service)
POST /v1/sessions
Authorization: Bearer ${token}
```

### With Question Service

```javascript
// Admin creates question
// User service validates 'questions:create' permission
POST /v1/questions
Authorization: Bearer ${adminToken}
{
  "title": "Two Sum",
  "difficulty": "easy"
}
```

---

## 🐛 Common Issues

### Service Not Running
```bash
# Start the service
cd apps/user_service
pnpm dev

# Check health
curl http://localhost:3001/-/health
```

### Token Not Saved
Check the OAuth callback request → **Tests** tab:
```javascript
pm.collectionVariables.set('accessToken', pm.response.json().accessToken);
```

### 403 Forbidden
You need the required permission:
```bash
# Check your permissions
GET /v1/rbac/me/permissions

# If missing, admin needs to assign role
```

### Username Already Taken
Usernames must be unique across all users. Try a different one.

---

## 📚 Additional Resources

### Database Schema
See `schema.dbml` for complete database structure:
- `users` table
- `roles` table  
- `permissions` table
- `user_roles` table (many-to-many)
- `role_permissions` table (many-to-many)

### Implementation Plan
See main `README.md` for:
- Phase 1: Project scaffolding
- Phase 2: Database & Prisma setup
- Phase 3: API implementation
- Phase 4: Testing & deployment

---

## ✅ Testing Checklist

### Basic Setup
- [ ] Collection imported successfully
- [ ] Service running on port 3001
- [ ] Health check returns 200
- [ ] Database connected (ready check)

### Authentication
- [ ] Google OAuth flow works
- [ ] JWT token auto-saved
- [ ] Token used in subsequent requests
- [ ] Logout invalidates token

### Profile Management
- [ ] Get profile returns user data
- [ ] Update username works
- [ ] Update proficiency works
- [ ] Duplicate username rejected
- [ ] Invalid proficiency rejected

### RBAC
- [ ] New users get 'user' role
- [ ] Check permissions works
- [ ] List all roles works
- [ ] List all permissions works

### Admin Functions
- [ ] List users with pagination
- [ ] Search users by username/email
- [ ] Update user roles
- [ ] Create custom role
- [ ] Update role permissions
- [ ] Delete custom role
- [ ] Non-admin gets 403 on admin endpoints

---

## 🎉 You're All Set!

**Everything you need to test the User Service:**

1. ✅ Complete Postman collection
2. ✅ Comprehensive testing guide
3. ✅ Quick reference card
4. ✅ Pre-built test scenarios
5. ✅ Auto-saving variables
6. ✅ Detailed documentation

**Start testing now:**

```bash
# 1. Import User-Service-API.postman_collection.json
# 2. Start service: pnpm dev
# 3. Run Health Check in Postman
# 4. Explore all endpoints!
```

**Happy testing! 🚀**

---

**For collaboration service testing:**
See `apps/collab-service/POSTMAN_GUIDE.md`
