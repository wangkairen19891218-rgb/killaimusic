import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MusicEditor from './pages/MusicEditor';
import AIEvasion from './pages/AIEvasion';
import AssetLibrary from './pages/AssetLibrary';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App min-h-screen bg-background">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/editor" element={
              <ProtectedRoute>
                <MusicEditor />
              </ProtectedRoute>
            } />
            <Route path="/editor/:id" element={
              <ProtectedRoute>
                <MusicEditor />
              </ProtectedRoute>
            } />
            <Route path="/editor/new" element={
              <ProtectedRoute>
                <MusicEditor />
              </ProtectedRoute>
            } />
            <Route path="/ai-evasion" element={
              <ProtectedRoute>
                <AIEvasion />
              </ProtectedRoute>
            } />
            <Route path="/assets" element={
              <ProtectedRoute>
                <AssetLibrary />
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute>
                <AssetLibrary />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
