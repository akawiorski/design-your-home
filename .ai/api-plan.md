# REST API Plan – Home Inspiration Generator

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Projects | `projects` | User apartment projects (1 default per user in MVP) |
| Room Types | `room_types` | Dictionary of available room types (kitchen, bathroom, etc.) |
| Rooms | `rooms` | Rooms within the user's project |
| Room Photos | `room_photos` | Input photos for rooms (room photos and inspiration photos) |
| Analytics Events | `analytics_events` | Analytics tracking events |

## 2. Endpoints

### 2.2 Projects

#### GET /api/projects

Get user's default project. Auto-creates if doesn't exist (MVP behavior).

**Authentication:** Required (authenticated user)

**Query Parameters:** None

**Response Body:**
```json
{
  "id": "uuid",
  "name": "My Home",
  "createdAt": "2026-01-11T10:00:00Z",
  "updatedAt": "2026-01-11T10:00:00Z"
}
```

**Success Codes:**
- `200 OK` - Project found or created

**Error Codes:**
- `401 Unauthorized` - No valid authentication token
- `500 Internal Server Error` - Server error

---

### 2.3 Room Types

#### GET /api/room-types

List all available room types (dictionary).

**Authentication:** Not required (public)

**Query Parameters:** None

**Response Body:**
```json
{
  "roomTypes": [
    {
      "id": 1,
      "name": "kitchen",
      "displayName": "Kuchnia"
    },
    {
      "id": 2,
      "name": "bathroom",
      "displayName": "Łazienka"
    },
    {
      "id": 3,
      "name": "bedroom",
      "displayName": "Sypialnia"
    },
    {
      "id": 4,
      "name": "living_room",
      "displayName": "Salon"
    }
  ]
}
```

**Success Codes:**
- `200 OK` - Room types retrieved

**Error Codes:**
- `500 Internal Server Error` - Server error

---

### 2.4 Rooms

#### GET /api/rooms

List all rooms in user's default project.

**Authentication:** Required (authenticated user)

**Query Parameters:**
- `includeDeleted` (optional, boolean) - Include soft-deleted rooms. Default: `false`

**Response Body:**
```json
{
  "rooms": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "roomType": {
        "id": 1,
        "name": "kitchen",
        "displayName": "Kuchnia"
      },
      "photoCount": {
        "room": 2,
        "inspiration": 3
      },
      "createdAt": "2026-01-11T10:00:00Z",
      "updatedAt": "2026-01-11T10:00:00Z"
    }
  ]
}
```

**Success Codes:**
- `200 OK` - Rooms retrieved

**Error Codes:**
- `401 Unauthorized` - No valid authentication token
- `500 Internal Server Error` - Server error

---

#### POST /api/rooms

Create a new room in user's default project.

**Authentication:** Required (authenticated user)

**Request Body:**
```json
{
  "roomTypeId": 1
}
```

**Response Body:**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "roomType": {
    "id": 1,
    "name": "kitchen",
    "displayName": "Kuchnia"
  },
  "photoCount": {
    "room": 0,
    "inspiration": 0
  },
  "createdAt": "2026-01-11T10:00:00Z",
  "updatedAt": "2026-01-11T10:00:00Z"
}
```

**Success Codes:**
- `201 Created` - Room created successfully

**Error Codes:**
- `400 Bad Request` - Invalid roomTypeId or validation error
- `401 Unauthorized` - No valid authentication token
- `404 Not Found` - Room type not found
- `500 Internal Server Error` - Server error

**Validation:**
- `roomTypeId` is required and must exist in `room_types` table

---

#### GET /api/rooms/{roomId}

Get details of a specific room.

**Authentication:** Required (authenticated user, must own room)

**Path Parameters:**
- `roomId` (uuid, required) - Room identifier

**Response Body:**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "roomType": {
    "id": 1,
    "name": "kitchen",
    "displayName": "Kuchnia"
  },
  "photoCount": {
    "room": 2,
    "inspiration": 3
  },
  "photos": [
    {
      "id": "uuid",
      "photoType": "room",
      "storagePath": "user_id/room_id/photo_id.jpg",
      "description": "Kitchen view from entrance",
      "createdAt": "2026-01-11T10:00:00Z"
    }
  ],
  "createdAt": "2026-01-11T10:00:00Z",
  "updatedAt": "2026-01-11T10:00:00Z"
}
```

