# Auth System API Documentation

This NestJS application provides a complete authentication system with JWT tokens, user management, and role-based access control.

## Features

- User registration and login
- JWT-based authentication
- Password reset functionality
- Role-based authorization (User, Guide, Lead-Guide, Admin)
- Password hashing with bcrypt
- Input validation
- Rate limiting
- Security headers with Helmet
- MongoDB integration with Mongoose

## API Endpoints

### Authentication Routes

#### 1. Sign Up

- **POST** `/api/v1/auth/signup`
- **Description**: Register a new user
- **Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirm": "password123",
  "role": "user" // optional, defaults to "user"
}
```

- **Response**:

```json
{
  "status": "success",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "active": true,
    "createdAt": "2023-...",
    "updatedAt": "2023-..."
  }
}
```

#### 2. Login

- **POST** `/api/v1/auth/login`
- **Description**: Authenticate user and get JWT token
- **Body**:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

- **Response**:

```json
{
  "status": "success",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### 3. Forgot Password

- **POST** `/api/v1/auth/forgot-password`
- **Description**: Request password reset token
- **Body**:

```json
{
  "email": "john@example.com"
}
```

- **Response**:

```json
{
  "status": "success",
  "message": "Token sent to email! (Check console for development)"
}
```

#### 4. Reset Password

- **PATCH** `/api/v1/auth/reset-password/:token`
- **Description**: Reset password using token
- **Body**:

```json
{
  "password": "newpassword123",
  "passwordConfirm": "newpassword123"
}
```

- **Response**:

```json
{
  "status": "success",
  "token": "new_jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### 5. Update Password

- **PATCH** `/api/v1/auth/update-password`
- **Description**: Update password for authenticated user
- **Headers**: `Authorization: Bearer jwt_token_here`
- **Body**:

```json
{
  "password": "currentpassword123",
  "newPassword": "newpassword123",
  "newPasswordConfirm": "newpassword123"
}
```

- **Response**:

```json
{
  "status": "success",
  "token": "new_jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### User Routes

#### 1. Get All Users (Admin Only)

- **GET** `/api/v1/users`
- **Description**: Get all users
- **Headers**: `Authorization: Bearer jwt_token_here`
- **Required Role**: Admin

#### 2. Get Current User

- **GET** `/api/v1/users/me`
- **Description**: Get current user's profile
- **Headers**: `Authorization: Bearer jwt_token_here`

#### 3. Update Current User

- **PATCH** `/api/v1/users/me`
- **Description**: Update current user's profile (name, email, photo only)
- **Headers**: `Authorization: Bearer jwt_token_here`
- **Body**:

```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

#### 4. Deactivate Current User

- **DELETE** `/api/v1/users/me`
- **Description**: Deactivate current user's account
- **Headers**: `Authorization: Bearer jwt_token_here`

#### 5. Get User by ID (Admin Only)

- **GET** `/api/v1/users/:id`
- **Description**: Get specific user by ID
- **Headers**: `Authorization: Bearer jwt_token_here`
- **Required Role**: Admin

#### 6. Update User (Admin Only)

- **PATCH** `/api/v1/users/:id`
- **Description**: Update any user (Admin only)
- **Headers**: `Authorization: Bearer jwt_token_here`
- **Required Role**: Admin

#### 7. Delete User (Admin Only)

- **DELETE** `/api/v1/users/:id`
- **Description**: Delete user permanently
- **Headers**: `Authorization: Bearer jwt_token_here`
- **Required Role**: Admin

## User Roles

1. **user** - Default role for regular users
2. **guide** - Tour guide role
3. **lead-guide** - Lead tour guide role
4. **admin** - Administrator with full access

## Environment Variables

Create a `config.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000

# Database
DB_CONNECTION=mongodb+srv://username:password@cluster.mongodb.net/
DB_LOCAL=mongodb://localhost:27017/auth-system

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=10d
JWT_COOKIE_EXPIRES_IN=90

# Email (for development - using Mailtrap)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USERNAME=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000
```

## Security Features

1. **Password Hashing**: Uses bcrypt with salt rounds of 12
2. **JWT Authentication**: Secure token-based authentication
3. **Rate Limiting**: 100 requests per minute per IP
4. **Input Validation**: Comprehensive validation using class-validator
5. **Security Headers**: Helmet middleware for security headers
6. **CORS**: Configured for cross-origin requests
7. **Password Complexity**: Minimum 8 characters required

## Error Handling

The API returns consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create `config.env` file with your environment variables

3. Start the development server:

```bash
npm run start:dev
```

4. The API will be available at `http://localhost:3000/api/v1`

## Testing with Postman or curl

### Example: Sign up a new user

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "passwordConfirm": "password123"
  }'
```

### Example: Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Example: Get current user profile

```bash
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
