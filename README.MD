# Tahari Foods E-Commerce API

A comprehensive **e-commerce platform for fresh farm products**, featuring **advanced subscription management, wallet system, real-time messaging, and multi-payment gateway integration**.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Project Installation & Setup](#project-installation--setup)
- [Api Endpoints](#api-endpoints)

<a id="overview"></a>

## Overview <span style="float:right"><a href="#table-of-contents">⇧</a></span>

- **Multi-Payment Gateway**: Wallet, SSLCommerz, Cash on Delivery (COD)
- **Smart Subscription System**: Weekly/Monthly plans with auto-pause on insufficient funds
- **Real-time Messaging**: Customer support with live chat
- **Wallet Management**: Digital wallet with transaction history
- **Pre-order System**: Schedule deliveries for future availability
- **Advanced Admin Panel**: Complete management system
- **Inventory Tracking**: Real-time stock management with farmer integration
- **Notification System**: Real-time alerts and updates

---

<a id="architecture"></a>

## Architecture <span style="float:right"><a href="#table-of-contents">⇧</a></span>

### Tech Stack

- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Payment**: SSLCommerz Integration
- **Real-time**: WebSocket(Socket.io) for messaging
- **Storage**: Cloud-based Amazon S3 bucket for image storage

### Database Schema Overview

- **Users & Roles**: Multi-role system (Admin, Customer, Support)
- **Products**: Categories, inventory, pricing, and farmer relations
- **Orders**: Regular, subscription, and pre-order management
- **Payments**: Multi-gateway transaction handling
- **Subscriptions**: Automated delivery scheduling
- **Communications**: Real-time messaging and notifications

---

<a id="project-structure"></a>

## Project Structure <span style="float:right"><a href="#table-of-contents">⇧</a></span>

```bash
└─ farmer-app-server
├── prisma
│ ├── schema.prisma
│ ├── seed.ts
│
├── src
│ ├── config
│ │ └── envConfig.ts
│ │
│ ├── jobs
│ │ ├── index.ts
│ │ └── subscription.job.ts
│ │
│ ├── middlewares
│ │ ├── auth.ts
│ │ ├── errorHandler.ts
│ │ ├── logger.ts
│ │ ├── rateLimiter.ts
│ │ └── validator.ts
│ │
│ ├── modules
│ │ ├── categories
│ │ │ ├── categories.interface.ts
│ │ │ ├── category.controller.ts
│ │ │ ├── category.dto.ts
│ │ │ ├── category.routes.ts
│ │ │ └── category.service.ts
│ │ │
│ │ └── customers
│ │ ├── customer.controller.ts
│ │ ├── customer.dto.ts
│ │ ├── customer.interface.ts
│ │ ├── customer.routes.ts
│ │ └── customer.service.ts
│ │
│ ├── prisma-client
│ │ └── prismaClient.ts
│ │
│ ├── types
│ │ └── express
│ │ └── index.d.ts
│ │
│ ├── utils
│ │ ├── asyncHandler.ts
│ │ ├── errorHandler.ts
│ │ ├── logger.ts
│ │ ├── sendNotification.ts
│ │ └── sendResponse.ts
│ │
│ ├── app.ts
│ └── index.ts
│
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

<a id="project-installation--setup"></a>

## Project Installation & Setup <span style="float:right"><a href="#table-of-contents">⇧</a></span>

### 1. Clone the Repository

```
git clone https://github.com/kashem76/farmerAppApi.git .
```

### 2. Install Dependencies

```
npm install
```

### 3. Generate the Prisma client

```
npx prisma generate
```

### 4. Seed the database:

```
npm run seed
```

### 5. Setup Environment Variables

```
PORT=4000
SERVER_URL=
CLIENT_URL=
NODE_ENV=development
JWT_SECRET=
DATABASE_URL=
DIRECT_URL=
SMS_API_URL=
SMS_API_KEY=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME=
AWS_PRIVATE_BUCKET_NAME=
NEXT_PUBLIC_MAX_FILE_SIZE_MB=
PRESIGNED_URL_EXPIRES_IN=300
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWD=
```

### 6. Run the Server

```
npm run dev
```

<a id="api-endpoints"></a>

## API Endpoints - <span style="float:right"><a href="#table-of-contents">⇧</a></span>

```
Base URL: http://localhost:4000/api
Example: http://localhost:4000/api/products
```

### Authentication

#### **Register a new user**

`POST /api/auth/register`

**Request Body**

```json
{
  "name": "John Doe",
  "phone": "+8801234567890",
  "email": "john@example.com",
  "address": ["123 Main St, Dhaka"],
  "role": "CUSTOMER"
}
```