**Success Codes:**
- `200 OK` - Room retrieved

**Error Codes:**
- `401 Unauthorized` - No valid authentication token
- `403 Forbidden` - User does not own this room
- `404 Not Found` - Room not found
- `500 Internal Server Error` - Server error

---

#### DELETE /api/rooms/{roomId}

Soft delete a room.

**Authentication:** Required (authenticated user, must own room)

**Path Parameters:**
- `roomId` (uuid, required) - Room identifier

**Response Body:**
```json
{
  "message": "Room deleted successfully"
}
```

**Success Codes:**
- `200 OK` - Room soft deleted

**Error Codes:**
- `401 Unauthorized` - No valid authentication token
- `403 Forbidden` - User does not own this room
- `404 Not Found` - Room not found
- `500 Internal Server Error` - Server error

---

### 2.5 Room Photos

#### POST /api/rooms/{roomId}/photos/upload-url

Get a presigned URL for uploading a photo to Supabase Storage.

**Authentication:** Required (authenticated user, must own room)

**Path Parameters:**
- `roomId` (uuid, required) - Room identifier

**Request Body:**
```json
{
  "photoType": "room",
  "fileName": "kitchen-photo.jpg",
  "contentType": "image/jpeg"
}
```

**Response Body:**
```json
{
  "uploadUrl": "https://supabase-storage-url/...",
  "storagePath": "user_id/room_id/photo_id.jpg",
  "photoId": "uuid",
  "expiresAt": "2026-01-11T11:00:00Z"
}
```

**Success Codes:**
- `200 OK` - Presigned URL generated

**Error Codes:**
- `400 Bad Request` - Invalid photoType or contentType
- `401 Unauthorized` - No valid authentication token
- `403 Forbidden` - User does not own this room
- `404 Not Found` - Room not found
- `413 Payload Too Large` - Room already has 10 photos (max limit)
- `500 Internal Server Error` - Server error

**Validation:**
- `photoType` must be `'room'` or `'inspiration'`
- `contentType` must be `'image/jpeg'`, `'image/png'`, or `'image/heic'`
- Total photos per room cannot exceed 10

---

#### POST /api/rooms/{roomId}/photos

Create a photo record after successful upload to storage.

**Authentication:** Required (authenticated user, must own room)

**Path Parameters:**
- `roomId` (uuid, required) - Room identifier

**Request Body:**
```json
{
  "photoId": "uuid",
  "storagePath": "user_id/room_id/photo_id.jpg",
  "photoType": "room",
  "description": "Kitchen view from entrance"
}
```

**Response Body:**
```json
{
  "id": "uuid",
  "roomId": "uuid",
  "photoType": "room",
  "storagePath": "user_id/room_id/photo_id.jpg",
  "description": "Kitchen view from entrance",
  "url": "https://storage-url/...",
  "createdAt": "2026-01-11T10:00:00Z"
}
```

**Success Codes:**
- `201 Created` - Photo record created

**Error Codes:**
- `400 Bad Request` - Invalid request body or validation error
- `401 Unauthorized` - No valid authentication token
- `403 Forbidden` - User does not own this room
- `404 Not Found` - Room not found or photoId not found
- `500 Internal Server Error` - Server error

**Validation:**
- `photoId` must match ID from upload-url response
- `storagePath` must match path from upload-url response
- `photoType` must be `'room'` or `'inspiration'`
- `description` is optional, max 500 characters

---

#### GET /api/rooms/{roomId}/photos

List photos for a specific room.

**Authentication:** Required (authenticated user, must own room)

**Path Parameters:**
- `roomId` (uuid, required) - Room identifier

