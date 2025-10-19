# 🚀 User Service - Postman Testing Guide

**Complete guide for testing the PeerPrep User Service API with RBAC**

---

## 📥 Import the Collection

1. **Open Postman** (download from https://www.postman.com/downloads/ if needed)

2. **Import the collection:**
   - Click **Import** button (top left)
   - Select **File** tab
   - Choose `User-Service-API.postman_collection.json`
   - Click **Import**

3. **Collection appears** as "User Service API" in left sidebar

---

## ⚙️ Collection Variables

The collection includes these variables:

| Variable      | Default Value           | Description           |
| ------------- | ----------------------- | --------------------- |
| `baseUrl`     | `http://localhost:3001` | User service base URL |
| `accessToken` | (auto-saved)            | JWT token from login  |
| `userId`      | (auto-saved)            | Current user's ID     |

**Collection-level authentication:**

- Bearer token automatically applied to all requests
- Uses `{{accessToken}}` variable
- Individual requests can override if needed

---

## 🔑 Authentication Flow

### How Google OAuth Works

1. **Initiate OAuth** → `GET /v1/auth/google`
   - Redirects to Google sign-in page
   - User authenticates with Google

2. **Callback** → `GET /v1/auth/google/callback?code=...`
   - Google redirects back with auth code
   - Service exchanges code for user info
   - Creates/updates user in database
   - Assigns default 'user' role to new users
   - Returns JWT access token

3. **Use Token** → Add to all subsequent requests
   - Automatic via collection-level auth
   - Token saved to `{{accessToken}}` variable

### Testing Without Browser (Development)

For testing, you may need to:

1. Use a mock JWT generator (similar to collab-service)
2. Implement a dev-only endpoint like `POST /v1/auth/dev-login`
3. Use environment-specific OAuth redirect URLs

---

## 🧪 Quick Start Testing

### Step 1: Health Check ✅

**Verify service is running:**

1. Expand **Health & Observability** folder
2. Click **Health Check** → **Send**
   - ✅ Expected: `200 OK`

3. Click **Ready Check** → **Send**
   - ✅ Expected: `200 OK` with database status

4. Click **Metrics** → **Send**
   - ✅ Expected: Prometheus metrics

---

### Step 2: Authenticate 🔐

**Get an access token:**

**Option A - Google OAuth (Production flow):**

1. Click **Authentication** → **Google OAuth - Initiate**
2. Copy URL and open in browser
3. Sign in with Google
4. Copy callback URL with code parameter
5. Update **Google OAuth - Callback** request with code
6. Click **Send**
7. ✅ Token automatically saved to `{{accessToken}}`

**Option B - Dev Login (if implemented):**

```bash
# Example dev endpoint (if your team implements it)
POST {{baseUrl}}/v1/auth/dev-login
{
  "email": "test@example.com"
}
```

---

### Step 3: Get Profile 👤

**Retrieve your user profile:**

1. Click **User Profile** → **Get My Profile**
2. Click **Send**
3. ✅ Expected: 200 OK with user details:

```json
{
  "id": "uuid",
  "username": "john_doe",
  "display_name": "John Doe",
  "email": "john@example.com",
  "avatar_url": "https://lh3.googleusercontent.com/...",
  "description": null,
  "programming_proficiency": null,
  "created_at": "2025-10-19T...",
  "updated_at": "2025-10-19T...",
  "roles": ["user"]
}
```

---

### Step 4: Update Profile ✏️

**Update your profile information:**

1. Click **User Profile** → **Update My Profile**
2. Modify the request body:

```json
{
  "username": "cool_coder_2025",
  "display_name": "Cool Coder",
  "description": "Passionate about algorithms and data structures!",
  "programming_proficiency": "intermediate",
  "avatar_url": "https://example.com/my-avatar.jpg"
}
```

3. Click **Send**
4. ✅ Expected: 200 OK with updated profile

---

### Step 5: Check Permissions 🔒

**See what you can do:**

1. Click **RBAC - Roles & Permissions** → **Check My Permissions**
2. Click **Send**
3. ✅ Expected: List of your permissions:

```json
{
  "userId": "uuid",
  "roles": ["user"],
  "permissions": ["profile:read", "profile:update"]
}
```

---

## 🔐 RBAC (Role-Based Access Control)

### Understanding RBAC

**Hierarchy:**

```
Users → Roles → Permissions
```

**Example:**

- User: `john@example.com`
- Roles: `["user", "moderator"]`
- Permissions: `["profile:read", "profile:update", "questions:create", "questions:update"]`

### Default Roles

| Role          | Description          | Default Permissions                                       |
| ------------- | -------------------- | --------------------------------------------------------- |
| **user**      | Standard user        | `profile:read`, `profile:update`                          |
| **moderator** | Content moderator    | User permissions + `questions:create`, `questions:update` |
| **admin**     | System administrator | All permissions                                           |

### Permission Naming Convention

Format: `resource:action`

**Examples:**

- `profile:read` - View own profile
- `profile:update` - Update own profile
- `users:read` - View all users (admin)
- `users:update` - Update any user (admin)
- `users:delete` - Delete users (admin)
- `questions:create` - Create questions
- `questions:update` - Update questions
- `questions:delete` - Delete questions
- `roles:create` - Create new roles (admin)
- `roles:update` - Update role permissions (admin)
- `roles:delete` - Delete roles (admin)

---

## 🛡️ Testing Admin Endpoints

### Prerequisites

You need an admin account to test admin endpoints.

**Create admin user (database):**

```sql
-- 1. Get your user ID
SELECT id, email FROM users WHERE email = 'your@email.com';

-- 2. Get admin role ID
SELECT id FROM roles WHERE name = 'admin';

-- 3. Assign admin role
INSERT INTO user_roles (user_id, role_id)
VALUES ('your-user-uuid', 2);  -- Assuming admin role_id is 2
```

### Admin Testing Flow

1. **List All Users**
   - **Admin - User Management** → **List All Users**
   - Test pagination: `?page=2&limit=10`
   - Test search: `?search=john`

2. **Update User Roles**
   - **Admin - User Management** → **Update User Roles**
   - Assign moderator role to a user
   - Body: `{"roleIds": [1, 3]}` (user + moderator)

3. **Delete User**
   - **Admin - User Management** → **Delete User**
   - ⚠️ Use with caution (permanent deletion)

---

## 🎯 Complete Test Scenarios

The collection includes 3 pre-built scenarios:

### Scenario 1: Complete User Flow

**Steps:**

1. Health Check
2. Initiate Google OAuth
3. Get My Profile
4. Update Profile
5. Check My Permissions

**Run all:**

- Click folder → **Runner** → **Run Scenario 1**

---

### Scenario 2: Admin User Management

**Steps:**

1. List All Users (paginated)
2. Update User Roles (assign moderator)
3. Verify User Updated

**Requirements:**

- Admin access token
- Another user's ID in `{{userId}}`

---

### Scenario 3: RBAC Testing

**Steps:**

1. List All Roles
2. List All Permissions
3. Create New Role (content_moderator)
4. Update Role Permissions

**Requirements:**

- Admin access token
- `roles:create` and `roles:update` permissions

---

## 📋 API Endpoints Reference

### Health & Observability

| Endpoint     | Method | Auth | Description                 |
| ------------ | ------ | ---- | --------------------------- |
| `/-/health`  | GET    | No   | Basic health check          |
| `/-/ready`   | GET    | No   | Readiness check (DB status) |
| `/-/metrics` | GET    | No   | Prometheus metrics          |

---

### Authentication

| Endpoint                   | Method | Auth | Description                  |
| -------------------------- | ------ | ---- | ---------------------------- |
| `/v1/auth/google`          | GET    | No   | Initiate Google OAuth        |
| `/v1/auth/google/callback` | GET    | No   | OAuth callback (returns JWT) |
| `/v1/auth/logout`          | POST   | Yes  | Logout user                  |

**Callback Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user123",
    ...
  }
}
```

---

### User Profile

| Endpoint        | Method | Auth | Permission       | Description             |
| --------------- | ------ | ---- | ---------------- | ----------------------- |
| `/v1/users/me`  | GET    | Yes  | `profile:read`   | Get my profile          |
| `/v1/users/me`  | PATCH  | Yes  | `profile:update` | Update my profile       |
| `/v1/users/:id` | GET    | Yes  | -                | Get user by ID (public) |

**Updateable Fields:**

- `username` (unique)
- `display_name`
- `description` (max 1000 chars)
- `programming_proficiency` (beginner/intermediate/advanced)
- `avatar_url`

**Immutable Fields:**

- `id`, `email`, `google_id`, `created_at`

---

### Admin - User Management

| Endpoint                    | Method | Auth | Permission     | Description       |
| --------------------------- | ------ | ---- | -------------- | ----------------- |
| `/v1/admin/users`           | GET    | Yes  | `users:read`   | List all users    |
| `/v1/admin/users/:id`       | DELETE | Yes  | `users:delete` | Delete user       |
| `/v1/admin/users/:id/roles` | PUT    | Yes  | `users:update` | Update user roles |

**List Users Query Params:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `search` - Search by username or email

---

### RBAC - Roles & Permissions

| Endpoint                         | Method | Auth | Permission         | Description             |
| -------------------------------- | ------ | ---- | ------------------ | ----------------------- |
| `/v1/rbac/roles`                 | GET    | Yes  | `roles:read`       | List all roles          |
| `/v1/rbac/permissions`           | GET    | Yes  | `permissions:read` | List all permissions    |
| `/v1/rbac/roles`                 | POST   | Yes  | `roles:create`     | Create new role         |
| `/v1/rbac/roles/:id/permissions` | PUT    | Yes  | `roles:update`     | Update role permissions |
| `/v1/rbac/roles/:id`             | DELETE | Yes  | `roles:delete`     | Delete role             |
| `/v1/rbac/me/permissions`        | GET    | Yes  | -                  | Get my permissions      |

---

## 🐛 Troubleshooting

### "Could not get any response"

**Error:** `connect ECONNREFUSED`

**Solution:**

```bash
# Check if service is running
curl http://localhost:3001/-/health

