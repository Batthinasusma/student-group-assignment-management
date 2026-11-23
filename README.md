
# Student, Group & Assignment Management System

A full-stack web application that helps students and professors manage groups, assignments, and submissions.

## Project Overview

The Student, Group & Assignment Management System provides a platform where students can join teams, view assignments, and submit their work. Professors can create assignments, allocate them to groups, and review student submissions.

## Technologies Used

### Frontend
- React.js
- Tailwind CSS
- JavaScript
- Lucide React

### Backend
- Node.js
- Express.js
- JWT Authentication
- bcryptjs

### Database
- PostgreSQL

## Main Features

### Student
- Register and log in securely.
- View available teams.
- Create groups.
- Add students to groups using email.
- View assigned assignments.
- Submit assignment links.
- Track submission status.

### Professor
- Register and log in.
- Create assignments.
- Allocate assignments to groups.
- View student submissions.
- Review submitted work through links.

## Project Structure

```text
student-group-assignment-management/
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   └── .env
│
├── frontend-react/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── frontend/
│
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Batthinasusma/student-group-assignment-management.git
cd student-group-assignment-management
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=practice_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=your_secret_key
```

Configure PostgreSQL and create the required database and tables before starting the backend.

Start the backend:

```bash
node server.js
```

The backend runs at:

`http://localhost:5000`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend-react
npm install
npm run dev
```

Open the local URL displayed in your terminal, usually:

`http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register a user |
| POST | /api/auth/login | Login |
| GET | /api/groups | Get groups |
| POST | /api/groups | Create a group |
| POST | /api/groups/:groupId/members | Add a student |
| GET | /api/assignments | Get assignments |
| POST | /api/assignments | Create an assignment |
| POST | /api/assignments/:assignmentId/submit | Submit work |
| GET | /api/assignments/:assignmentId/submissions | View submissions |

## Database Tables

- users
- groups
- group_members
- assignments
- assignment_allocations
- submissions

## Authentication

JSON Web Tokens (JWT) are used for authentication and protected API access. Passwords are hashed using bcryptjs.

## Author

**Batthina Susma**

B.Tech – Computer Science and Engineering

GitHub: https://github.com/Batthinasusma

## Future Enhancements

- Online deployment.
- Assignment file uploads.
- Email notifications.
- Improved role-based access control.
- Docker-based deployment.
