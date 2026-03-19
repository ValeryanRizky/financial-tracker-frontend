import React, { useState, useMemo, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar/sidebar";
import PopUp from "./Popup/popup";
import { incomeService, expenseService } from "./services/transaction.service";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    HiOutlinePlus,
    HiOutlineCalendarDays,
    HiOutlineChevronLeft,
    HiOutlineChevronRight
} from "react-icons/hi2";

const COLORS = ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe', '#1d4ed8'];

export default function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // State untuk filter tanggal
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Nama bulan dalam Bahasa Indonesia
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Fetch data dari backend
    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Fetching transactions...');

            const [incomes, expenses] = await Promise.all([
                incomeService.getAll({ limit: 1000 }),
                expenseService.getAll({ limit: 1000 })
            ]);

            console.log('Incomes:', incomes);
            console.log('Expenses:', expenses);

            // 🔥 PERBAIKAN: Pisahkan dengan jelas
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
                createdAt: exp.createdAt  // 🔥 PAKAI exp.createdAt, BUKAN inc.createdAt
            })) || [];

            // Gabungkan incomes dan expenses
            const allTransactions = [...incomeTransactions, ...expenseTransactions];

            // Sort by date (newest first)
            allTransactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

            console.log('All transactions:', allTransactions);
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
        console.log('Transaction added, refreshing...');
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

    // Filter transaksi berdasarkan bulan dan tahun yang dipilih
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.tanggal);
            return date.getMonth() === selectedMonth &&
                date.getFullYear() === selectedYear;
        });
    }, [transactions, selectedMonth, selectedYear, refreshKey]);

    // Hitung statistik tanpa growth
    const stats = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.tipe === "income")
            .reduce((sum, item) => sum + item.jumlah, 0);
        const expense = filteredTransactions
            .filter(t => t.tipe === "expense")
            .reduce((sum, item) => sum + item.jumlah, 0);

        const currentBalance = income - expense;

        return {
            balance: currentBalance,
            income: income,
            expense: expense,
            savings: currentBalance * 0.3,
        };
    }, [filteredTransactions, refreshKey]);

    // Data untuk bar chart (6 bulan terakhir)
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

            const income = monthTransactions
                .filter(t => t.tipe === 'income')
                .reduce((sum, t) => sum + t.jumlah, 0);

            const expense = monthTransactions
                .filter(t => t.tipe === 'expense')
                .reduce((sum, t) => sum + t.jumlah, 0);

            months.push({
                name: monthNames[month].substring(0, 3),
                income,
                expense
            });
        }
        return months;
    }, [transactions, selectedMonth, selectedYear, refreshKey]);

    // Data untuk pie chart
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
            <div className="flex min-h-screen bg-[#F4F4F7] items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-bold">Loading transactions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F4F4F7] font-sans selection:bg-blue-100 relative">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                {/* Header dengan kalender dan tombol add */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    {/* Calendar Navigation */}
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200/50 shadow-sm">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <HiOutlineChevronLeft size={18} className="text-slate-500" />
                        </button>

                        <div className="flex items-center gap-2 px-3">
                            <HiOutlineCalendarDays size={20} className="text-blue-500" />
                            <span className="font-bold text-slate-700">
                                {monthNames[selectedMonth]} {selectedYear}
                            </span>
                        </div>

                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            <HiOutlineChevronRight size={18} className="text-slate-500" />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        <HiOutlinePlus size={20} /> Add Transaction
                    </button>
                </div>

                {/* Stats Cards - Tanpa Growth */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        label="Total balance"
                        value={stats.balance}
                        formatIDR={formatIDR}
                    />
                    <StatCard
                        label="Income"
                        value={stats.income}
                        formatIDR={formatIDR}
                    />
                    <StatCard
                        label="Expense"
                        value={stats.expense}
                        formatIDR={formatIDR}
                    />
                    <StatCard
                        label="Total savings"
                        value={stats.savings}
                        formatIDR={formatIDR}
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Bar Chart */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h4 className="text-xl font-bold text-slate-800 mb-6">Money Flow</h4>
                        <div className="h-[320px] w-full">
                            {dataBar.some(d => d.income > 0 || d.expense > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dataBar}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                            tickFormatter={(value) => formatIDR(value).replace('Rp', '')}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px rgba(0,0,0,0.05)',
                                                padding: '10px 14px'
                                            }}
                                            formatter={(value) => formatIDR(value)}
                                        />
                                        <Bar
                                            dataKey="income"
                                            name="Income"
                                            fill="#22c55e"
                                            radius={[6, 6, 0, 0]}
                                            barSize={24}
                                        />
                                        <Bar
                                            dataKey="expense"
                                            name="Expense"
                                            fill="#ef4444"
                                            radius={[6, 6, 0, 0]}
                                            barSize={24}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    No transaction data
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
                        <h4 className="text-xl font-bold text-slate-800 self-start mb-6">
                            Budget Distribution
                        </h4>
                        <div className="h-[250px] w-full relative">
                            {dataPie.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dataPie}
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {dataPie.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    cornerRadius={8}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val) => formatIDR(val)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    No expense data
                                </div>
                            )}
                        </div>
                        <div className="w-full mt-6 space-y-3">
                            {dataPie.slice(0, 4).map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        <span className="text-slate-500 font-bold">{item.name}</span>
                                    </div>
                                    <span className="font-black text-slate-800">{formatIDR(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions Table */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h4 className="text-xl font-bold text-slate-800 mb-6 px-2">
                        Recent Transactions
                    </h4>
                    <div className="overflow-x-auto">
                        {filteredTransactions.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-slate-400 border-b border-slate-100">
                                        <th className="pb-4 px-4 font-bold uppercase text-[10px]">Date</th>
                                        <th className="pb-4 px-4 font-bold uppercase text-[10px]">Amount</th>
                                        <th className="pb-4 px-4 font-bold uppercase text-[10px]">Description</th>
                                        <th className="pb-4 px-4 font-bold uppercase text-[10px]">Category</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredTransactions.slice(0, 5).map((tx, i) => (
                                        <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-4 text-sm font-bold text-slate-500">
                                                {new Date(tx.tanggal).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className={`py-4 px-4 text-sm font-black ${tx.tipe === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {tx.tipe === 'income' ? '+' : '-'}{formatIDR(tx.jumlah)}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs font-black shadow-sm">
                                                        {tx.keterangan[0]?.toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800">{tx.keterangan}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase">
                                                    {tx.kategori}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                No transactions found
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <PopUp
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleTransactionSuccess}
            />
        </div>
    );
}

// Komponen StatCard tanpa growth
const StatCard = ({ label, value, formatIDR }) => (
    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
        <p className="text-slate-400 font-bold text-sm mb-2">{label}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {formatIDR(value)}
        </h3>
    </div>
);