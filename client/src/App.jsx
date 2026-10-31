import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

import Home from './pages/Home';
import Browse from './pages/Browse';
import MapPage from './pages/MapPage';
import ItemDetails from './pages/ItemDetails';
import ReportItem from './pages/ReportItem';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MyReports from './pages/dashboard/MyReports';
import MyClaims from './pages/dashboard/MyClaims';
import Chats from './pages/dashboard/Chats';
import Notifications from './pages/dashboard/Notifications';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageItems from './pages/admin/ManageItems';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Toaster position="top-right" />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/browse" element={<Browse />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/items/:id" element={<ItemDetails />} />

          <Route path="/report" element={<ProtectedRoute><ReportItem /></ProtectedRoute>} />
          <Route path="/items/:id/edit" element={<ProtectedRoute><ReportItem /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute><MyClaims /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
          <Route path="/chats/:id" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/items" element={<ProtectedRoute roles={['admin']}><ManageItems /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}