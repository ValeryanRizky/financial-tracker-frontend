import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Wallet,
    MoreVertical,
    ChevronRight,
    Smartphone,
    CreditCard,
    Building2,
    Banknote,
    QrCode,
    TrendingUp,
    RefreshCw,
    Eye,
    EyeOff,
    ArrowUpRight,
    Sparkles,
    Zap,
    Award,
    Gem
} from 'lucide-react';
import Sidebar from '../Sidebar/sidebar';
import AddSourcePopUp from '../Popup/AddSourcePopUp';
import UpdateBalancePopUp from '../Popup/UpdateBalancePopUp';
import { walletService } from '../services/wallet.service';

export default function WalletPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [wallets, setWallets] = useState([]);
    const [summary, setSummary] = useState({ total: 0, byCategory: {}, byType: {} });
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showBalance, setShowBalance] = useState(true);

    const fetchWallets = useCallback(async () => {
        try {
            setLoading(true);
            const response = await walletService.getAll();
            const walletsData = response.data?.wallets || [];
            const summaryData = response.data?.summary || { total: 0, byCategory: {}, byType: {} };
            setWallets(walletsData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error fetching wallets:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWallets();
    }, [fetchWallets, refreshKey]);

    useEffect(() => {
        const handleWalletAdded = () => {
            setRefreshKey(prev => prev + 1);
        };
        window.addEventListener('wallet-added', handleWalletAdded);
        return () => window.removeEventListener('wallet-added', handleWalletAdded);
    }, []);

    const handleWalletSuccess = () => {
        window.dispatchEvent(new Event('wallet-added'));
        setIsModalOpen(false);
        setIsUpdateModalOpen(false);
        setSelectedWallet(null);
    };

    const handleOpenUpdateModal = (wallet) => {
        setSelectedWallet(wallet);
        setIsUpdateModalOpen(true);
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);

    const formatCompactCurrency = (amount) => {
        if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}B`;
        if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}K`;
        return `Rp ${amount}`;
    };

    const displayTotal = useMemo(() => {
        return wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
    }, [wallets]);

    const formattedTotal = useMemo(() => {
        return formatCurrency(displayTotal);
    }, [displayTotal]);

    const groupedWallets = useMemo(() => {
        const groups = { payment: [], digital: [], credit: [], savings: [] };
        wallets.forEach(wallet => {
            if (groups[wallet.category]) groups[wallet.category].push(wallet);
        });
        return groups;
    }, [wallets]);

    const getWalletIconColor = (wallet) => {
        switch (wallet.type) {
            case 'bank': return 'text-blue-600 bg-blue-50';
            case 'ewallet': return 'text-purple-600 bg-purple-50';
            case 'cash': return 'text-emerald-600 bg-emerald-50';
            case 'credit': return 'text-amber-600 bg-amber-50';
            case 'debit': return 'text-indigo-600 bg-indigo-50';
            case 'qris': return 'text-teal-600 bg-teal-50';
            case 'transfer': return 'text-rose-600 bg-rose-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    const getWalletIcon = (wallet) => {
        const iconColor = getWalletIconColor(wallet);
        const iconClass = `w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${iconColor}`;
        switch (wallet.type) {
            case 'bank': return <div className={iconClass}><Building2 size={16} className="sm:w-5 sm:h-5" /></div>;
            case 'ewallet': return <div className={iconClass}><Smartphone size={16} className="sm:w-5 sm:h-5" /></div>;
            case 'cash': return <div className={iconClass}><Banknote size={16} className="sm:w-5 sm:h-5" /></div>;
            case 'credit': return <div className={iconClass}><CreditCard size={16} className="sm:w-5 sm:h-5" /></div>;
            case 'debit': return <div className={iconClass}><CreditCard size={16} className="sm:w-5 sm:h-5" /></div>;
            case 'qris': return <div className={iconClass}><QrCode size={16} className="sm:w-5 sm:h-5" /></div>;
            case 'transfer': return <div className={iconClass}><TrendingUp size={16} className="sm:w-5 sm:h-5" /></div>;
            default: return <div className={iconClass}><Wallet size={16} className="sm:w-5 sm:h-5" /></div>;
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'payment': return <Building2 size={14} className="sm:w-4 sm:h-4 text-blue-500" />;
            case 'digital': return <Smartphone size={14} className="sm:w-4 sm:h-4 text-purple-500" />;
            case 'credit': return <CreditCard size={14} className="sm:w-4 sm:h-4 text-amber-500" />;
            case 'savings': return <Award size={14} className="sm:w-4 sm:h-4 text-emerald-500" />;
            default: return <Wallet size={14} className="sm:w-4 sm:h-4 text-slate-400" />;
        }
    };

    const getCategoryName = (category) => {
        switch (category) {
            case 'payment': return 'Bank Accounts';
            case 'digital': return 'E-Wallets';
            case 'credit': return 'Credit Cards';
            case 'savings': return 'Savings';
            default: return 'Other';
        }
    };

    if (loading && wallets.length === 0) {
        return (
            <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-10 h-10 sm:w-12 sm:h-12 border-3 border-indigo-200 border-t-indigo-500 rounded-full mx-auto mb-4"
                        />
                        <p className="text-slate-500 text-xs sm:text-sm">Loading your portfolio...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 font-sans">
            <Sidebar />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
                    {/* Header - Responsive */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <Gem size={14} className="sm:w-4 sm:h-4 text-white" />
                            </div>
                            <span className="font-black text-gray-800 drop-shadow-sm text-base sm:text-lg">Wallet</span>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setRefreshKey(prev => prev + 1)}
                                className="p-2 sm:p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <RefreshCw size={14} className="sm:w-[18px] sm:h-[18px] text-slate-500" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsModalOpen(true)}
                                className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center gap-1 sm:gap-2"
                            >
                                <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="text-xs sm:text-sm">Add Account</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Hero Card - Responsive */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 overflow-hidden"
                    >
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-700" />
                        </div>

                        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 opacity-10">
                            <svg viewBox="0 0 200 200" fill="none">
                                <path d="M100 0 L100 200 M0 100 L200 100" stroke="white" strokeWidth="1" />
                                <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="1" fill="none" />
                            </svg>
                        </div>

                        <div className="relative">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                                        <Wallet size={14} className="sm:w-[18px] sm:h-[18px] text-white" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-medium text-indigo-100 uppercase tracking-wider">Total Net Worth</span>
                                </div>
                                <button
                                    onClick={() => setShowBalance(!showBalance)}
                                    className="p-1 sm:p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                                >
                                    {showBalance ? <Eye size={12} className="sm:w-[14px] sm:h-[14px] text-white/70" /> : <EyeOff size={12} className="sm:w-[14px] sm:h-[14px] text-white/70" />}
                                </button>
                            </div>

                            <div className="mb-3 sm:mb-4">
                                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight break-words">
                                    {showBalance ? formattedTotal : 'Rp •••••••'}
                                </h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-3 sm:pt-4 border-t border-white/20">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-300 animate-pulse" />
                                    <span className="text-[10px] sm:text-xs text-indigo-100">Total Assets</span>
                                    <span className="text-xs sm:text-sm font-bold text-white">{formatCompactCurrency(displayTotal)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-300" />
                                    <span className="text-[10px] sm:text-xs text-indigo-100">Active Accounts</span>
                                    <span className="text-xs sm:text-sm font-bold text-white">{wallets.length}</span>
                                </div>
                            </div>
                        </div>

                        <Sparkles className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-5 h-5 sm:w-8 sm:h-8 text-white/20" />
                    </motion.div>

                    {/* Wallet Groups */}
                    <AnimatePresence>
                        {Object.entries(groupedWallets).map(([category, categoryWallets], groupIdx) => (
                            categoryWallets.length > 0 && (
                                <motion.div
                                    key={category}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: groupIdx * 0.1 }}
                                    className="mb-6 sm:mb-8"
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                        <div className="p-1 sm:p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                                            {getCategoryIcon(category)}
                                        </div>
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
                                            {getCategoryName(category)}
                                        </h3>
                                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                                            {categoryWallets.length}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                                        {categoryWallets.map((wallet, idx) => {
                                            const balanceValue = wallet.balance || 0;
                                            return (
                                                <motion.div
                                                    key={wallet.id}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    whileHover={{ y: -4 }}
                                                    className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" style={{ padding: '2px', margin: '-2px' }} />

                                                    <div className="relative bg-white rounded-xl overflow-hidden">
                                                        <div className="p-4 sm:p-5">
                                                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                                                {getWalletIcon(wallet)}
                                                                <button
                                                                    onClick={() => handleOpenUpdateModal(wallet)}
                                                                    className="p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <MoreVertical size={12} className="sm:w-[14px] sm:h-[14px] text-slate-400" />
                                                                </button>
                                                            </div>

                                                            <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-0.5 sm:mb-1">{wallet.name}</h4>
                                                            {wallet.institution && (
                                                                <p className="text-[10px] sm:text-xs text-slate-400">{wallet.institution}</p>
                                                            )}

                                                            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100">
                                                                <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Available Balance</p>
                                                                <div className="flex justify-between items-end">
                                                                    <p className="text-base sm:text-xl font-bold text-slate-900">
                                                                        {showBalance ? formatCompactCurrency(balanceValue) : '•••••••'}
                                                                    </p>
                                                                    <ChevronRight size={14} className="sm:w-4 sm:h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )
                        ))}
                    </AnimatePresence>

                    {/* Empty State */}
                    {wallets.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 sm:py-16"
                        >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                <Wallet size={32} className="sm:w-10 sm:h-10 text-slate-400" />
                            </div>
                            <p className="text-slate-500 font-medium mb-2 text-sm sm:text-base">No accounts yet</p>
                            <p className="text-xs sm:text-sm text-slate-400 mb-4">Start building your financial portfolio</p>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all text-sm"
                            >
                                + Add Your First Account
                            </button>
                        </motion.div>
                    )}

                    {/* Quick Actions */}
                    {wallets.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200"
                        >
                            <div className="flex justify-center gap-3 sm:gap-4">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    <Plus size={14} className="sm:w-4 sm:h-4" />
                                    Add Account
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            <AddSourcePopUp
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleWalletSuccess}
            />

            <UpdateBalancePopUp
                isOpen={isUpdateModalOpen}
                onClose={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedWallet(null);
                }}
                wallet={selectedWallet}
                onSuccess={handleWalletSuccess}
            />
        </div>
    );
}