# If not, start it
cd apps/user_service
pnpm dev
```

---

### "Unauthorized" (401)

**Error:** `{"error": "Unauthorized"}`

**Causes:**

1. No access token provided
2. Token expired
3. Invalid token

**Solution:**

1. Verify `{{accessToken}}` variable is set
2. Re-authenticate via Google OAuth
3. Check token in Headers tab: `Authorization: Bearer {{accessToken}}`

---

### "Forbidden" (403)

**Error:** `{"error": "Insufficient permissions"}`

**Cause:** User doesn't have required permission for this endpoint

**Solution:**

1. Check required permission in endpoint description
2. Run **Check My Permissions** to see what you have
3. Ask admin to assign required role
4. Or test with admin account

---

### "Username already taken"

**Error:** `{"error": "Username already exists"}`

**Solution:**

- Choose a different username
- Usernames must be unique across all users

---

### "Invalid proficiency level"

**Error:** `{"error": "Invalid programming_proficiency value"}`

**Valid values:**

- `beginner`
- `intermediate`
- `advanced`

---

## 🎯 Testing Checklist

### Basic Functionality

- [ ] Health check returns 200
- [ ] Ready check shows database connected
- [ ] Google OAuth initiation works
- [ ] OAuth callback returns token
- [ ] Get my profile returns user data
- [ ] Update profile works with valid data
- [ ] Get user by ID returns public profile

### RBAC

- [ ] New users get default 'user' role
- [ ] Check my permissions returns correct list
- [ ] List all roles returns roles with permissions
- [ ] List all permissions returns all available permissions

### Admin Functions (requires admin role)

- [ ] List all users with pagination
- [ ] Search users by username/email
- [ ] Update user roles successfully
- [ ] Delete user works (use test account!)
- [ ] Create new role with permissions
- [ ] Update role permissions
- [ ] Delete custom role

### Authorization

- [ ] Non-admin cannot access admin endpoints (403)
- [ ] Users can only update own profile
- [ ] Public user profile doesn't expose email
- [ ] Role changes take effect immediately

### Validation

- [ ] Duplicate username rejected
- [ ] Invalid proficiency level rejected
- [ ] Description length limit enforced (1000 chars)
- [ ] Email cannot be changed
- [ ] User ID cannot be changed

---

## 💡 Best Practices

### 1. Use Collection Variables

Always use variables instead of hardcoding:

- ✅ `{{baseUrl}}/v1/users/me`
- ❌ `http://localhost:3001/v1/users/me`