**Query Parameters:**
- `photoType` (optional, enum) - Filter by photo type: `'room'` or `'inspiration'`

**Response Body:**
```json
{
  "photos": [
    {
      "id": "uuid",
      "photoType": "room",
      "storagePath": "user_id/room_id/photo_id.jpg",
      "description": "Kitchen view from entrance",
      "url": "https://storage-url/...",
      "createdAt": "2026-01-11T10:00:00Z"
    }
  ],
  "counts": {
    "room": 2,
    "inspiration": 3,
    "total": 5
  }
}
```

**Success Codes:**
- `200 OK` - Photos retrieved

**Error Codes:**
- `401 Unauthorized` - No valid authentication token
- `403 Forbidden` - User does not own this room
- `404 Not Found` - Room not found
- `500 Internal Server Error` - Server error
### 2.8 Analytics

#### POST /api/analytics/events

Track an analytics event.

**Authentication:** Optional (works for both authenticated and anonymous users)

**Request Body:**
```json
{
  "eventType": "InspirationGenerated",
  "eventData": {
    "roomId": "uuid",
    "roomType": "kitchen",
    "generationDurationMs": 4500
  }
}
```

**Response Body:**
```json
{
  "message": "Event tracked successfully",
  "eventId": "uuid"
}
```

**Success Codes:**
- `201 Created` - Event tracked

**Error Codes:**
- `400 Bad Request` - Invalid event data
- `500 Internal Server Error` - Server error

**Validation:**
- `eventType` is required (string)
- `eventData` is required (object, will be stored as JSONB)

**Supported Event Types:**
- `InspirationGenerated` - When inspiration is generated
- `RoomCreated` - When room is created
- `PhotoUploaded` - When photo is uploaded

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Provider:** Supabase Auth

**Flow:**
1. Client uses Supabase Auth SDK to authenticate users
2. Supported methods:
   - Email + Password
   - Magic Link (email)
   - OAuth providers (Google, GitHub, etc.) - future enhancement
3. Client receives JWT token from Supabase Auth
4. JWT token sent in `Authorization` header: `Bearer <token>`

**Token Structure:**
- Standard JWT with claims including `sub` (user ID)
- Validated by Supabase on each request
- Contains user metadata and role

### 3.2 Authorization Strategy

**Row Level Security (RLS):**
- Enforced at database level via Supabase
- All tables have RLS enabled (see migration file)
- No policies defined in migration - all access via service_role key

**API Authorization:**
- API uses Supabase service_role key for database operations
- API validates JWT token and extracts user ID
- All queries filtered by user ID from token
- Ownership checks for room-based operations

**Access Control:**
- **Public (no auth):**
  - GET /api/room-types
  - POST /api/rooms/{roomId}/generate
  
- **Authenticated:**
  - All project, room, and photo operations
  - User can only access their own resources

### 3.3 Service Role Key Usage

**Purpose:** Backend API uses service_role key to bypass RLS and implement custom authorization logic

**Security:**
- Service role key stored in environment variables (server-side only)
- Never exposed to client
- API implements authorization checks before database operations

**Implementation:**
```typescript
// Example authorization check
async function validateRoomOwnership(roomId: string, userId: string) {
  const room = await supabase
    .from('rooms')
    .select('project_id, projects!inner(user_id)')
    .eq('id', roomId)
    .single();
  
  if (room.data?.projects.user_id !== userId) {
    throw new ForbiddenError('Access denied');
  }
}
```

---

## 4. Validation and Business Logic

### 4.1 Validation Rules

#### Projects
- `name`: string, max 100 characters, default "My Home"
- Auto-create default project on first access

#### Rooms
- `roomTypeId`: required, must exist in `room_types` table
- One default project per user (MVP)
- Soft delete via `deleted_at`

#### Room Photos
- `photoType`: required, enum `['room', 'inspiration']`
- `contentType`: required, must be `image/jpeg`, `image/png`, or `image/heic`
- `description`: optional, max 500 characters
- Maximum 10 photos per room (enforced in upload-url endpoint)
- File size limit: 10MB per file (enforced at storage level)

