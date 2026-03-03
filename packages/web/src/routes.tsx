import { Routes, Route } from 'react-router';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<div className="flex items-center justify-center min-h-screen text-2xl font-bold">Agent-X</div>} />
    </Routes>
  );
}
