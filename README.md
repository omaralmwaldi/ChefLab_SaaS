# ChefLab

Recipe Management & Kitchen SOP System

## Requirements

* Node.js 22+
* PostgreSQL 17+
* npm

## Installation

### Clone

git clone ...

### Frontend

cd frontend

npm install

npm run dev

Runs on:

http://localhost:5173

### Backend

cd backend

npm install

Copy:

.env.example

to

.env

### Database

Create database:

cheflab

Run:

npx prisma generate

npx prisma migrate dev --name init

### Start Backend

npm run dev

Runs on:

http://localhost:3000

## Technologies

Frontend

* React
* Vite
* React Router
* TanStack Query
* Axios
* React Hook Form
* Zod
* i18next

Backend

* Node.js
* Express
* Prisma
* JWT
* Bcrypt

Database

* PostgreSQL

Storage

* Cloudinary