#### Inspiration Generation
- Requires minimum 1 room photo + 2 inspiration photos
- `bulletPoints`: array of strings, 3-6 items recommended
- Generates exactly 2 images per inspiration (position 1 and 2)
- Images: 1080×720 px, JPEG format

#### Analytics Events
- `eventType`: required, string
- `eventData`: required, valid JSON object
- `userId`: optional (null for anonymous)

### 4.2 Business Logic Implementation

#### BL-1: Default Project Management
**PRD Reference:** Section 3.2 - "Application has one default project"

**Logic:**
- On first GET /api/projects, auto-create project if doesn't exist
- Project named "My Home" by default
- All rooms created in this default project
- No multi-project support in MVP

**Implementation:**
```typescript
async function getOrCreateDefaultProject(userId: string) {
  let project = await getProject(userId);
  if (!project) {
    project = await createProject(userId, { name: "My Home" });
  }
  return project;
}
```

---

#### BL-2: Photo Upload Validation
**PRD Reference:** Section 3.4 - "Minimum 1 room photo, 2 inspiration photos"

**Logic:**
- Validate before allowing generation
- Check counts in generate endpoint
- Provide clear error messages for missing photos

**Implementation:**
```typescript
async function validatePhotoRequirements(roomId: string) {
  const photos = await getRoomPhotos(roomId);
  const roomCount = photos.filter(p => p.photoType === 'room').length;
  const inspirationCount = photos.filter(p => p.photoType === 'inspiration').length;
  
  if (roomCount < 1) {
    throw new ValidationError('At least 1 room photo required');
  }
  if (inspirationCount < 2) {
    throw new ValidationError('At least 2 inspiration photos required');
  }
}
```

---

#### BL-3: Inspiration Generation
**PRD Reference:** Section 3.5 - "2 images per variant, bullet points"

**Logic:**
1. Validate photo requirements
2. Prepare prompt with room context
3. Call OpenRouter AI service
4. Parse response (2 images + bullet points)
5. Upload images to Supabase Storage
6. Return complete inspiration with signed URLs (no Postgres persistence in MVP)

**AI Integration:**
- Service: OpenRouter.ai
- Model: To be configured (e.g., GPT-4 Vision, Claude, etc.)
- Input: Room photos + inspiration photos + optional user prompt
- Output: 2 generated images (1080×720) + 4-6 bullet points

**Error Handling:**
- AI service timeout: 30 seconds
- Rate limiting: Respect OpenRouter limits
- Fallback: Queue for async processing if needed (future)

---

### 4.3 Error Handling

**Standard Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Room must have at least 1 room photo and 2 inspiration photos",
    "details": {
      "roomPhotos": 0,
      "inspirationPhotos": 1,
      "required": {
        "roomPhotos": 1,
        "inspirationPhotos": 2
      }
    }
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - Authentication required
- `FORBIDDEN` - Access denied (ownership check)
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Duplicate resource
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `PAYMENT_REQUIRED` - LLM credits exhausted
- `SERVICE_UNAVAILABLE` - External service down
- `INTERNAL_ERROR` - Server error

---

### 4.4 Rate Limiting

**Strategy:**
- Per-user rate limiting for authenticated users
- Per-IP rate limiting for anonymous users
- Generous limits for MVP, can tighten based on usage

**Limits (MVP):**
- Generate inspirations: 20 per hour per user
- Upload photos: 30 per hour per user
- General API: 300 requests per hour per user

**Implementation:**
- Use middleware (e.g., express-rate-limit)
- Store in Redis or in-memory for MVP
- Return 429 with Retry-After header

---


## 5. API Versioning

**Strategy:** URL path versioning

**Current Version:** v1 (implicit, no version in path for MVP)

**Future Versioning:**
- Breaking changes: `/api/v2/...`
- Current version remains available during transition
- Deprecation notices in response headers

