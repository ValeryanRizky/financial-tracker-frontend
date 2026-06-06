import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Wallet, Plus, Minus, CheckCircle, AlertCircle,
    TrendingUp, TrendingDown, RefreshCw
} from 'lucide-react';
import { walletService } from '../services/wallet.service';

export default function UpdateBalancePopUp({ isOpen, onClose, wallet, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [amount, setAmount] = useState('');
    const [action, setAction] = useState('add'); // 'add' atau 'subtract'
    const [currentBalance, setCurrentBalance] = useState(0);

    // Reset state setiap modal dibuka
    useEffect(() => {
        if (isOpen && wallet) {
            setAmount('');
            setError('');
            setSuccess(false);
            setLoading(false);
            setAction('add');
            setCurrentBalance(wallet.balance || 0);
        }
    }, [isOpen, wallet]);

    if (!isOpen) return null;

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(val);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const updateAmount = parseFloat(amount);

        if (!amount || updateAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (action === 'subtract' && updateAmount > currentBalance) {
            setError('Insufficient balance');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            let response;
            if (action === 'add') {
                response = await walletService.addBalance(wallet.id, updateAmount);
            } else {
                response = await walletService.subtractBalance(wallet.id, updateAmount);
            }

            console.log('Balance updated:', response);
            setSuccess(true);

            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 1500);

        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Failed to update balance');
        } finally {
            setLoading(false);
        }
    };

    const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />

                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl pointer-events-auto overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 pb-4 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 ${wallet?.color || 'bg-blue-600'} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                                            <Wallet size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">
                                                Update Balance
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                {wallet?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        <X size={18} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="px-6 pt-3">
                                <AnimatePresence mode="wait">
                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} />
                                            <span>Balance updated successfully!</span>
                                        </motion.div>
                                    )}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Content */}
                            <div className="p-6 pt-2">
                                {/* Current Balance */}
                                <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-500 mb-1">Current Balance</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatIDR(currentBalance)}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setAction('add')}
                                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${action === 'add'
                                                ? 'bg-emerald-600 text-white shadow-lg'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Plus size={18} />
                                        <span className="font-medium">Add</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAction('subtract')}
                                        className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${action === 'subtract'
                                                ? 'bg-rose-600 text-white shadow-lg'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <Minus size={18} />
                                        <span className="font-medium">Withdraw</span>
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                            Amount to {action === 'add' ? 'Add' : 'Withdraw'}
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:bg-white focus:border-indigo-300 outline-none transition-colors"
                                                required
                                                min="1"
                                                disabled={loading || success}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Quick Amount Buttons */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {quickAmounts.map((quickAmount) => (
                                            <button
                                                key={quickAmount}
                                                type="button"
                                                onClick={() => setAmount(quickAmount.toString())}
                                                disabled={loading || success}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors disabled:opacity-50"
                                            >
                                                Rp {quickAmount.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>

                                    {/* New Balance Preview */}
                                    {amount && parseFloat(amount) > 0 && (
                                        <div className="mb-6 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <p className="text-xs text-indigo-600 mb-1">New Balance Preview</p>
                                            <p className="text-xl font-bold text-indigo-700">
                                                {formatIDR(
                                                    action === 'add'
                                                        ? currentBalance + parseFloat(amount)
                                                        : currentBalance - parseFloat(amount)
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading || success || !amount}
                                        className={`w-full py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${action === 'add'
                                                ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:shadow-lg'
                                                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:shadow-lg'
                                            }`}
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw size={16} className="animate-spin" />
                                                <span>Processing...</span>
                                            </div>
                                        ) : success ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <CheckCircle size={16} />
                                                <span>Success!</span>
                                            </div>
                                        ) : (
                                            `Confirm ${action === 'add' ? 'Addition' : 'Withdrawal'}`
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}