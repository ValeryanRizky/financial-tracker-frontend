import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    PieChart as PieIcon,
    Activity,
    Calendar,
    Download
} from 'lucide-react';
import Sidebar from '../Sidebar/sidebar';
import { incomeService, expenseService } from '../services/transaction.service';

export default function AnalyticsPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Fetch data dari backend
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

    // Load data saat pertama render
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions, refreshKey]);

    // Event listener untuk refresh
    useEffect(() => {
        const handleTransactionAdded = () => {
            setRefreshKey(prev => prev + 1);
        };
        window.addEventListener('transaction-added', handleTransactionAdded);
        return () => window.removeEventListener('transaction-added', handleTransactionAdded);
    }, []);

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(val);

    // Process data untuk analytics
    const processedData = useMemo(() => {
        // Filter transaksi berdasarkan bulan yang dipilih
        const monthTransactions = transactions.filter(t => {
            const date = new Date(t.tanggal);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
        });

        // Daily expense untuk area chart (bulan yang dipilih)
        const dailyExpense = monthTransactions
            .filter(t => t.tipe === 'expense')
            .reduce((acc, curr) => {
                const date = new Date(curr.tanggal);
                const day = date.getDate();
                acc[day] = (acc[day] || 0) + curr.jumlah;
                return acc;
            }, {});

        const areaChartData = Object.keys(dailyExpense).map(day => ({
            day: `${monthNames[selectedMonth].substring(0, 3)} ${day}`,
            amount: dailyExpense[day]
        })).sort((a, b) => {
            const dayA = parseInt(a.day.split(' ')[1]);
            const dayB = parseInt(b.day.split(' ')[1]);
            return dayA - dayB;
        });

        // Data untuk Pie Chart (Distribusi Kategori Expense)
        const categoryMap = monthTransactions
            .filter(t => t.tipe === 'expense')
            .reduce((acc, curr) => {
                acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.jumlah;
                return acc;
            }, {});

        const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#a855f7'];
        const pieChartData = Object.keys(categoryMap).map((cat, i) => ({
            name: cat,
            value: categoryMap[cat],
            color: COLORS[i % COLORS.length]
        })).sort((a, b) => b.value - a.value);

        // Hitung Insight untuk bulan yang dipilih
        const totalIncome = monthTransactions
            .filter(t => t.tipe === 'income')
            .reduce((a, b) => a + b.jumlah, 0);
        const totalExpense = monthTransactions
            .filter(t => t.tipe === 'expense')
            .reduce((a, b) => a + b.jumlah, 0);

        const expenseCount = monthTransactions.filter(t => t.tipe === 'expense').length;

        // Data untuk CSV (semua transaksi bulan ini)
        const csvData = monthTransactions.map(t => ({
            Tanggal: new Date(t.tanggal).toLocaleDateString('id-ID'),
            Tipe: t.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran',
            Kategori: t.kategori,
            Deskripsi: t.keterangan,
            Jumlah: t.jumlah,
            Metode: t.metode || '-'
        }));

        return {
            areaChartData,
            pieChartData,
            totalIncome,
            totalExpense,
            expenseCount,
            selectedMonthName: monthNames[selectedMonth],
            selectedYear,
            csvData
        };
    }, [transactions, selectedMonth, selectedYear, refreshKey]);

    // 🔥 FUNGSI DOWNLOAD CSV
    const downloadCSV = () => {
        if (processedData.csvData.length === 0) {
            alert('Tidak ada data untuk bulan ini');
            return;
        }

        // Header CSV
        const headers = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah', 'Metode'];

        // Convert data ke format CSV
        const csvRows = [];
        csvRows.push(headers.join(','));

        for (const row of processedData.csvData) {
            const values = headers.map(header => {
                let value = row[header];
                // Format jumlah ke angka tanpa desimal
                if (header === 'Jumlah') {
                    value = value.toString();
                }
                // Escape quotes dan wrap dengan quotes jika ada koma
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }

        // Tambahkan summary di akhir
        csvRows.push('');
        csvRows.push('SUMMARY,,' + `Periode: ${processedData.selectedMonthName} ${processedData.selectedYear}`);
        csvRows.push(`Total Pemasukan,,${processedData.totalIncome}`);
        csvRows.push(`Total Pengeluaran,,${processedData.totalExpense}`);
        csvRows.push(`Selisih,,${processedData.totalIncome - processedData.totalExpense}`);

        // Buat file dan download
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `analytics_${processedData.selectedMonthName}_${processedData.selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Handle month change
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

    // Loading state
    if (loading && transactions.length === 0) {
        return (
            <div className="flex h-screen bg-[#F8FAFC]">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Activity className="w-8 h-8 text-blue-600 opacity-50" />
                            </div>
                        </div>
                        <p className="mt-4 text-slate-600 font-medium">Memuat data analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto">
                {/* --- HEADER with Month Selector and Download Button --- */}
                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Analytics Center</h1>
                        <p className="text-slate-500 mt-2">Analisis keuangan Anda secara mendalam</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Month Selector */}
                        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200/50 shadow-sm">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                <Calendar size={18} className="text-slate-500" />
                            </button>

                            <div className="flex items-center gap-2 px-3">
                                <span className="font-bold text-slate-700">
                                    {processedData.selectedMonthName} {processedData.selectedYear}
                                </span>
                            </div>

                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                <Calendar size={18} className="text-slate-500" />
                            </button>
                        </div>

                        {/* 🔥 DOWNLOAD CSV BUTTON */}
                        <button
                            onClick={downloadCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-2xl font-bold shadow-sm hover:bg-emerald-700 transition-all active:scale-95"
                        >
                            <Download size={16} />
                            <span className="text-sm">Export CSV</span>
                        </button>
                    </div>
                </header>

                {/* --- INSIGHT CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {/* Total Income Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group"
                    >
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Total Income • {processedData.selectedMonthName}
                            </p>
                            <h3 className="text-2xl font-black text-slate-900">{formatIDR(processedData.totalIncome)}</h3>
                            <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold text-xs bg-emerald-50 w-fit px-3 py-1 rounded-full">
                                <ArrowUpRight size={14} /> Income
                            </div>
                        </div>
                        <Activity className="absolute right-[-10px] bottom-[-10px] size-24 text-slate-50 group-hover:text-blue-50 transition-colors" />
                    </motion.div>

                    {/* Total Expenses Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100"
                    >
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Total Expenses • {processedData.selectedMonthName}
                        </p>
                        <h3 className="text-2xl font-black text-slate-900">{formatIDR(processedData.totalExpense)}</h3>
                        <div className="mt-4 flex items-center gap-2 text-rose-500 font-bold text-xs bg-rose-50 w-fit px-3 py-1 rounded-full">
                            <ArrowDownRight size={14} /> {processedData.expenseCount} Transactions
                        </div>
                    </motion.div>
                </div>

                {/* --- MAIN CHARTS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* AREA CHART - DAILY EXPENSE TREND */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-slate-800 flex items-center gap-3 italic">
                                <TrendingUp className="text-blue-600" />
                                DAILY EXPENSE FLOW • {processedData.selectedMonthName} {processedData.selectedYear}
                            </h3>
                            {processedData.areaChartData.length === 0 && (
                                <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                                    No data for this month
                                </span>
                            )}
                        </div>
                        <div className="h-[350px]">
                            {processedData.areaChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={processedData.areaChartData}>
                                        <defs>
                                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            tickFormatter={(value) => formatIDR(value).replace('Rp', '')}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '24px',
                                                border: 'none',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                            }}
                                            formatter={(val) => formatIDR(val)}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorAmt)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    No expense data available for this month
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* PIE CHART - CATEGORY DISTRIBUTION */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="lg:col-span-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center"
                    >
                        <div className="flex items-center justify-between w-full mb-4">
                            <h3 className="font-black text-slate-800 flex items-center gap-3 italic">
                                <PieIcon className="text-rose-500" /> CATEGORY SPLIT
                            </h3>
                            {processedData.pieChartData.length === 0 && (
                                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                    No data
                                </span>
                            )}
                        </div>
                        <div className="h-[280px] w-full">
                            {processedData.pieChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={processedData.pieChartData}
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {processedData.pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
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
                        <div className="w-full space-y-3 mt-6 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                            {processedData.pieChartData.slice(0, 6).map((item) => (
                                <div key={item.name} className="flex justify-between items-center text-xs font-bold">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                                        <span className="text-slate-500">{item.name}</span>
                                    </div>
                                    <span className="text-slate-900">{formatIDR(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Additional Insights */}
                {processedData.pieChartData.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-8 bg-white/60 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-100"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50/50 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1">Top Category</p>
                                <p className="font-bold text-slate-900">
                                    {processedData.pieChartData[0]?.name || '-'}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    {processedData.pieChartData[0] ? formatIDR(processedData.pieChartData[0].value) : '-'}
                                </p>
                            </div>
                            <div className="p-4 bg-emerald-50/50 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1">Average Daily Expense</p>
                                <p className="font-bold text-slate-900">
                                    {processedData.areaChartData.length > 0
                                        ? formatIDR(processedData.totalExpense / processedData.areaChartData.length)
                                        : '-'
                                    }
                                </p>
                            </div>
                            <div className="p-4 bg-rose-50/50 rounded-xl">
                                <p className="text-xs text-slate-500 mb-1">Income vs Expense</p>
                                <p className="font-bold text-slate-900">
                                    {processedData.totalIncome > processedData.totalExpense ? 'Surplus' : 'Deficit'}
                                </p>
                                <p className="text-xs text-rose-600 mt-1">
                                    {formatIDR(Math.abs(processedData.totalIncome - processedData.totalExpense))}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}