---

## 6. CORS Configuration

**Allowed Origins:**
- Development: `http://localhost:4321` (Astro dev server)
- Production: `https://yourdomain.com`

**Allowed Methods:**
- GET, POST, PATCH, DELETE, OPTIONS

**Allowed Headers:**
- Authorization, Content-Type

**Credentials:**
- Enabled (for cookies if using session-based auth)

---

## 7. Performance Considerations

### 7.1 Caching

**Room Types:**
- Cache room types list (rarely changes)
- Cache-Control: `public, max-age=3600`

**Signed URLs:**
- Short-lived (1 hour expiry)
- No caching

**User Resources:**
- Cache-Control: `private, no-cache` (force revalidation)

### 7.2 Database Optimization

**Indexes:**
- Already defined in migration (see db-plan.md Section 3)
- Partial indexes for soft delete performance
- Composite indexes for common queries

**Query Optimization:**
- Use `select()` with specific columns
- Limit joined data depth
- Pagination to avoid large result sets

### 7.3 Storage Optimization

**Image Delivery:**
- Use Supabase Storage signed URLs
- Consider CDN for generated images (future)
- Thumbnail generation for gallery view (future)

---

## 8. Monitoring and Logging

**Logging Strategy:**
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Include request ID, user ID, timestamp

**Metrics to Track:**
- Request latency (p50, p95, p99)
- Error rates by endpoint
- AI generation success rate
- Storage usage per user
- Analytics events volume

**Monitoring Tools:**
- Application: Astro/Node.js built-in logging
- Database: Supabase dashboard
- Alerts: Email/Slack for critical errors

---

## 9. Implementation Notes

### 9.1 Tech Stack Integration

**Astro:**
- API routes in `src/pages/api/`
- Server-side rendering for initial page load
- Client-side React for interactive features

**Supabase:**
- Service role key for server-side operations
- Client SDK for direct operations (optional)
- Storage for photos and generated images

**TypeScript:**
- Strong typing for API requests/responses
- Shared types between frontend and backend
- Auto-generated types from Supabase schema

**OpenRouter:**
- API key stored in environment variables
- Rate limiting and error handling
- Cost tracking per generation

### 9.2 Deployment

**Environment Variables:**
```env
# Supabase
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenRouter
OPENROUTER_API_KEY=xxx

# App
NODE_ENV=production
API_BASE_URL=https://api.yourdomain.com
```

**Build Process:**
1. TypeScript compilation
2. Astro build
3. Deploy to DigitalOcean
4. Environment variables configured in platform

---

## 10. Future Enhancements

**Planned Features (Post-MVP):**
1. Async generation with webhooks
2. Multi-project support
3. Room photo editing/cropping
4. Inspiration sharing (public links)
5. Advanced filtering and search
6. Batch operations
7. GraphQL endpoint (alternative to REST)
8. Webhooks for external integrations

---

## Appendix: Example Workflows

### Workflow 1: New User Generates First Inspiration

1. **User visits app (anonymous)**
2. **Create room:** `POST /api/rooms` → 401 Unauthorized
3. **User signs up/logs in** via Supabase Auth
4. **Get default project:** `GET /api/projects` → Auto-created
5. **Create room:** `POST /api/rooms` with `roomTypeId: 1`
6. **Get upload URLs:** `POST /api/rooms/{roomId}/photos/upload-url` × 3 times
7. **Upload photos** directly to Supabase Storage
8. **Create photo records:** `POST /api/rooms/{roomId}/photos` × 3 times
9. **Generate inspiration:** `POST /api/rooms/{roomId}/generate`
10. **View result:** Inspiration with 2 images + bullet points

### Workflow 2: Anonymous User

1. **User visits app (anonymous)**
2. **Browse room types:** `GET /api/room-types` ✅ Works
3. **Attempt to create room:** `POST /api/rooms` → 401 Unauthorized
4. **Prompt to log in/sign up**
5. **After auth, continue with room creation**

---

**End of API Plan**
