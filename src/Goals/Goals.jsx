import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Plus, Calendar, ArrowRight,
  Trophy, Wallet, PieChart, TrendingUp, Settings,
  Search, Filter
} from 'lucide-react';
import Sidebar from '../Sidebar/sidebar';
import GoalPopUp from '../Popup/GoalPopUp';
import ManageGoalModal from '../Popup/managePopUp';
import { goalService } from '../services/goal.service';
import { balanceService } from '../services/balance.service';

export default function GoalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goals, setGoals] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch goals dan balance dari backend
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [goalsResponse, balanceResponse] = await Promise.all([
        goalService.getAll(),
        balanceService.getSummary()
      ]);

      setGoals(goalsResponse.data?.goals || []);
      setBalance(balanceResponse.data?.balance || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  useEffect(() => {
    const handleGoalAdded = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('goal-added', handleGoalAdded);
    return () => window.removeEventListener('goal-added', handleGoalAdded);
  }, []);

  const handleGoalSuccess = () => {
    window.dispatchEvent(new Event('goal-added'));
    setIsModalOpen(false);
  };

  const handleManageSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setIsManageModalOpen(false);
    setSelectedGoal(null);
  };

  const openManageModal = (goal) => {
    setSelectedGoal(goal);
    setIsManageModalOpen(true);
  };

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(val);

  // Filter goals berdasarkan search
  const filteredGoals = useMemo(() => {
    if (!searchTerm) return goals;
    return goals.filter(goal =>
      goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      goal.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [goals, searchTerm]);

  // Hitung total saved
  const totalSaved = useMemo(() => {
    return goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  }, [goals]);

  // Remaining balance
  const remainingBalance = useMemo(() => {
    return balance - totalSaved;
  }, [balance, totalSaved]);

  // Hitung allocation percentage
  const allocationPercentage = useMemo(() => {
    if (balance === 0) return totalSaved > 0 ? 100 : 0;
    return ((totalSaved / balance) * 100).toFixed(0);
  }, [totalSaved, balance]);

  if (loading && goals.length === 0) {
    return (
      <div className="flex h-screen bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading goals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Financial Goals</h1>
              <p className="text-sm text-slate-500 mt-1">{goals.length} active goals</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              <span className="font-semibold text-sm">New Goal</span>
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Total Saved */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trophy size={20} className="text-blue-600" />
                </div>
                <span className="text-xs font-medium text-slate-400">TOTAL SAVED</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatIDR(totalSaved)}</p>
              <p className="text-xs text-slate-500 mt-1">Across {goals.length} goals</p>
            </div>

            {/* Balance */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Wallet size={20} className="text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-slate-400">BALANCE</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatIDR(balance)}</p>
              <p className={`text-xs mt-1 ${remainingBalance >= 0 ? 'text-slate-500' : 'text-rose-500 font-medium'}`}>
                {remainingBalance >= 0 ? 'Available' : 'Deficit'}: {formatIDR(Math.abs(remainingBalance))}
              </p>
            </div>

            {/* Allocation - DIPERBAIKI sesuai request */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <PieChart size={20} className="text-purple-600" />
                </div>
                <span className="text-xs font-medium text-slate-400">ALLOCATED</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {allocationPercentage}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {totalSaved > balance
                  ? `${allocationPercentage}% of balance (${formatIDR(totalSaved - balance)} over)`
                  : 'Within balance'}
              </p>
            </div>
          </div>

          {/* Warning Message jika over allocated */}
          {balance < totalSaved && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm flex items-center gap-2">
              <span className="font-medium">⚠️ Warning:</span>
              <span>Your goals exceed your current balance by {formatIDR(totalSaved - balance)}</span>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 transition-colors"
            />
          </div>

          {/* Goals Grid */}
          {filteredGoals.length === 0 ? (
            <div className="text-center py-12">
              <Target size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No goals found</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-indigo-600 text-sm font-medium hover:text-indigo-700"
              >
                Create your first goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const remaining = goal.targetAmount - goal.currentAmount;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-slate-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {goal.icon === 'Laptop' && '💻'}
                            {goal.icon === 'Plane' && '✈️'}
                            {goal.icon === 'Shield' && '🛡️'}
                            {goal.icon === 'Home' && '🏠'}
                            {goal.icon === 'Car' && '🚗'}
                            {goal.icon === 'Book' && '📚'}
                            {goal.icon === 'Heart' && '❤️'}
                            {goal.icon === 'GraduationCap' && '🎓'}
                            {goal.icon === 'Gamepad' && '🎮'}
                            {goal.icon === 'Dumbbell' && '💪'}
                            {goal.icon === 'Music' && '🎵'}
                          </span>
                          <span className="text-xs font-medium text-slate-400">{goal.category}</span>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${progress > 80 ? 'bg-emerald-50 text-emerald-600' :
                          progress > 50 ? 'bg-amber-50 text-amber-600' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                          {progress > 80 ? 'Almost There' : progress > 50 ? 'On Track' : 'Just Started'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{goal.title}</h3>
                      <p className="text-xs text-slate-400">
                        Target: {formatIDR(goal.targetAmount)}
                      </p>
                    </div>

                    {/* Progress Section */}
                    <div className="p-4 bg-slate-50/50">
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="font-medium text-slate-600">Progress</span>
                        <span className="font-bold text-indigo-600">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full mb-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1 }}
                          className={`h-full rounded-full ${goal.color || 'bg-indigo-600'}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div>
                          <p className="text-slate-400">Current</p>
                          <p className="font-bold text-slate-900">{formatIDR(goal.currentAmount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Remaining</p>
                          <p className="font-bold text-emerald-600">{formatIDR(remaining)}</p>
                        </div>
                      </div>

                      {/* Deadline & Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar size={14} />
                          <span className="text-xs">
                            {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <button
                          onClick={() => openManageModal(goal)}
                          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          <Settings size={14} />
                          Manage
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add Goal Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsModalOpen(true)}
                className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/20 transition-all min-h-[200px]"
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Plus size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">Create New Goal</p>
                <p className="text-xs text-slate-400">Add your next achievement</p>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <GoalPopUp
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleGoalSuccess}
      />

      <ManageGoalModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
        onSuccess={handleManageSuccess}
      />
    </div>
  );
}