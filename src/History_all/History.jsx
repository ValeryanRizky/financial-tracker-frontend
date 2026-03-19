import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    Download,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    PieChart,
    ArrowRight,
    Filter,
    Check,
    FileText
} from 'lucide-react';
import Sidebar from '../Sidebar/sidebar';
import { incomeService, expenseService } from '../services/transaction.service';

export default function History() {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // --- STATE FILTER ---
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedMethod, setSelectedMethod] = useState('all');
    const [exportSuccess, setExportSuccess] = useState(false);

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

    // ========== FUNGSI EXPORT CSV ==========
    const handleExportCSV = () => {
        try {
            // Filter data sesuai dengan filter yang aktif
            const filteredForExport = transactions.filter(t => {
                const matchType = filterType === 'all' || t.tipe === filterType;
                const matchCategory = selectedCategory === 'all' || t.kategori === selectedCategory;
                const matchMethod = selectedMethod === 'all' || t.metode === selectedMethod;
                const matchSearch = t.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.kategori.toLowerCase().includes(searchTerm.toLowerCase());

                return matchType && matchCategory && matchMethod && matchSearch;
            });

            // Siapkan data untuk export
            const exportData = filteredForExport.map(t => ({
                'Tanggal': new Date(t.tanggal).toLocaleDateString('id-ID'),
                'Tipe': t.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran',
                'Keterangan': t.keterangan,
                'Kategori': t.kategori,
                'Metode': t.metode,
                'Jumlah': t.jumlah,
                'Status': 'Berhasil'
            }));

            // Buat header CSV
            const headers = ['Tanggal', 'Tipe', 'Keterangan', 'Kategori', 'Metode', 'Jumlah', 'Status'];

            // Konversi ke CSV
            const csvContent = [
                headers.join(','),
                ...exportData.map(row =>
                    Object.values(row).map(value =>
                        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                    ).join(',')
                )
            ].join('\n');

            // Buat blob dan download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            // Nama file dengan timestamp
            const date = new Date().toISOString().split('T')[0];
            link.setAttribute('href', url);
            link.setAttribute('download', `riwayat_transaksi_${date}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Tampilkan notifikasi sukses
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);

        } catch (error) {
            console.error('Export error:', error);
            alert('Gagal mengekspor data. Silakan coba lagi.');
        }
    };

    // Format mata uang
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // 1. Ambil Opsi Unik untuk Dropdown secara Otomatis
    const categories = useMemo(() => {
        const unique = [...new Set(transactions.map(t => t.kategori))];
        return ['all', ...unique];
    }, [transactions]);

    const methods = useMemo(() => {
        const unique = [...new Set(transactions.map(t => t.metode))];
        return ['all', ...unique];
    }, [transactions]);

    // 2. Logika Perhitungan Ringkasan
    const stats = useMemo(() => {
        const totals = transactions.reduce((acc, curr) => {
            if (curr.tipe === 'income') acc.income += curr.jumlah;
            if (curr.tipe === 'expense') acc.expense += curr.jumlah;
            return acc;
        }, { income: 0, expense: 0 });

        const totalCombined = totals.income + totals.expense;
        return {
            totalIncome: totals.income,
            totalExpense: totals.expense,
            totalSaldo: totals.income - totals.expense,
            incomePct: totalCombined > 0 ? (totals.income / totalCombined) * 100 : 0,
            expensePct: totalCombined > 0 ? (totals.expense / totalCombined) * 100 : 0
        };
    }, [transactions]);

    // 3. Logika Filter Gabungan
    const processedData = useMemo(() => {
        let filtered = transactions.filter(t => {
            const matchType = filterType === 'all' || t.tipe === filterType;
            const matchCategory = selectedCategory === 'all' || t.kategori === selectedCategory;
            const matchMethod = selectedMethod === 'all' || t.metode === selectedMethod;
            const matchSearch = t.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.kategori.toLowerCase().includes(searchTerm.toLowerCase());

            return matchType && matchCategory && matchMethod && matchSearch;
        });

        filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

        return filtered.reduce((acc, transaction) => {
            const date = new Date(transaction.tanggal);
            const monthYear = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            if (!acc[monthYear]) acc[monthYear] = [];
            acc[monthYear].push(transaction);
            return acc;
        }, {});
    }, [transactions, filterType, searchTerm, selectedCategory, selectedMethod, refreshKey]);

    // Loading state
    if (loading && transactions.length === 0) {
        return (
            <div className="flex h-screen bg-[#F4F4F7]">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Wallet className="w-8 h-8 text-blue-600 opacity-50" />
                            </div>
                        </div>
                        <p className="mt-4 text-slate-600 font-medium">Memuat riwayat transaksi...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F4F4F7] font-sans selection:bg-blue-100 selection:text-blue-900">
            <Sidebar />

            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between mb-8 px-4">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="group p-2 hover:bg-white rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            <ArrowLeft size={20} className="text-slate-400 group-hover:text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Finansial</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                    {transactions.length} Total Transaksi
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Dropdown Filter Kategori */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 text-[11px] font-bold text-slate-700 shadow-sm outline-none hover:border-blue-200 transition-colors cursor-pointer appearance-none min-w-[130px]"
                        >
                            <option value="all"> KATEGORI</option>
                            {categories.filter(c => c !== 'all').map(cat => (
                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                            ))}
                        </select>

                        {/* Dropdown Filter Metode */}
                        <select
                            value={selectedMethod}
                            onChange={(e) => setSelectedMethod(e.target.value)}
                            className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 text-[11px] font-bold text-slate-700 shadow-sm outline-none hover:border-blue-200 transition-colors cursor-pointer appearance-none min-w-[130px]"
                        >
                            <option value="all">METODE</option>
                            {methods.filter(m => m !== 'all').map(met => (
                                <option key={met} value={met}>{met.toUpperCase()}</option>
                            ))}
                        </select>

                        {/* Search Input */}
                        <div className="bg-white/60 backdrop-blur-md border border-white rounded-2xl p-1 flex shadow-sm ml-2">
                            <div className="relative flex items-center">
                                <Search className="absolute left-4 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari transaksi..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-transparent pl-11 pr-4 py-2.5 text-sm font-medium w-48 outline-none placeholder:text-slate-300 text-slate-700"
                                />
                            </div>
                        </div>

                        {/* Tombol Export CSV */}
                        <motion.button
                            onClick={handleExportCSV}
                            disabled={transactions.length === 0}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-slate-900 font-bold text-xs hover:shadow-xl transition-all shadow-sm ${transactions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {exportSuccess ? (
                                <>
                                    <Check size={14} className="text-emerald-600" />
                                    <span className="text-emerald-600">CSV Tersimpan!</span>
                                </>
                            ) : (
                                <>
                                    <Download size={14} />
                                    <span>Export CSV</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* LIST TRANSAKSI */}
                    <div className="flex-[1.5] flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
                            <div className="flex gap-8">
                                {[
                                    { id: 'all', label: 'Semua' },
                                    { id: 'income', label: 'Masuk' },
                                    { id: 'expense', label: 'Keluar' }
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setFilterType(t.id)}
                                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${filterType === t.id ? 'text-blue-600' : 'text-slate-300 hover:text-slate-500'}`}
                                    >
                                        {t.label}
                                        {filterType === t.id && (
                                            <motion.div layoutId="bar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {Object.keys(processedData).length > 0 ? (
                                    Object.keys(processedData).map((month) => (
                                        <div key={month} className="mb-8">
                                            <div className="px-4 py-2 mb-2">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{month}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {processedData[month].map((item) => (
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        key={item.id}
                                                        className="group flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-[#F8FAFC] transition-all duration-300"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-11 h-11 rounded-[1.1rem] flex items-center justify-center transition-all duration-500 group-hover:rotate-[360deg] ${item.tipe === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                {item.tipe === 'income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800 tracking-tight">{item.keterangan}</p>
                                                                <div className="flex gap-2 mt-0.5">
                                                                    <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{item.metode}</span>
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide py-0.5">{item.kategori}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className={`text-sm font-black tracking-tight ${item.tipe === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                                    {item.tipe === 'income' ? '+' : '-'} {formatCurrency(item.jumlah)}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-0.5">
                                                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                                </p>
                                                            </div>
                                                            <ArrowRight size={14} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 py-20">
                                        <FileText size={40} strokeWidth={1} />
                                        <p className="text-xs font-bold uppercase tracking-widest">
                                            {searchTerm ? 'Tidak ada data yang cocok' : 'Belum ada transaksi'}
                                        </p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* RIGHT PANEL (RINGKASAN) */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Saldo Card */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-150 transition-transform duration-700">
                                <Wallet size={120} />
                            </div>
                            <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 italic">Saldo Bersih</h4>
                            <p className="text-3xl font-bold tracking-tighter mb-8">
                                {formatCurrency(stats.totalSaldo)}
                            </p>
                            <div className="flex justify-between items-center text-slate-400 text-sm border-t border-slate-800 pt-4">
                                <span>Total Transaksi</span>
                                <span className="font-bold text-white">{transactions.length} kali</span>
                            </div>
                        </div>

                        {/* Ringkasan Card */}
                        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <PieChart size={20} />
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Ringkasan Global</h4>
                            </div>

                            <div className="space-y-8">
                                {/* Progress Bar Pemasukan */}
                                <div>
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-2">
                                        <span className="text-slate-400">Total Masuk</span>
                                        <span className="text-emerald-600">{formatCurrency(stats.totalIncome)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats.incomePct}%` }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Progress Bar Pengeluaran */}
                                <div>
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-2">
                                        <span className="text-slate-400">Total Keluar</span>
                                        <span className="text-rose-600">{formatCurrency(stats.totalExpense)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stats.expensePct}%` }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className="h-full bg-rose-500"
                                        />
                                    </div>
                                </div>

                                {/* Informasi Tambahan */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Tertua</p>
                                        <p className="text-xs font-bold text-slate-800 mt-1">
                                            {transactions.length > 0
                                                ? new Date(transactions[transactions.length - 1]?.tanggal).toLocaleDateString('id-ID')
                                                : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Terbaru</p>
                                        <p className="text-xs font-bold text-slate-800 mt-1">
                                            {transactions.length > 0
                                                ? new Date(transactions[0]?.tanggal).toLocaleDateString('id-ID')
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}