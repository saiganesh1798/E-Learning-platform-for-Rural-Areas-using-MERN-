<<<<<<< HEAD
# Rural eLearning Platform

A MERN stack eLearning platform designed for rural areas, featuring role-based access (Admin, Teacher, Student), course management, and quizzes.

## Prerequisites
- Node.js (v14+)
- MongoDB (running locally or Atlas URI)

## Installation

### 1. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```
Create a `.env` file in `server/` with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/rural_elearning
JWT_SECRET=your_jwt_secret_key
```

### 2. Frontend Setup
Navigate to the client directory and install dependencies:
```bash
cd client
npm install
```

## Running the Application

### Start the Backend
```bash
cd server
npm run server  # or node server.js
```
The server will run on `http://localhost:5000`.

### Start the Frontend
```bash
cd client
npm run dev
```
The client will run on `http://localhost:5173`.

## Features
- **Authentication**: Register/Login as Student, Teacher, or Admin.
- **Courses**: Teachers create courses; Students enroll.
- **Lessons**: Video (YouTube) and Document (PDF) support.
- **Quizzes**: Teachers create quizzes; Students take them and get scores.
- **Admin**: Dashboard to manage users and view analytics.
*****
**********
++++++++++++++++++++++++++
=======
# E-Learning-platform-for-Rural-Areas-using-MERN-
E-Learning Platform for Rural Areas is a full-stack web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js). It aims to provide accessible, user-friendly online education tailored for learners in rural regions with limited resources and connectivity. This project focuses on simplicity, performance,support remote learners.
>>>>>>> 93ec4df68b5f6dbc8cf2cbe7cac2eaf92f346503
