# MediCare Solution

**Hospital Appointment Management System**

MediCare Solution is our OFPPT graduation project, developed to simplify hospital appointment management and improve coordination between patients, doctors, and administrators.

## About the Project

The platform addresses common challenges in public hospitals, including poor appointment organization, long waiting times, and limited visibility into doctors' schedules.

## Key Features

- **Patient Management:** Book, view, and cancel medical appointments online.
- **Doctor Management:** View and manage daily appointment schedules.
- **Admin Dashboard:** Manage patients, doctors, and appointments.
- **Appointment Management:** Organize and track hospital appointments.

## Tech Stack

**Frontend**
- React.js

**Backend**
- PHP
- Laravel

**Database**
- SQL

## Project Structure

```text
MediCare-Solution/
├── backend/       # Laravel application
├── frontend/      # React application
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ouissaal/MediCare-Solution.git
cd MediCare-Solution
```

### 2. Backend Setup

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Configure your MySQL database credentials in `.env`, then run:

```bash
php artisan migrate
php artisan serve
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Project Purpose

Our goal is to provide a simple and intuitive digital solution that improves hospital organization, reduces waiting times, and makes appointment management easier for everyone.

