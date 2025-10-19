# 🎯 User Service - Quick API Reference

**Quick reference for all User Service endpoints**

---

## 🏃 Quick Start

```bash
# 1. Start service
cd apps/user_service
pnpm dev

# 2. Health check
curl http://localhost:3001/-/health

# 3. Import Postman collection
# File: User-Service-API.postman_collection.json
```

---

## 📍 Base URL

```
http://localhost:3001
```

---

## 🔑 Authentication

**All endpoints (except health & auth) require:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Get token via Google OAuth:**
1. `GET /v1/auth/google` → Redirects to Google
2. Sign in with Google
3. `GET /v1/auth/google/callback?code=...` → Returns JWT

---

## 📋 Endpoints Overview

### Health & Observability (No Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/-/health` | GET | Basic health check |
| `/-/ready` | GET | Database status |
| `/-/metrics` | GET | Prometheus metrics |

---

### Authentication (No Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/auth/google` | GET | Start Google OAuth |
| `/v1/auth/google/callback` | GET | OAuth callback (returns JWT) |
| `/v1/auth/logout` | POST | Logout (requires auth) |

---

### User Profile (Auth Required)

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/v1/users/me` | GET | `profile:read` | Get my profile |
| `/v1/users/me` | PATCH | `profile:update` | Update my profile |
| `/v1/users/:id` | GET | - | Get user by ID (public) |

---

### Admin - Users (Admin Only)

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/v1/admin/users` | GET | `users:read` | List all users |
| `/v1/admin/users/:id` | DELETE | `users:delete` | Delete user |
| `/v1/admin/users/:id/roles` | PUT | `users:update` | Update user roles |

---

### RBAC Management (Admin Only)

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/v1/rbac/roles` | GET | `roles:read` | List all roles |
| `/v1/rbac/permissions` | GET | `permissions:read` | List permissions |
| `/v1/rbac/roles` | POST | `roles:create` | Create role |
| `/v1/rbac/roles/:id/permissions` | PUT | `roles:update` | Update role perms |
| `/v1/rbac/roles/:id` | DELETE | `roles:delete` | Delete role |
| `/v1/rbac/me/permissions` | GET | - | My permissions |

---

## 🔐 Default Roles

| Role | ID | Permissions |
|------|----|-----------| 
| **user** | 1 | `profile:read`, `profile:update` |
| **admin** | 2 | All permissions |
| **moderator** | 3 | User + question management |

---

## 🎯 Common Permissions

```
profile:read         - View own profile
profile:update       - Update own profile
users:read          - List all users
users:update        - Update any user
users:delete        - Delete users
questions:create    - Create questions
questions:update    - Update questions
questions:delete    - Delete questions
roles:create        - Create roles
roles:update        - Update roles
roles:delete        - Delete roles
permissions:read    - View permissions
```

---

## 📝 Request/Response Examples

### 1. Get My Profile

```bash
curl http://localhost:3001/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "id": "uuid",
  "username": "cool_coder",
  "display_name": "Cool Coder",
  "email": "user@example.com",
  "avatar_url": "https://...",
  "description": "Passionate programmer",
  "programming_proficiency": "intermediate",
  "roles": ["user"],
  "created_at": "2025-10-19T...",
  "updated_at": "2025-10-19T..."
}
```

---

### 2. Update Profile

```bash
curl -X PATCH http://localhost:3001/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "new_username",
    "display_name": "New Name",
    "description": "Updated bio",
    "programming_proficiency": "advanced"
  }'
```

**Updateable Fields:**
- ✅ `username` (must be unique)
- ✅ `display_name`
- ✅ `description` (max 1000 chars)
- ✅ `programming_proficiency` (beginner/intermediate/advanced)
- ✅ `avatar_url`

**Immutable Fields:**
- ❌ `id`
- ❌ `email`
- ❌ `google_id`
- ❌ `created_at`

---

### 3. Check My Permissions

```bash
curl http://localhost:3001/v1/rbac/me/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "userId": "uuid",
  "roles": ["user", "moderator"],
  "permissions": [
    "profile:read",
    "profile:update",
    "questions:create",
    "questions:update"
  ]
}
```

---

### 4. List All Users (Admin)

```bash
curl "http://localhost:3001/v1/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "username": "user1",
      "email": "user1@example.com",
      "roles": ["user"]
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

---

### 5. Update User Roles (Admin)

```bash
curl -X PUT http://localhost:3001/v1/admin/users/USER_UUID/roles \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleIds": [1, 3]
  }'
```

