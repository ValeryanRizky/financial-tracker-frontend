import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Plus, Minus, TrendingUp, Calendar,
    DollarSign, Target, CheckCircle, AlertCircle
} from 'lucide-react';
import { goalService } from '../services/goal.service';

export default function ManageGoalModal({ isOpen, onClose, goal, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [amount, setAmount] = useState('');
    const [action, setAction] = useState('add'); // 'add' or 'subtract'

    if (!isOpen || !goal) return null;

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(val);

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - goal.currentAmount;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const contributionAmount = parseFloat(amount);

            if (!amount || contributionAmount <= 0) {
                throw new Error('Please enter a valid amount');
            }

            if (action === 'add') {
                if (goal.currentAmount + contributionAmount > goal.targetAmount) {
                    throw new Error('Amount would exceed target');
                }
                await goalService.addContribution(goal.id, contributionAmount);
            } else {
                if (goal.currentAmount - contributionAmount < 0) {
                    throw new Error('Insufficient balance in goal');
                }
                // For subtract, we'll use negative amount in contribution
                await goalService.addContribution(goal.id, -contributionAmount);
            }

            setSuccess(true);
            setTimeout(() => {
                setAmount('');
                if (onSuccess) onSuccess();
                onClose();
            }, 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[100]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl pointer-events-auto overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <Target size={20} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Manage Goal</h2>
                                        <p className="text-xs text-slate-500">{goal.title}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Goal Info */}
                            <div className="p-5 bg-slate-50 border-b border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs text-slate-500">Progress</span>
                                    <span className="text-xs font-bold text-indigo-600">{progress.toFixed(1)}%</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 w-full bg-slate-200 rounded-full mb-4">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className={`h-full rounded-full ${goal.color || 'bg-indigo-600'}`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Current</p>
                                        <p className="text-lg font-bold text-slate-800">{formatIDR(goal.currentAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Target</p>
                                        <p className="text-lg font-bold text-slate-800">{formatIDR(goal.targetAmount)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <p className="text-xs text-slate-500 mb-1">Remaining</p>
                                    <p className="text-lg font-bold text-emerald-600">{formatIDR(remaining)}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="px-5 pt-4">
                                <AnimatePresence mode="wait">
                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} />
                                            <span>Goal updated successfully!</span>
                                        </motion.div>
                                    )}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm flex items-center gap-2"
                                        >
                                            <AlertCircle size={16} />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Action Buttons */}
                            <div className="px-5 pt-2">
                                <div className="flex gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setAction('add')}
                                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${action === 'add'
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Plus size={16} />
                                            <span>Add</span>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAction('subtract')}
                                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${action === 'subtract'
                                                ? 'bg-rose-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Minus size={16} />
                                            <span>Withdraw</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="px-5 pb-5">
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Amount to {action === 'add' ? 'Add' : 'Withdraw'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-indigo-300 outline-none transition-colors"
                                            required
                                            min="1"
                                            disabled={loading || success}
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5">
                                        Max: {action === 'add' ? formatIDR(remaining) : formatIDR(goal.currentAmount)}
                                    </p>
                                </div>

                                {/* Quick Amount Buttons */}
                                <div className="flex gap-2 mb-4">
                                    {[50000, 100000, 500000, 1000000].map((quickAmount) => (
                                        <button
                                            key={quickAmount}
                                            type="button"
                                            onClick={() => setAmount(quickAmount.toString())}
                                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors"
                                        >
                                            Rp {quickAmount.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className={`w-full py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${action === 'add'
                                            ? 'bg-indigo-600 hover:bg-indigo-700'
                                            : 'bg-rose-600 hover:bg-rose-700'
                                        }`}
                                >
                                    {loading ? 'Processing...' : success ? 'Success!' : `Confirm ${action === 'add' ? 'Addition' : 'Withdrawal'}`}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}