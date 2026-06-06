import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar/sidebar";
import PopUp from "./Popup/popup";
import { incomeService, expenseService } from "./services/transaction.service";
import { authService } from "./services/auth.service";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    FiPlus,
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiUser,
    FiTrendingUp,
    FiTrendingDown,
    FiBarChart2,
    FiMoreVertical,
    FiDollarSign
} from 'react-icons/fi';

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1e40af'];

export default function Dashboard() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [userName, setUserName] = useState('User');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const fetchUser = useCallback(async () => {
        try {
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                setUserName(currentUser.name || currentUser.username || 'User');
            }
            const response = await authService.getProfile();
            if (response?.success && response?.data) {
                const userData = response.data;
                setUserName(userData.name || userData.username || 'User');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            const user = authService.getCurrentUser();
            if (user) {
                setUserName(user.name || user.username || 'User');
            }
        }
    }, []);

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
                keterangan: inc.description || 'Income',
                tanggal: inc.date,
                paymentMethod: inc.paymentMethod,
                createdAt: inc.createdAt
            })) || [];

            const expenseTransactions = expenses.data?.expenses?.map(exp => ({
                id: exp.id,
                tipe: 'expense',
                jumlah: exp.amount,
                kategori: exp.category,
                keterangan: exp.description || 'Expense',
                tanggal: exp.date,
                paymentMethod: exp.paymentMethod,
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
        fetchUser();
        fetchTransactions();
    }, [fetchUser, fetchTransactions, refreshKey]);

    const handlePrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const handleTransactionSuccess = async (type) => {
        await fetchTransactions();
        setRefreshKey(prev => prev + 1);
        setIsModalOpen(false);
    };

    const formatIDR = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.tanggal);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        });
    }, [transactions, selectedMonth, selectedYear, refreshKey]);

    const stats = useMemo(() => {
        const income = filteredTransactions.filter(t => t.tipe === "income").reduce((sum, item) => sum + item.jumlah, 0);
        const expense = filteredTransactions.filter(t => t.tipe === "expense").reduce((sum, item) => sum + item.jumlah, 0);
        return {
            balance: income - expense,
            income: income,
            expense: expense,
            transactionCount: filteredTransactions.length
        };
    }, [filteredTransactions, refreshKey]);

    const dataBar = useMemo(() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(selectedYear, selectedMonth - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth();
            const monthTransactions = transactions.filter(t => {
                const tDate = new Date(t.tanggal);
                return tDate.getFullYear() === year && tDate.getMonth() === month;
            });
            const income = monthTransactions.filter(t => t.tipe === 'income').reduce((sum, t) => sum + t.jumlah, 0);
            const expense = monthTransactions.filter(t => t.tipe === 'expense').reduce((sum, t) => sum + t.jumlah, 0);
            months.push({
                name: monthNames[month].substring(0, 3),
                income,
                expense,
                month: month
            });
        }
        return months;
    }, [transactions, selectedMonth, selectedYear, refreshKey]);

    const dataPie = useMemo(() => {
        const expenseOnly = filteredTransactions.filter(t => t.tipe === "expense");
        const grouped = expenseOnly.reduce((acc, curr) => {
            acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.jumlah;
            return acc;
        }, {});
        return Object.keys(grouped).map(key => ({
            name: key,
            value: grouped[key]
        })).sort((a, b) => b.value - a.value);
    }, [filteredTransactions, refreshKey]);

    if (loading && transactions.length === 0) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
                    <p className="text-slate-500 font-medium">Loading your finances...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 font-sans">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                <FiUser size={20} className="sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-2xl font-bold text-slate-800">
                                    Welcome back, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        {userName}!
                                    </span>
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
                                    {monthNames[selectedMonth]} {selectedYear}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-1 sm:gap-2 bg-white/80 backdrop-blur-sm p-1 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm">
                                <button onClick={handlePrevMonth} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all">
                                    <FiChevronLeft size={14} className="sm:w-5 sm:h-5 text-slate-500" />
                                </button>
                                <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3">
                                    <FiCalendar size={12} className="sm:w-5 sm:h-5 text-blue-500" />
                                    <span className="font-semibold text-slate-700 text-xs sm:text-sm">
                                        {monthNames[selectedMonth]} {selectedYear}
                                    </span>
                                </div>
                                <button onClick={handleNextMonth} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all">
                                    <FiChevronRight size={14} className="sm:w-5 sm:h-5 text-slate-500" />
                                </button>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 text-xs sm:text-sm"
                            >
                                <FiPlus size={14} className="sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Add Transaction</span>
                                <span className="sm:hidden">Add</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards - 3 Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
                        {/* Balance Card */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all border border-slate-100">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center">
                                    <FiDollarSign size={16} className="sm:w-6 sm:h-6 text-blue-600" />
                                </div>
                                <span className="text-[10px] sm:text-xs font-medium text-slate-400">Balance</span>
                            </div>
                            <h3 className="text-xl sm:text-3xl font-bold text-slate-800">
                                {formatIDR(stats.balance)}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">
                                {stats.transactionCount} transactions
                            </p>
                        </div>

                        {/* Income Card */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all border border-slate-100">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <FiTrendingUp size={16} className="sm:w-6 sm:h-6 text-emerald-600" />
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-3xl font-bold text-slate-800">
                                {formatIDR(stats.income)}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">Total Income</p>
                        </div>

                        {/* Expense Card */}
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all border border-slate-100">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-rose-50 flex items-center justify-center">
                                    <FiTrendingDown size={16} className="sm:w-6 sm:h-6 text-rose-600" />
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-3xl font-bold text-slate-800">
                                {formatIDR(stats.expense)}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">Total Expense</p>
                        </div>
                    </div>

                    {/* Charts - Hanya tampil di desktop (md ke atas) */}
                    <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Bar Chart */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <FiBarChart2 size={20} className="text-blue-600" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800">Money Flow Analysis</h4>
                                </div>
                                <FiMoreVertical size={18} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                            </div>
                            <div className="h-[300px] w-full">
                                {dataBar.some(d => d.income > 0 || d.expense > 0) ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dataBar} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(value) => formatIDR(value).replace('Rp', '')} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '8px 12px' }} formatter={(value) => formatIDR(value)} />
                                            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[8, 8, 0, 0]} barSize={32} />
                                            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">No transaction data available</div>
                                )}
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h4 className="text-lg font-bold text-slate-800 mb-6">Expense Breakdown</h4>
                            <div className="h-[220px] w-full relative">
                                {dataPie.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={dataPie} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                                                {dataPie.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val) => formatIDR(val)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">No expense data</div>
                                )}
                            </div>
                            <div className="mt-6 space-y-2">
                                {dataPie.slice(0, 4).map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm py-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="text-slate-600 font-medium">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-slate-800">{formatIDR(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions - Responsive */}
                    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h4 className="text-base sm:text-lg font-bold text-slate-800">Recent Transactions</h4>
                            <button onClick={() => navigate('/history')} className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors flex items-center gap-1">
                                View All <FiChevronRight size={12} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            {filteredTransactions.length > 0 ? (
                                <table className="w-full min-w-[500px]">
                                    <thead>
                                        <tr className="text-left border-b border-slate-100">
                                            <th className="pb-3 px-2 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                                            <th className="pb-3 px-2 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                                            <th className="pb-3 px-2 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                                            <th className="pb-3 px-2 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredTransactions.slice(0, 5).map((tx, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-2 text-xs sm:text-sm text-slate-500">
                                                    {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm ${tx.tipe === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                            {tx.keterangan[0]?.toUpperCase()}
                                                        </div>
                                                        <span className="text-xs sm:text-sm font-medium text-slate-700 truncate max-w-[100px] sm:max-w-none">{tx.keterangan}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[10px] font-bold uppercase ${tx.tipe === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        {tx.kategori}
                                                    </span>
                                                </td>
                                                <td className={`py-3 px-2 text-right text-xs sm:text-sm font-bold ${tx.tipe === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {tx.tipe === 'income' ? '+' : '-'}{formatIDR(tx.jumlah)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-8 sm:py-12">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                        <FiDollarSign size={20} className="sm:w-7 sm:h-7 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-medium text-sm sm:text-base">No transactions found</p>
                                    <p className="text-xs text-slate-400 mt-1">Start by adding your first transaction</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <PopUp isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleTransactionSuccess} />
        </div>
    );
}