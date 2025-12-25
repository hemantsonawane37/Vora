import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import AdminLayout from '@/layouts/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import Scrapers from '@/pages/admin/Scrapers';
import Users from '@/pages/admin/Users';
import ReviewQueue from '@/pages/admin/ReviewQueue';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="scrapers" element={<Scrapers />} />
          <Route path="reviews" element={<ReviewQueue />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<div className="text-2xl font-bold">Settings (Coming Soon)</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
