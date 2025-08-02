# 📦 Parcel Delivery API

A role-based parcel delivery management API built with **Node.js**, **Express.js**, **TypeScript**, and **MongoDB** using **Mongoose**. This is Assignment 5 of Programming Hero's Level 2 course.

---

## 👥 Roles & Permissions

| Role     | Permissions                                                                 |
|----------|------------------------------------------------------------------------------|
| Admin    | Manage users and parcels, update parcel statuses                             |
| Sender   | Create parcels, view own parcels, cancel if not dispatched                   |
| Receiver | View parcels addressed to them, confirm delivery                             |

---

## 🚀 Features

✅ JWT-based Authentication & Authorization  
✅ Role-based access control (Admin, Sender, Receiver)  
✅ Parcel lifecycle tracking (status logs)  
✅ Cancel parcels before dispatched  
✅ Confirm delivery by receiver  
✅ Modular folder structure  
✅ Request validation & error handling  
✅ MongoDB with Mongoose ODM


### 🔐 Authentication & Authorization
JWT-based authentication system

Three user roles: admin, sender, and receiver

Role-based access control for all sensitive routes

### 👤 User Management
Sender and Receiver registration

Admin can view, update, or delete any user

User can update their own password

Admin can change any user’s password securely

### 📦 Parcel Management
Senders can create parcels

Parcels include full delivery info with cost, weight, destination, etc.
Parcels track current status with a log (PENDING → APPROVED → DISPATCHED → IN_TRANSIT → DELIVERED → CONFIRMED)

Only sender or admin can delete a parcel

### 📝 Status Logs
Every parcel has a statusLogs array embedded

Each status update stores timestamp and updated-by info

Admins can change status step-by-step

### 🔎 Parcel Tracking
Public tracking endpoint using trackingId

No authentication required for tracking

### 📜 Delivery History
Sender and Receiver can view their parcel history

Filtered by current status (DELIVERED, CONFIRMED, etc.)

### ⚙️ Technical Highlights
Built with Node.js, Express.js, TypeScript, and MongoDB

Mongoose for ODM with schema validation

Modular architecture (routes, services, controllers, etc.)

Centralized error handling with custom AppError

Zod for request body validation

Environment variable support using .env

### 🛡️ Security
Passwords are hashed using bcrypt

Sensitive routes are protected using access tokens

Proper error messages and status codes

---

## 🧩 Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB + Mongoose
- Zod (Validation)
- JWT
- bcrypt
- dotenv

---

## 📁 Project Structure

```
└── 📁src
    └── 📁app
        └── 📁config
            ├── env.ts
            ├── passport.ts
        └── 📁errorHelpers
            ├── AppError.ts
        └── 📁helpers
            ├── handleCastError.ts
            ├── handleDuplicateError.ts
            ├── handlerValidationError.ts
            ├── handlerZodError.ts
        └── 📁interfaces
            ├── error.types.ts
            ├── index.d.ts
        └── 📁middlewares
            ├── checkAuth.ts
            ├── globalErrorHandler.ts
            ├── notFound.ts
            ├── validateRequest.ts
        └── 📁modules
            └── 📁auth
                ├── auth.controller.ts
                ├── auth.route.ts
                ├── auth.service.ts
            └── 📁parcel
                ├── parcel.controller.ts
                ├── parcel.interface.ts
                ├── parcel.model.ts
                ├── parcel.route.ts
                ├── parcel.service.ts
                ├── parcel.validation.ts
            └── 📁user
                ├── user.controller.ts
                ├── user.interface.ts
                ├── user.model.ts
                ├── user.route.ts
                ├── user.service.ts
                ├── user.validation.ts
        └── 📁routes
            ├── index.ts
        └── 📁utils
            └── 📁templates
                ├── forgetPassword.ejs
            ├── catchAsync.ts
            ├── createAdmin.ts
            ├── createTokens.ts
            ├── jwt.ts
            ├── QueryBuilder.ts
            ├── sendMail.ts
            ├── sendResponse.ts
            ├── setCookie.ts
        ├── constants.ts
    ├── app.ts
    └── server.ts
```


---

## 🛠️ API Endpoints

```bash
http://localhost:5000/api/v1

```

### 🔐 Auth Routes

```bash
http://localhost:5000/api/v1/auth

```
---

