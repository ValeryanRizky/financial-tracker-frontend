import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
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

    // Fetch data dari backend
    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const [incomes, expenses] = await Promise.all([
                incomeService.getAll({ limit: 1000 }),
                expenseService.getAll({ limit: 1000 })
            ]);

            // Gabungkan incomes dan expenses
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

            // Sort by date (newest first)
            allTransactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

            setTransactions(allTransactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data saat pertama render
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions, refreshKey]);

    // 🔥 Event listener untuk refresh ketika transaksi ditambahkan
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

    // Hitung statistik dari data real
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

    // Ambil 5 transaksi terbaru
    const recentTransactions = useMemo(() => {
        return transactions.slice(0, 5);
    }, [transactions]);

    // Loading state
    if (loading && transactions.length === 0) {
        return (
            <div className="flex min-h-screen bg-[#F4F4F7] items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-bold">Loading transactions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F4F4F7] font-sans antialiased text-slate-900">
            <Sidebar />

            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-5xl mx-auto">

                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Riwayat Transaksi</h1>
                            <p className="text-slate-500 mt-2">Kelola dan lihat semua transaksi Anda</p>
                        </div>
                    </header>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            {
                                label: 'Total Saldo',
                                value: stats.totalSaldo,
                                icon: <Wallet size={22} />,
                                color: 'bg-indigo-600',
                                path: null
                            },
                            {
                                label: 'Pemasukan',
                                value: stats.totalIncome,
                                icon: <ArrowDownLeft size={22} />,
                                color: 'bg-emerald-500',
                                path: '/Income-History'
                            },
                            {
                                label: 'Pengeluaran',
                                value: stats.totalExpense,
                                icon: <ArrowUpRight size={22} />,
                                color: 'bg-rose-500',
                                path: '/expense-History'
                            },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={item.path ? { y: -4 } : {}}
                                onClick={() => item.path && navigate(item.path)}
                                className={`bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60 flex items-center gap-5 transition-all ${item.path ? 'cursor-pointer hover:shadow-md' : ''}`}
                            >
                                <div className={`${item.color} p-3.5 rounded-2xl text-white shadow-lg shadow-current/20`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-0.5">{item.label}</p>
                                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                                        {formatCurrency(item.value)}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
                        <div className="p-8 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                    <ArrowUpDown size={18} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">Aktivitas Terakhir</h3>
                                {transactions.length > 0 && (
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                        {transactions.length} total
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => navigate('/History')}
                                className="group flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors py-2 px-4 rounded-lg hover:bg-blue-50"
                            >
                                Lihat Semua
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="divide-y divide-slate-50">
                            {transactions.length > 0 ? (
                                <AnimatePresence mode="popLayout">
                                    {recentTransactions.map((item, index) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ delay: index * 0.04 }}
                                            key={item.id}
                                            className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${item.tipe === 'income'
                                                    ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'
                                                    : 'bg-rose-50 text-rose-600 group-hover:bg-rose-500 group-hover:text-white'
                                                    }`}>
                                                    {item.tipe === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                        {item.keterangan}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[12px] font-medium text-slate-400 capitalize">
                                                            {item.kategori}
                                                        </span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span className="text-[12px] text-slate-400 font-medium">
                                                            {new Date(item.tanggal).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold tracking-tight ${item.tipe === 'income' ? 'text-emerald-600' : 'text-slate-900'
                                                        }`}>
                                                        {item.tipe === 'income' ? '+' : '-'} {formatCurrency(item.jumlah).replace('Rp', 'Rp ')}
                                                    </p>
                                                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                                                        {item.metode}
                                                    </p>
                                                </div>
                                                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Wallet size={32} className="text-slate-300" />
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