### 2. Save Tokens Automatically

The collection auto-saves tokens from callback:

```javascript
// In Tests tab of callback request
pm.collectionVariables.set('accessToken', response.accessToken);
pm.collectionVariables.set('userId', response.user.id);
```

### 3. Test Order Matters

Correct order:

1. Health checks (no auth)
2. Authentication (get token)
3. Profile operations (use token)
4. Admin operations (admin token required)

### 4. Use Environments

Create different environments:

- **Local** - `http://localhost:3001`
- **Staging** - `https://staging-api.peerprep.com`
- **Production** - `https://api.peerprep.com`

### 5. Check Console for Errors

View **Console** (bottom left) to see:

- Request/response details
- Script execution logs
- Network errors

---

## 🔄 Integration with Other Services

### Collaboration Service Integration

The user service JWT can be used with the collaboration service:

```javascript
// Get token from user service
const userToken = pm.collectionVariables.get('accessToken');

// Use in collaboration service
// Set ENABLE_MOCK_AUTH=false in collab service .env
```

### Question Service Integration

Admin permissions apply to question management:

```javascript
// If user has 'questions:create' permission
POST /v1/questions
Authorization: Bearer {{accessToken}}

// Collaboration service validates with user service
```

---

## 📚 Additional Resources

### Database Schema