**Common Role IDs:**
- `[1]` - User only
- `[1, 2]` - User + Admin
- `[1, 3]` - User + Moderator

---

### 6. Create Custom Role (Admin)

```bash
curl -X POST http://localhost:3001/v1/rbac/roles \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "content_manager",
    "permissionIds": [1, 2, 6, 7]
  }'
```

**Permission IDs:**
- `1` - profile:read
- `2` - profile:update
- `6` - questions:create
- `7` - questions:update
- `8` - questions:delete

---

## 🚦 HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PATCH/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid data/validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate username/email |
| 500 | Server Error | Internal error |

---

## ⚠️ Common Errors

### Username Already Taken
```json
{
  "error": "Username already exists",
  "field": "username"
}
```
**Solution:** Choose different username

---

### Invalid Proficiency Level
```json
{
  "error": "Invalid programming_proficiency",
  "allowed": ["beginner", "intermediate", "advanced"]
}
```
**Solution:** Use valid enum value

---

### Insufficient Permissions
```json
{
  "error": "Insufficient permissions",
  "required": "users:delete",
  "current": ["profile:read", "profile:update"]
}
```
**Solution:** Ask admin to assign required role

---

## 🧪 Testing Flow

### Regular User Flow

```
1. GET /-/health              ✅ Service running
2. GET /v1/auth/google        ✅ Start OAuth
3. [Sign in with Google]      ✅ Authenticate
4. GET /v1/users/me           ✅ View profile
5. PATCH /v1/users/me         ✅ Update profile
6. GET /v1/rbac/me/permissions ✅ Check permissions
```

---

### Admin Flow

```
1. Authenticate as admin      ✅ Get admin token
2. GET /v1/admin/users        ✅ List users
3. PUT /v1/admin/users/:id/roles ✅ Update roles
4. GET /v1/rbac/roles         ✅ View all roles
5. POST /v1/rbac/roles        ✅ Create role
6. PUT /v1/rbac/roles/:id/permissions ✅ Update perms
```

---

## 🎯 Postman Quick Tips

### 1. Use Collection Variables
```
{{baseUrl}}/v1/users/me
{{accessToken}}
{{userId}}
```

### 2. Auto-save Token
Add to OAuth callback Tests tab:
```javascript
pm.collectionVariables.set('accessToken', pm.response.json().accessToken);
```

### 3. Collection-level Auth
Already configured! All requests inherit Bearer token.

### 4. Use Runner
Test multiple requests in sequence:
- Click folder → Runner → Run

### 5. Environments
Create environments for:
- Local (`http://localhost:3001`)
- Staging (`https://staging-api...`)
- Production (`https://api...`)

---

## 🔗 Integration with Other Services

### Collaboration Service

```javascript
// User service provides JWT
const token = pm.collectionVariables.get('accessToken');

// Use in collaboration service (with ENABLE_MOCK_AUTH=false)
Authorization: Bearer ${token}
```

### Question Service

```javascript
// Admin creates question
POST /v1/questions
Authorization: Bearer <admin-token>

// Service validates permission via user service
```

---

## 📚 Files Reference

| File | Description |
|------|-------------|
| `User-Service-API.postman_collection.json` | Postman collection |
| `USER_SERVICE_POSTMAN_GUIDE.md` | Complete guide |
| `USER_SERVICE_QUICK_REFERENCE.md` | This file! |
| `schema.dbml` | Database schema |
| `README.md` | Implementation plan |

---

## 🎉 Ready to Test!

**3 Steps to Start:**

```bash
# 1. Import collection
# User-Service-API.postman_collection.json

# 2. Start service
cd apps/user_service && pnpm dev

# 3. Test health
curl http://localhost:3001/-/health
```

**Happy testing! 🚀**

---

## 💡 Pro Tips

- **New users** automatically get 'user' role
- **Tokens** saved automatically from callback
- **Permissions** checked on every request
- **Username** must be unique (validation enforced)
- **Email** cannot be changed after creation
- **Roles** can be combined (user + moderator + admin)
- **Admin** role has all permissions

---

## 🐛 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| Connection refused | `pnpm dev` in user_service |
| 401 Unauthorized | Re-authenticate (get new token) |
| 403 Forbidden | Check permissions, need admin role |
| Username taken | Use different username |
| Invalid proficiency | Use beginner/intermediate/advanced |
| Token not saving | Check Tests tab in callback request |

---

**Need detailed docs?** See `USER_SERVICE_POSTMAN_GUIDE.md`

**Need collab service testing?** See `apps/collab-service/POSTMAN_GUIDE.md`
