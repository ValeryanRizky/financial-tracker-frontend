import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Plus, Minus, Target, CheckCircle, AlertCircle, RefreshCw, Wallet
} from 'lucide-react';
import { goalService } from '../services/goal.service';
import { walletService } from '../services/wallet.service';

export default function ManageGoalModal({ isOpen, onClose, goal, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [amount, setAmount] = useState('');
    const [action, setAction] = useState('add');
    const [wallets, setWallets] = useState([]);
    const [selectedWalletId, setSelectedWalletId] = useState('');
    const [loadingWallets, setLoadingWallets] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    if (!isOpen || !goal) return null;

    // 🔥 FORMAT ANGKA DENGAN TITIK
    const formatNumber = (value) => {
        if (!value) return '';
        let cleanValue = value.toString().replace(/[^\d]/g, '');
        if (!cleanValue) return '';
        let number = parseInt(cleanValue, 10);
        if (isNaN(number)) return '';
        return number.toLocaleString('id-ID');
    };

    // 🔥 FORMAT MATA UANG
    const formatIDR = (val) => {
        if (val === undefined || val === null) return 'Rp 0';
        return `Rp ${val.toLocaleString('id-ID')}`;
    };

    // 🔥 HANDLE PERUBAHAN INPUT
    const handleAmountChange = (e) => {
        let rawValue = e.target.value;
        let digitsOnly = rawValue.replace(/[^\d]/g, '');
        if (!digitsOnly) {
            setAmount('');
            return;
        }
        let formatted = parseInt(digitsOnly, 10).toLocaleString('id-ID');
        setAmount(formatted);
    };

    // 🔥 DAPATKAN NILAI NUMERIK (TANPA TITIK)
    const getNumericAmount = () => {
        if (!amount) return 0;
        let cleanValue = amount.replace(/[^\d]/g, '');
        if (!cleanValue) return 0;
        return parseInt(cleanValue, 10);
    };

    // Fetch wallets
    const fetchWallets = async () => {
        try {
            setLoadingWallets(true);
            const response = await walletService.getAll();
            const walletsData = response.data?.wallets || [];
            setWallets(walletsData);

            if (walletsData.length > 0 && !selectedWalletId) {
                const cashWallet = walletsData.find(w => w.name === 'Cash');
                const defaultWallet = cashWallet || walletsData[0];
                setSelectedWalletId(defaultWallet.id);
            }
            return walletsData;
        } catch (error) {
            console.error('Error fetching wallets:', error);
            return [];
        } finally {
            setLoadingWallets(false);
        }
    };

    const refreshWallets = async () => {
        setRefreshing(true);
        await fetchWallets();
        setRefreshing(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchWallets();
        }
    }, [isOpen]);

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - goal.currentAmount;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const numericAmount = getNumericAmount();

            if (!numericAmount || numericAmount <= 0) {
                throw new Error('Masukkan nominal yang valid');
            }

            if (action === 'add') {
                // CEK SALDO WALLET
                if (!selectedWalletId) {
                    throw new Error('Pilih wallet sumber');
                }

                const selectedWallet = wallets.find(w => w.id === selectedWalletId);
                if (!selectedWallet) {
                    throw new Error('Wallet tidak ditemukan');
                }

                // 🔥 VALIDASI SALDO
                if (selectedWallet.balance < numericAmount) {
                    throw new Error(`Saldo ${selectedWallet.name} tidak cukup.\nSaldo: ${formatIDR(selectedWallet.balance)}\nDibutuhkan: ${formatIDR(numericAmount)}`);
                }

                if (goal.currentAmount + numericAmount > goal.targetAmount) {
                    throw new Error(`Nominal melebihi target. Sisa target: ${formatIDR(remaining)}`);
                }

                // 🔥 UPDATE GOAL DULU (backend akan cek balance lagi)
                const goalResponse = await goalService.addContribution(goal.id, numericAmount);

                if (!goalResponse.success) {
                    throw new Error(goalResponse.message || 'Gagal menambahkan ke goal');
                }

                // 🔥 UPDATE WALLET BALANCE
                const newWalletBalance = selectedWallet.balance - numericAmount;
                await walletService.updateBalance(selectedWalletId, newWalletBalance);

            } else {
                // WITHDRAW dari goal
                if (goal.currentAmount - numericAmount < 0) {
                    throw new Error(`Saldo goal tidak mencukupi. Saldo saat ini: ${formatIDR(goal.currentAmount)}`);
                }

                // 🔥 UPDATE GOAL (kurangi)
                const goalResponse = await goalService.addContribution(goal.id, -numericAmount);

                if (!goalResponse.success) {
                    throw new Error(goalResponse.message || 'Gagal menarik dari goal');
                }

                // 🔥 TAMBAH KE WALLET CASH
                const cashWallet = wallets.find(w => w.name === 'Cash') || wallets[0];
                const newWalletBalance = (cashWallet.balance || 0) + numericAmount;
                await walletService.updateBalance(cashWallet.id, newWalletBalance);
            }

            setSuccess(true);

            // Refresh data
            await fetchWallets();

            setTimeout(() => {
                setAmount('');
                if (onSuccess) onSuccess();
                onClose();
            }, 1500);

        } catch (err) {
            console.error('❌ Error updating goal:', err);
            setError(err.message || 'Gagal mengupdate goal');
        } finally {
            setLoading(false);
        }
    };

    // Quick amount buttons
    const quickAmounts = [50000, 100000, 500000, 1000000];

    const getMaxAmount = () => {
        if (action === 'add') {
            const selectedWallet = wallets.find(w => w.id === selectedWalletId);
            const maxWalletBalance = selectedWallet?.balance || 0;
            return Math.min(remaining, maxWalletBalance);
        } else {
            return goal.currentAmount;
        }
    };

    const maxAmount = getMaxAmount();
    const selectedWallet = wallets.find(w => w.id === selectedWalletId);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-[100]"
                        onClick={onClose}
                    />

                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl pointer-events-auto overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <Target size={20} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Kelola Goal</h2>
                                        <p className="text-xs text-slate-500">{goal.title}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={refreshWallets}
                                        disabled={refreshing}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <RefreshCw size={18} className={`text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X size={18} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Goal Info */}
                            <div className="p-5 bg-slate-50 border-b border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs text-slate-500">Progress</span>
                                    <span className="text-xs font-bold text-indigo-600">{progress.toFixed(1)}%</span>
                                </div>

                                <div className="h-2 w-full bg-slate-200 rounded-full mb-4">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(progress, 100)}%` }}
                                        transition={{ duration: 0.5 }}
                                        className={`h-full rounded-full ${goal.color || 'bg-indigo-600'}`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Terkumpul</p>
                                        <p className="text-lg font-bold text-slate-800">{formatIDR(goal.currentAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Target</p>
                                        <p className="text-lg font-bold text-slate-800">{formatIDR(goal.targetAmount)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <p className="text-xs text-slate-500 mb-1">Sisa Target</p>
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
                                            <span>Goal berhasil diupdate!</span>
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

                            {/* Pilihan Wallet */}
                            {action === 'add' && wallets.length > 0 && (
                                <div className="px-5 pt-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Sumber Dana
                                    </label>
                                    {loadingWallets ? (
                                        <div className="flex justify-center py-2">
                                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {wallets.map((wallet) => {
                                                const isSelected = selectedWalletId === wallet.id;
                                                const isDisabled = wallet.balance === 0;
                                                return (
                                                    <button
                                                        key={wallet.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedWalletId(wallet.id);
                                                            setError('');
                                                        }}
                                                        disabled={isDisabled}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${isSelected
                                                            ? 'bg-emerald-500 text-white'
                                                            : isDisabled
                                                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        <Wallet size={12} />
                                                        {wallet.name}
                                                        <span className="text-[10px] opacity-80">
                                                            {formatIDR(wallet.balance)}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info Saldo Wallet */}
                            {action === 'add' && selectedWallet && (
                                <div className="px-5 pt-2">
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-500">Saldo Wallet Terpilih</p>
                                        <p className="text-sm font-bold text-slate-800">{formatIDR(selectedWallet.balance)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="px-5 pt-4">
                                <div className="flex gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAction('add');
                                            setAmount('');
                                            setError('');
                                        }}
                                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${action === 'add'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Plus size={16} />
                                            <span>Tambah</span>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAction('subtract');
                                            setAmount('');
                                            setError('');
                                        }}
                                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${action === 'subtract'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Minus size={16} />
                                            <span>Tarik</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="px-5 pb-5">
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        {action === 'add' ? 'Jumlah yang Ditambahkan' : 'Jumlah yang Ditarik'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">Rp</span>
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:bg-white focus:border-emerald-300 outline-none transition-colors"
                                            required
                                            disabled={loading || success}
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5">
                                        Maksimal: {formatIDR(maxAmount)}
                                        {action === 'add' && selectedWallet && ` (Saldo: ${formatIDR(selectedWallet.balance)})`}
                                    </p>
                                </div>

                                {/* Quick Amount Buttons */}
                                {maxAmount > 0 && (
                                    <div className="flex gap-2 mb-4 flex-wrap">
                                        {quickAmounts.map((quickAmount) => {
                                            const isDisabled = quickAmount > maxAmount;
                                            const formattedQuick = quickAmount.toLocaleString('id-ID');
                                            return (
                                                <button
                                                    key={quickAmount}
                                                    type="button"
                                                    onClick={() => setAmount(formattedQuick)}
                                                    disabled={isDisabled}
                                                    className={`flex-1 min-w-[70px] py-2 rounded-lg text-xs font-medium transition-colors ${isDisabled
                                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                        }`}
                                                >
                                                    Rp {formattedQuick}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading || success || !amount || (action === 'add' && !selectedWalletId) || (action === 'add' && maxAmount <= 0)}
                                    className={`w-full py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${action === 'add'
                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                        : 'bg-rose-600 hover:bg-rose-700'
                                        }`}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Memproses...</span>
                                        </div>
                                    ) : success ? (
                                        'Berhasil!'
                                    ) : (
                                        `Konfirmasi ${action === 'add' ? 'Penambahan' : 'Penarikan'}`
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}