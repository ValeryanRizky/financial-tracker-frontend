import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    ArrowUpDown
} from 'lucide-react';
import Sidebar from '../Sidebar/sidebar';
import { incomeService, expenseService } from '../services/transaction.service';

export default function Transactions() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const [incomes, expenses] = await Promise.all([
                incomeService.getAll({ limit: 1000 }),
                expenseService.getAll({ limit: 1000 })
            ]);

            const incomeTransactions = incomes.data?.incomes?.map(inc => ({
                id: inc.id,
                tipe: 'income',
                jumlah: inc.amount,
                kategori: inc.category,
                keterangan: inc.description || 'Pemasukan',
                tanggal: inc.date,
                metode: inc.paymentMethod,
                createdAt: inc.createdAt
            })) || [];

            const expenseTransactions = expenses.data?.expenses?.map(exp => ({
                id: exp.id,
                tipe: 'expense',
                jumlah: exp.amount,
                kategori: exp.category,
                keterangan: exp.description || 'Pengeluaran',
                tanggal: exp.date,
                metode: exp.paymentMethod,
                createdAt: exp.createdAt
            })) || [];

            const allTransactions = [...incomeTransactions, ...expenseTransactions];
            allTransactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
            setTransactions(allTransactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions, refreshKey]);

    useEffect(() => {
        const handleTransactionAdded = () => {
            setRefreshKey(prev => prev + 1);
        };
        window.addEventListener('transaction-added', handleTransactionAdded);
        return () => {
            window.removeEventListener('transaction-added', handleTransactionAdded);
        };
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const stats = useMemo(() => {
        const income = transactions
            .filter(t => t.tipe === "income")
            .reduce((sum, item) => sum + item.jumlah, 0);
        const expense = transactions
            .filter(t => t.tipe === "expense")
            .reduce((sum, item) => sum + item.jumlah, 0);
        return {
            totalSaldo: income - expense,
            totalIncome: income,
            totalExpense: expense
        };
    }, [transactions]);

    const recentTransactions = useMemo(() => {
        return transactions.slice(0, 5);
    }, [transactions]);

    if (loading && transactions.length === 0) {
        return (
            <div className="flex min-h-screen bg-[#F4F4F7] items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Memuat transaksi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F4F4F7] font-sans">
            <Sidebar />

            <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
                            Riwayat Transaksi
                        </h1>
                        <p className="text-slate-500 text-base mt-2">
                            Kelola dan lihat semua transaksi Anda
                        </p>
                    </div>

                    {/* 3 Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                                    <Wallet size={22} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 font-medium">Total Saldo</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(stats.totalSaldo)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/Income-History')}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                                    <ArrowDownLeft size={22} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 font-medium">Pemasukan</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(stats.totalIncome)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div
                            onClick={() => navigate('/expense-History')}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow-sm">
                                    <ArrowUpRight size={22} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400 font-medium">Pengeluaran</p>
                                    <p className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(stats.totalExpense)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {/* Section Header - Responsive */}
                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                            {/* Desktop Layout */}
                            <div className="hidden sm:flex sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <ArrowUpDown size={16} className="text-blue-500" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-slate-700">Aktivitas Terakhir</h3>
                                    {transactions.length > 0 && (
                                        <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                            {transactions.length} total
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => navigate('/History')}
                                    className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                                >
                                    Lihat Semua
                                    <ChevronRight size={14} />
                                </button>
                            </div>

                            {/* Mobile Layout - DIPERBAIKI agar sejajar */}
                            <div className="flex sm:hidden items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <ArrowUpDown size={14} className="text-blue-500" />
                                    </div>
                                    <h3 className="text-xs font-semibold text-slate-700">Aktivitas Terakhir</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {transactions.length > 0 && (
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                                            {transactions.length} total
                                        </span>
                                    )}
                                    <button
                                        onClick={() => navigate('/History')}
                                        className="text-[10px] font-medium text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-0.5"
                                    >
                                        Lihat Semua
                                        <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Transaction List - Responsive Mobile */}
                        <div className="divide-y divide-slate-50">
                            {transactions.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {recentTransactions.map((item, index) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            key={item.id}
                                            className="px-4 sm:px-6 py-4 sm:py-5 hover:bg-slate-50/50 transition-all"
                                        >
                                            {/* Desktop Layout */}
                                            <div className="hidden sm:flex sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.tipe === 'income'
                                                            ? 'bg-emerald-50 text-emerald-500'
                                                            : 'bg-rose-50 text-rose-500'
                                                        }`}>
                                                        {item.tipe === 'income'
                                                            ? <ArrowDownLeft size={20} />
                                                            : <ArrowUpRight size={20} />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-semibold text-slate-800">
                                                            {item.keterangan}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {item.kategori} • {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-base font-bold ${item.tipe === 'income' ? 'text-emerald-600' : 'text-slate-800'
                                                        }`}>
                                                        {item.tipe === 'income' ? '+' : '-'} {formatCurrency(item.jumlah)}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        {item.metode}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Mobile Layout */}
                                            <div className="flex flex-col sm:hidden gap-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.tipe === 'income'
                                                                ? 'bg-emerald-50 text-emerald-500'
                                                                : 'bg-rose-50 text-rose-500'
                                                            }`}>
                                                            {item.tipe === 'income'
                                                                ? <ArrowDownLeft size={14} />
                                                                : <ArrowUpRight size={14} />
                                                            }
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-800">
                                                                {item.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                {item.kategori}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-xs font-bold ${item.tipe === 'income' ? 'text-emerald-600' : 'text-slate-800'
                                                            }`}>
                                                            {item.tipe === 'income' ? '+' : '-'} {formatCurrency(item.jumlah)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-1">
                                                    <p className="text-[10px] text-slate-500 truncate max-w-[180px]">
                                                        {item.keterangan}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                                        {item.metode}
                                                    </p>
                                                </div>
                                                <p className="text-[9px] text-slate-400">
                                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Wallet size={28} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-medium">Belum ada transaksi</p>
                                    <p className="text-sm text-slate-300 mt-1">Tambahkan transaksi baru untuk mulai</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}