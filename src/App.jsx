import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Login from "./Login/Login";
import Transactions from "./Transaction/transaction";
import Income from "./DataIncome_Expands/Income";
import Expense from "./DataIncome_Expands/Expense";
import History from "./History_all/History";
import WalletPage from "./Wallet/wallet";
import AnalyticsPage from "./Analytics/Analytics";
import GoalsPage from "./Goals/Goals";
import Register from "./Login/Register";

// Component Protected Route
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/';
    return null;
  }

  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (No Auth Needed) */}
        <Route path="/" element={<Login />} />
        <Route path="/Register" element={<Register />} />

        {/* Protected Routes (Need Token) */}
        <Route path="/Dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/transactions" element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        } />

        <Route path="/Income-History" element={
          <ProtectedRoute>
            <Income />
          </ProtectedRoute>
        } />

        <Route path="/expense-History" element={
          <ProtectedRoute>
            <Expense />
          </ProtectedRoute>
        } />

        <Route path="/History" element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        } />

        <Route path="/Wallet" element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        } />

        <Route path="/Analytics" element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } />

        <Route path="/Goals" element={
          <ProtectedRoute>
            <GoalsPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}