| **Method** | **URL**            | **Access**                          | **Description**                                   | **Request Body / Params**         |
| ---------- | ------------------ | ----------------------------------- | ------------------------------------------------- | --------------------------------- |
| POST       | `/login`           | Public                              | User login with credentials                       | `{name, email, password }`             |
| POST       | `/refresh-token`   | Public                              | Generate new access token using refresh token     | `{ refreshToken }`                |
| POST       | `/logout`          | All roles (Sender, Receiver, Admin) | Logout user by invalidating tokens                | None                              |
| POST       | `/change-password` | All roles                           | Change current password                           | `{ oldPassword, newPassword }`    |
| POST       | `/set-password`    | All roles                           | Set new password (after registration or reset)    | `{ newPassword }`                 |
| POST       | `/forgot-password` | All roles                           | Initiate password reset (send reset link )        | `{ email }`                       |
| POST       | `/reset-password`  | All roles                           | Reset password with token/code                    | `{ id, token, newPassword }`     |
| GET        | `/me`              | All roles                           | Get authenticated user's details                  | None                              |
| GET        | `/google`          | Public                              | Redirect to Google OAuth login page               | `redirect` (optional query param) |
| GET        | `/google/callback` | Public                              | Process Google OAuth login callback               | Redirects on failure to `/login`  |

---
### 👤 User Routes

```bash
http://localhost:5000/api/v1/user

```

| **Method** | **URL**               | **Access**               | **Description**                                       | **Request Body / Params**                                |
| ---------- | --------------------- | ------------------------ | ----------------------------------------------------- | -------------------------------------------------------- |
| POST       | `/register`           | Public                   | Create a new user                                     | Body validated by `createUserZodSchema`                  |
| PATCH      | `/update-profile/:id` | Authenticated (Any Role) | Update profile for any user                           | URL param: `id`, body validated by `updateUserZodSchema` |
| PATCH      | `/:id`                | Admin only               | Admin updates any user's info                         | URL param: `id`, body validated by `updateUserZodSchema` |
| GET        | `/all-users`          | Admin only               | Get list of all users with pagination and role filter | None                                                     |

---
### 📦 Parcel Routes

```bash
http://localhost:5000/api/v1/parcels

```

| **Method** | **URL**                     | **Access**                              | **Description**                        | **Request Body / Params**                                   |
| ---------- | --------------------------- | --------------------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| POST       | `/create`                   | Authenticated (only Sender)             | Parcel create (only sender allowed)    | Validated by `createParcelZodSchema`                        |
| GET        | `/get-parcel/:id`           | Authenticated (Sender, Receiver, Admin) | Get single parcel by ID                | URL param: `id`                                             |
| GET        | `/`                         | Authenticated (Sender, Receiver, Admin) | Get all parcels with role-based filter | Query params for pagination/filtering possible              |
| GET        | `/incoming-parcels`         | Authenticated (Receiver only)           | Parcels pending delivery for receiver  | None                                                        |
| GET        | `/get-delivery-history`     | Authenticated (Sender, Receiver)        | Get parcel delivery history            | None                                                        |
| PATCH      | `/confirm-delivery/:id`     | Authenticated (Receiver only)           | Confirm parcel delivery                | URL param: `id`                                             |
| PATCH      | `/update/:id`               | Authenticated (Sender only)             | Update parcel details                  | URL param: `id`, validated by `updateParcelZodSchema`       |
| PATCH      | `/cancel/:id`               | Authenticated (Sender and others)       | Cancel a parcel                        | URL param: `id`                                             |
| PATCH      | `/update-parcel-status/:id` | Authenticated (Admin only)              | Update parcel status                   | URL param: `id`, validated by `updateParcelStatusZodSchema` |
| PATCH      | `/delete/:id`               | Authenticated (Admin, Sender)           | Soft delete parcel                     | URL param: `id`                                             |
| GET        | `/track/:trackingId`        | Public (No Auth)                        | Track parcel status by tracking ID     | URL param: `trackingId`                                     |


---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/parcel-delivery-api.git
cd parcel-delivery-api

```

### 2. Install dependencies

```bash
npm install
```
### 3. Set up .env

```bash
PORT="5000"
DB_URL=your_mongodb_uri

NODE_ENV="development"

# jwt 

JWT_ACCESS_SECRET=your_jwt_secret
JWT_ACCESS_EXPIRES='1d'
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_REFRESH_EXPIRES='30d'

# acryptjs

BCRYPT_SALT_ROUND='10'



#  admin details
ADMIN_EMAIL=your_admin_email
ADMIN_PASSWORD=your_password
ADMIN_NAME=your_name


# google auth
GOOGLE_CLIENT_SECRET=google_client_secret
GOOGLE_CLIENT_ID=google_client_id
GOOGLE_CALLBACK_URL=google_callback_url

# express session
EXPRESS_SESSION=express_session

# frontend url
FRONTEND_URL=your_frontend_url


# email
SMTP_USER=smtp_user_email
SMTP_PASS=password
SMTP_HOST=host
SMTP_PORT='465'
SMTP_FROM=smtp_from_email


```

### 4 🧪 Testing

```bash
npm run dev
```

📄 API Response Format
All API responses follow a consistent format:

```bash
{
  "statusCode": 200,
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

# 📦 Deployment

```bash
npm run build
```
---




# 📧 Author Ibrahim Sarkar

# 📧 Email: ibrahimsarkar.dev@gmail.com