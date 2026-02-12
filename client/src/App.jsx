import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateCourse from './pages/CreateCourse';
import CourseList from './pages/CourseList';
import CourseDetails from './pages/CourseDetails';
import AddLesson from './pages/AddLesson';
import LessonPlayer from './pages/LessonPlayer';
import CreateQuiz from './pages/CreateQuiz';
import TakeQuiz from './pages/TakeQuiz';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const Dashboard = () => {
  const { user, logout } = useAuth();

  if (user?.role === 'student') {
    return (
      <div>
        <div className="bg-white shadow p-4 flex justify-between items-center z-10 relative">
          <div className="flex items-center space-x-6">
            <h1 className="font-bold text-xl text-indigo-600">E-Learning App</h1>
            <Link to="/courses" className="text-gray-600 hover:text-indigo-600 font-medium">Browse Courses</Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium">My Dashboard</Link>
          </div>
          <button onClick={logout} className="text-red-500 font-semibold hover:bg-red-50 px-3 py-1 rounded">Logout</button>
        </div>
        <StudentDashboard />
      </div>
    )
  }

  if (user?.role === 'teacher') {
    return (
      <div>
        <div className="bg-white shadow p-4 flex justify-between items-center z-10 relative">
          <div className="flex items-center space-x-6">
            <h1 className="font-bold text-xl text-indigo-600">E-Learning App</h1>
            <Link to="/courses" className="text-gray-600 hover:text-indigo-600 font-medium">Browse Courses</Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 font-medium">Teacher Dashboard</Link>
          </div>
          <button onClick={logout} className="text-red-500 font-semibold hover:bg-red-50 px-3 py-1 rounded">Logout</button>
        </div>
        <TeacherDashboard />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-md mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}</h1>
            <p className="text-gray-600 capitalize">Role: {user?.role}</p>
          </div>
          <div className="flex gap-4">
            <Link to="/courses" className="text-indigo-600 font-semibold hover:underline flex items-center">
              Browse Courses
            </Link>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        {user?.role === 'teacher' && (
          <div className="mb-8">
            <Link to="/create-course" className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700">
              + Create New Course
            </Link>
          </div>
        )}

        <div className="grid gap-6">
          {user?.role === 'admin' && (
            <Link to="/admin" className="block bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold mb-2 text-indigo-700">Go to Admin Panel &rarr;</h2>
              <p>Manage users, courses, and platform settings here.</p>
            </Link>
          )}
          {/* Placeholder for My Courses or Stats */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">My Dashboard</h2>
            <p className="text-gray-600">Your enrolled courses and activities will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-course"
            element={
              <PrivateRoute>
                <CreateCourse />
              </PrivateRoute>
            }
          />
          <Route
            path="/courses/:courseId/add-lesson"
            element={
              <PrivateRoute>
                <AddLesson />
              </PrivateRoute>
            }
          />
          <Route
            path="/courses/:courseId/lessons/:lessonId"
            element={
              <PrivateRoute>
                <LessonPlayer />
              </PrivateRoute>
            }
          />
          <Route
            path="/courses/:courseId/create-quiz"
            element={
              <PrivateRoute>
                <CreateQuiz />
              </PrivateRoute>
            }
          />
          <Route
            path="/quizzes/:quizId"
            element={
              <PrivateRoute>
                <TakeQuiz />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/student-dashboard"
            element={
              <PrivateRoute>
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
