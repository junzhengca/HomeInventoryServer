# Home Inventory Server

A RESTful API server for managing home inventory data with user authentication, image uploads, and data synchronization capabilities.

## Features

- **User Authentication**: JWT-based authentication with signup and login
- **User Management**: Get current user info and update user profile (including avatar)
- **Image Upload**: Upload images with support for:
  - Multipart form data
  - Base64 encoded images
  - Optional image resizing
- **Data Synchronization**: Sync inventory data across devices for:
  - Categories
  - Locations
  - Inventory Items
  - Todo Items
  - Settings
- **Cloud Storage**: Images stored on Backblaze B2 (S3-compatible)

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Backblaze B2 (S3-compatible API)
- **Image Processing**: Sharp
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js 20+ (LTS recommended)
- MongoDB database (local or cloud instance)
- Backblaze B2 account (for image storage)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd HomeInventoryServer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/home-inventory
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
AWS_ACCESS_KEY_ID=your-b2-access-key-id
AWS_SECRET_ACCESS_KEY=your-b2-secret-access-key
B2_S3_ENDPOINT=https://s3.us-west-000.backblazeb2.com
B2_BUCKET_NAME=your-bucket-name
```

4. Build the TypeScript code:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

For development with hot-reload:
```bash
npm run dev
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `3000` |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT token signing | Yes | `"your-super-secret-jwt-key"` |
| `AWS_ACCESS_KEY_ID` | Backblaze B2 access key ID | Yes | - |
| `AWS_SECRET_ACCESS_KEY` | Backblaze B2 secret access key | Yes | - |
| `B2_S3_ENDPOINT` | Backblaze B2 S3-compatible endpoint | Yes | - |
| `B2_BUCKET_NAME` | Backblaze B2 bucket name | Yes | - |

## Running with Docker

### Build the Docker image:
```bash
docker build -t home-inventory-server .
```

### Run the container:
```bash
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-jwt-secret" \
  -e AWS_ACCESS_KEY_ID="your-access-key" \
  -e AWS_SECRET_ACCESS_KEY="your-secret-key" \
  -e B2_S3_ENDPOINT="your-b2-endpoint" \
  -e B2_BUCKET_NAME="your-bucket-name" \
  home-inventory-server
```

### Or use an environment file:
```bash
docker run -p 3000:3000 --env-file .env home-inventory-server
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create a new user account
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ accessToken, user: { id, email } }`

- `POST /api/auth/login` - Login with email and password
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ accessToken, user: { id, email } }`

- `GET /api/auth/me` - Get current user (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ id, email, avatarUrl }`

- `PATCH /api/auth/me` - Update current user (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "avatarUrl": "https://..." }` or `{ "password": "newpassword" }`

### Images

- `POST /api/images/upload` - Upload an image (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Supports two formats:
    - **Multipart form data**: `Content-Type: multipart/form-data` with field `image`
    - **Base64 JSON**: `Content-Type: application/json` with body `{ "image": "data:image/png;base64,..." }`
  - Query parameter: `?resize=WIDTH` (optional, width in pixels)
  - Returns: `{ url: "https://..." }`

### Synchronization

- `GET /api/sync/:fileType/pull` - Pull sync data for a file type (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - File types: `categories`, `locations`, `inventoryItems`, `todoItems`, `settings`
  - Returns: `{ data: {...}, lastModified: "..." }`

- `POST /api/sync/:fileType/push` - Push sync data for a file type (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ data: {...} }`
  - Returns: `{ success: true, lastModified: "..." }`

- `GET /api/sync/status` - Get sync status for all file types (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ [fileType]: { lastModified: "..." } }`

- `DELETE /api/sync/:fileType/data` - Delete sync data for a file type (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ success: true }`

## Development

### Project Structure

```
src/
├── controllers/     # Request handlers
├── middleware/      # Express middleware (auth, upload)
├── models/          # Mongoose models
├── routes/          # API route definitions
├── services/        # External service integrations (B2)
├── types/           # TypeScript type definitions
└── utils/           # Utility functions (JWT)
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production server
- `npm run dev` - Start development server with hot-reload
- `npm run fix-sync-indexes` - Fix MongoDB indexes for sync data

### Testing

The API can be tested using the Bruno collection in the `bruno/` directory.

## License

ISC

