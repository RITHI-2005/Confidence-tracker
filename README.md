# Student Learning Confidence Evolution Tracker

A production-ready MERN stack web application that tracks student confidence, learning progress, and provides analytics, recommendations, and reports.

## Features

- **User Authentication**: JWT-based login/signup with role-based access (Student, Teacher, Admin)
- **Confidence Tracking**: Rate confidence (1-5) after each topic/session
- **Activity Logging**: Record topics, assignments, quizzes, study hours
- **Goals & Progress**: Short-term and long-term goals with progress tracking
- **Reflection**: Mood, difficulty, and self-assessment after learning
- **Analytics Dashboard**: Confidence vs performance, weak/strong topics, trends
- **Teacher Module**: View students, detect struggling learners, add feedback
- **Reports**: Weekly, monthly, confidence evolution; Export to PDF & Excel
- **Notifications**: Low confidence alerts, goal completion

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT
- **Frontend**: React (Vite), Tailwind CSS, Recharts, Axios
- **Architecture**: REST API, MVC

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd confidencetracker-pro
npm install
cd backend && npm install
cd ../frontend && npm install
```

Or use the root script:

```bash
npm run install:all
```

### 2. Configure Environment

Copy the backend environment file and update if needed:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/confidencetracker
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
```

For MongoDB Atlas, set `MONGODB_URI` to your connection string.

### 3. Seed Database (Optional)

Create sample topics and demo users:

```bash
cd backend
npm run seed
```

Demo accounts:
- **Admin**: admin@test.com / admin123
- **Teacher**: teacher@test.com / teacher123
- **Student**: student@test.com / student123

### 4. Run the Application

**Option A – Run both together:**

```bash
npm run dev
```

**Option B – Run separately:**

Terminal 1 (backend):
```bash
cd backend
npm run dev
```

Terminal 2 (frontend):
```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Folder Structure

```
confidencetracker-pro/
├── backend/
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Topic.js
│   │   ├── ConfidenceLog.js
│   │   ├── Activity.js
│   │   ├── Reflection.js
│   │   ├── Goal.js
│   │   ├── Notification.js
│   │   ├── Achievement.js
│   │   └── Feedback.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── confidence.js
│   │   ├── activity.js
│   │   ├── goals.js
│   │   ├── reflection.js
│   │   ├── teacher.js
│   │   ├── report.js
│   │   ├── topics.js
│   │   └── notifications.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── seed.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/user/profile | Get profile |
| PUT | /api/user/profile | Update profile |
| POST | /api/confidence/add | Add confidence log |
| GET | /api/confidence/user/:id | Get user confidence logs |
| POST | /api/activity/add | Add activity |
| GET | /api/activity/user/:id | Get user activities |
| POST | /api/goals/add | Add goal |
| GET | /api/goals/user/:id | Get user goals |
| PUT | /api/goals/:id | Update goal |
| POST | /api/reflection/add | Add reflection |
| GET | /api/reflection/user/:id | Get reflections |
| GET | /api/teacher/students | List students (teacher) |
| GET | /api/teacher/student/:id | Student detail (teacher) |
| POST | /api/teacher/feedback | Add feedback (teacher) |
| GET | /api/report/weekly/:id | Weekly report |
| GET | /api/report/monthly/:id | Monthly report |
| GET | /api/report/confidence-evolution/:id | Confidence evolution |
| GET | /api/report/export/excel/:id | Export Excel |
| GET | /api/report/export/pdf/:id | Export PDF |

## Database Collections

- **Users** – name, email, password, role, learningGoals
- **Topics** – name, subject (pre-seeded)
- **ConfidenceLogs** – userId, topicId, confidenceLevel, date
- **Activities** – userId, type, topicId, studyHours, score
- **Reflections** – userId, reflectionText, mood, difficulty
- **Goals** – userId, title, type, progress, completed
- **Notifications** – userId, type, title, message
- **Feedback** – teacherId, studentId, feedback

## Build for Production

```bash
cd frontend
npm run build
```

Serve the `dist` folder with a static server, or configure your backend to serve it.

## License

MIT
