import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

import Home from './pages/Home';
import Browse from './pages/Browse';
import ItemDetails from './pages/ItemDetails';
import ReportItem from './pages/ReportItem';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MyReports from './pages/dashboard/MyReports';
import AdminDashboard from './pages/admin/AdminDashboard';

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
          <Route path="/items/:id" element={<ItemDetails />} />

          <Route path="/report" element={<ProtectedRoute><ReportItem /></ProtectedRoute>} />
          <Route path="/items/:id/edit" element={<ProtectedRoute><ReportItem /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}