See `schema.dbml` for complete database structure:

- `users` table with profile fields
- `roles` table (user, admin, moderator)
- `permissions` table (granular permissions)
- `user_roles` table (many-to-many)
- `role_permissions` table (many-to-many)

### Implementation Guide

See `README.md` for:

- Phase 1: Project scaffolding
- Phase 2: Database schema & Prisma
- Phase 3: API implementation with RBAC
- Phase 4: Testing & containerization

---

## 🎉 Quick Start Checklist

**For developers:**

```
□ Import User-Service-API.postman_collection.json
□ Start user service (pnpm dev)
□ Test health check
□ Set up Google OAuth credentials
□ Test authentication flow
□ Verify profile operations
□ Test RBAC permissions
□ Create admin user in database
□ Test admin endpoints
```

**For QA/Testers:**

```
□ Import collection
□ Verify all endpoints return correct status codes
□ Test with different user roles
□ Verify permission enforcement
□ Test edge cases (invalid data, missing fields)
□ Verify error messages are helpful
□ Test pagination and search
□ Document any bugs found
```

---

## 🚀 Ready to Test!

**Start testing now:**

1. Import `User-Service-API.postman_collection.json`
2. Start user service: `cd apps/user_service && pnpm dev`
3. Run **Health Check**
4. Authenticate via Google OAuth
5. Explore all endpoints!

**Happy testing! 🎊**

---

## 📞 Need Help?

- Check service logs for errors
- Verify database migrations ran
- Ensure environment variables are set
- Check Google OAuth credentials
- Review RBAC permissions in database

**For collaboration service testing:**

- See `apps/collab-service/POSTMAN_GUIDE.md`
