# Project Management System - Quick Start

## Prerequisites
- Node.js 16+
- MongoDB (locally or cloud)

## Installation & Setup

### 1. Backend Setup
```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MongoDB URI
nano .env
```

### 2. Seed Database
```bash
# Run seed script to populate test data
node seed.js

# Output will show login credentials
```

### 3. Start Backend
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 4. Frontend Setup (in another terminal)
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

## Default Test Users

| Role | Username (National ID) | Password |
|------|------------------------|----------|
| Admin | admin01 | admin0123 |
| Student | 0372199984 | 99101241 |
| Teacher 1 | 0371234567 | 123456789 |
| Teacher 2 | 0371234568 | 123456788 |
| Manager | 0377654321 | 987654321 |

## System Workflow

```
1. Register → 2. Admin Approve → 3. Login
↓
Student Path:
- Enroll Project → Submit Topics → Advisor Approves → 
- Receive Defense Date/Time → Defense → Grade

Teacher Path (Advisor):
- See Student Topics → Approve Topic → 
- View Student Reports → Send Messages

Teacher Path (Examiner):
- Submit Available Defense Times → 
- System Schedules → Grade Student

Manager Path:
- Set Capacity → Assign Advisor/Examiner → 
- View Dashboard with All Projects
```

## Key Features

✅ Role-based authentication (Student, Teacher, Manager, Admin)
✅ Automatic advisor/examiner assignment (must be different)
✅ Defense scheduling with 30-minute slots
✅ Project topic submission and approval
✅ Messaging system between all roles
✅ Admin approval for new registrations
✅ Manager dashboard with complete project overview

## Color Theme
- Dark Green: #1b4d3e
- Light Green: #2d7a5c
- Orange: #e8932f
- Dark Background: #0f1419
- Card Background: #1a1f2a

## Technology Stack
- **Backend**: Node.js, Express, MongoDB, JWT, Bcrypt
- **Frontend**: Vue.js 3, Vue Router, Axios, Tailwind CSS
- **Tools**: Vite, Nodemon

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

### Port Already in Use
- Backend: `PORT=5001 npm run dev`
- Frontend: `npm run dev -- --port 3001`

### CORS Issues
- Check that API proxy is correctly configured in `vite.config.js`

## Project Structure
```
managementProject/
├── server/              # Backend
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── controllers/    # Business logic
│   ├── middleware/     # Auth middleware
│   ├── server.js       # Main server file
│   └── seed.js         # Database seeder
├── client/             # Frontend
│   ├── src/
│   │   ├── views/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── assets/     # Styles
│   │   └── main.js     # Entry point
│   └── index.html      # HTML template
└── README.md           # Documentation
```
