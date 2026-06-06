import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Plus, Calendar, ArrowRight, Trophy, Wallet, PieChart,
  Settings, Search, Sparkles, Star, Clock, AlertCircle
} from 'lucide-react';
import Sidebar from '../Sidebar/sidebar';
import GoalPopUp from '../Popup/GoalPopUp';
import { goalService } from '../services/goal.service';
import { walletService } from '../services/wallet.service';

export default function GoalsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goals, setGoals] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchWalletBalance = useCallback(async () => {
    try {
      const response = await walletService.getAll();
      const wallets = response.data?.wallets || [];
      const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
      return totalBalance;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await goalService.getAll();
      return response.data?.goals || [];
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [goalsData, walletTotal] = await Promise.all([
        fetchGoals(),
        fetchWalletBalance()
      ]);
      setGoals(goalsData);
      setBalance(walletTotal);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchGoals, fetchWalletBalance]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  useEffect(() => {
    const handleRefresh = () => setRefreshKey(prev => prev + 1);
    window.addEventListener('goal-added', handleRefresh);
    window.addEventListener('transaction-added', handleRefresh);
    window.addEventListener('wallet-added', handleRefresh);
    return () => {
      window.removeEventListener('goal-added', handleRefresh);
      window.removeEventListener('transaction-added', handleRefresh);
      window.removeEventListener('wallet-added', handleRefresh);
    };
  }, []);

  const handleGoalSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setIsModalOpen(false);
    setSelectedGoal(null);
  };

  const formatIDR = (val) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(val);

  const formatCompact = (val) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}K`;
    return formatIDR(val);
  };

  const categories = useMemo(() => {
    const unique = [...new Set(goals.map(g => g.category))];
    return ['all', ...unique];
  }, [goals]);

  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      const matchSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || goal.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [goals, searchTerm, selectedCategory]);

  const totalSaved = useMemo(() => goals.reduce((sum, g) => sum + g.currentAmount, 0), [goals]);
  const remainingBalance = balance - totalSaved;
  const allocationPercentage = balance === 0 ? (totalSaved > 0 ? 100 : 0) : ((totalSaved / balance) * 100).toFixed(0);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  if (loading && goals.length === 0) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3 sm:mb-4" />
            <p className="text-slate-500 text-xs sm:text-sm">Memuat goals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-6 mb-6 sm:mb-10">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                Financial Goals
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mt-1 sm:mt-2">
                {goals.length} active goals • {completedGoals} completed
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center gap-2 text-sm sm:text-base"
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
              Create New Goal
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                  <Trophy size={18} className="sm:w-[22px] sm:h-[22px] text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Total Saved</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatCompact(totalSaved)}</p>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400">Across {goals.length} goals</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Wallet size={18} className="sm:w-[22px] sm:h-[22px] text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Total Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{formatCompact(balance)}</p>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400">From all wallets</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all border border-slate-100"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                  <PieChart size={18} className="sm:w-[22px] sm:h-[22px] text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">Allocated</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{allocationPercentage}%</p>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400">of total balance</p>
            </motion.div>
          </div>

          {balance < totalSaved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 sm:mb-8 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-amber-700 text-xs sm:text-sm flex items-center gap-2 sm:gap-3"
            >
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              <span>Your goals exceed your current balance by {formatIDR(totalSaved - balance)}</span>
            </motion.div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <input
                type="text"
                placeholder="Search goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  {cat === 'all' ? 'All Goals' : cat}
                </button>
              ))}
            </div>
          </div>

          {filteredGoals.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-full bg-slate-100 flex items-center justify-center">
                <Target className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium text-sm sm:text-base">No goals found</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 sm:mt-3 text-indigo-600 font-medium hover:text-indigo-700 transition-colors text-sm sm:text-base"
              >
                Create your first goal →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredGoals.map((goal, idx) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                const remaining = goal.targetAmount - goal.currentAmount;
                const isCompleted = progress >= 100;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl sm:text-2xl">
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
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900">{goal.title}</h3>
                            <p className="text-[10px] sm:text-xs text-slate-500">{goal.category}</p>
                          </div>
                        </div>
                        {isCompleted ? (
                          <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-100 rounded-lg flex items-center gap-0.5 sm:gap-1">
                            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600">Done</span>
                          </div>
                        ) : (
                          <span className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg ${progress > 80 ? 'bg-emerald-100 text-emerald-600' :
                            progress > 50 ? 'bg-amber-100 text-amber-600' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                            {progress > 80 ? 'Almost There' : progress > 50 ? 'On Track' : 'Just Started'}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <div>
                          <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase">Target</p>
                          <p className="text-sm sm:text-base font-bold text-slate-900">{formatCompact(goal.targetAmount)}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300" />
                        <div className="text-right">
                          <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase">Current</p>
                          <p className="text-sm sm:text-base font-bold text-indigo-600">{formatCompact(goal.currentAmount)}</p>
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
                        <div className="flex justify-between text-[10px] sm:text-xs">
                          <span className="text-slate-500">Progress</span>
                          <span className="font-bold text-indigo-600">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full rounded-full ${goal.color || 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                          <span className="text-[10px] sm:text-xs text-slate-500">
                            {new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedGoal(goal);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] sm:text-xs font-medium hover:bg-indigo-100 transition-all"
                        >
                          <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          Manage
                        </button>
                      </div>
                    </div>

                    {!isCompleted && remaining > 0 && (
                      <div className="px-4 sm:px-5 py-2 sm:py-3 bg-slate-50 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] sm:text-[10px] text-slate-500">Remaining</span>
                          <span className="text-xs sm:text-sm font-bold text-emerald-600">{formatCompact(remaining)}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="bg-white rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200 p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/20 transition-all min-h-[240px] sm:min-h-[280px] group"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center mb-3 sm:mb-4 transition-all">
                  <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400 group-hover:text-indigo-500 transition-all" />
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-700 mb-1">Create New Goal</p>
                <p className="text-[10px] sm:text-xs text-slate-400">Set your next achievement</p>
                <Sparkles className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 w-3 h-3 sm:w-4 sm:h-4 text-slate-300 group-hover:text-indigo-400 transition-all" />
              </motion.div>
            </div>
          )}
        </div>
      </div>
      <GoalPopUp
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
        onSuccess={handleGoalSuccess}
      />
    </div>
  );
}