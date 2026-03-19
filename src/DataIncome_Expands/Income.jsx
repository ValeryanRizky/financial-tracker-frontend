import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    Download,
    ArrowDownLeft,
    TrendingUp,
    BarChart3,
    ArrowRight,
    FileText,
    Check
} from 'lucide-react';
import Sidebar from '../Sidebar/sidebar';
import { incomeService } from '../services/transaction.service';

export default function Income() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [exportSuccess, setExportSuccess] = useState(false);

    // Fetch data dari backend
    const fetchIncomes = useCallback(async () => {
        try {
            setLoading(true);
            const response = await incomeService.getAll({ limit: 1000 });

            const incomeData = response.data?.incomes?.map(inc => ({
                id: inc.id,
                tipe: 'income',
                jumlah: inc.amount,
                kategori: inc.category,
                keterangan: inc.description || 'Pemasukan',
                tanggal: inc.date,
                metode: inc.paymentMethod,
                createdAt: inc.createdAt
            })) || [];

            setIncomes(incomeData);
        } catch (error) {
            console.error('Error fetching incomes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load data saat pertama render
    useEffect(() => {
        fetchIncomes();
    }, [fetchIncomes, refreshKey]);

    // Event listener untuk refresh
    useEffect(() => {
        const handleTransactionAdded = () => {
            setRefreshKey(prev => prev + 1);
        };
        window.addEventListener('transaction-added', handleTransactionAdded);
        return () => window.removeEventListener('transaction-added', handleTransactionAdded);
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // ========== FUNGSI EXPORT ==========
    const handleExport = () => {
        try {
            // Siapkan data untuk export
            const exportData = incomes.map(inc => ({
                'Tanggal': new Date(inc.tanggal).toLocaleDateString('id-ID'),
                'Keterangan': inc.keterangan,
                'Kategori': inc.kategori,
                'Metode': inc.metode,
                'Jumlah': inc.jumlah,
                'Status': 'Berhasil'
            }));

            // Buat header CSV
            const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Metode', 'Jumlah', 'Status'];

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
            link.setAttribute('download', `pemasukan_${date}.csv`);
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

    // Statistik dari data real
    const stats = useMemo(() => {
        const total = incomes.reduce((sum, curr) => sum + curr.jumlah, 0);

        const categories = incomes.reduce((acc, curr) => {
            acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.jumlah;
            return acc;
        }, {});

        // Urutkan kategori berdasarkan nilai terbesar
        const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);

        return {
            totalIncome: total,
            count: incomes.length,
            topCategory: sortedCategories[0] || ["-", 0],
            allCategories: sortedCategories
        };
    }, [incomes]);

    // LOGIKA GROUPING & SORTING (Kronologis: Terlama ke Terbaru)
    const processedData = useMemo(() => {
        let filtered = incomes.filter(t =>
            t.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.kategori.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Diurutkan dari tanggal terkecil ke terbesar
        filtered.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

        return filtered.reduce((acc, transaction) => {
            const dateObj = new Date(transaction.tanggal);
            const fullDate = dateObj.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            if (!acc[fullDate]) acc[fullDate] = [];
            acc[fullDate].push(transaction);
            return acc;
        }, {});
    }, [incomes, searchTerm]);

    // Loading state
    if (loading && incomes.length === 0) {
        return (
            <div className="flex h-screen bg-[#F4F4F7]">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <TrendingUp className="w-8 h-8 text-emerald-600 opacity-50" />
                            </div>
                        </div>
                        <p className="mt-4 text-slate-600 font-medium">Memuat pemasukan...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F4F4F7] font-sans selection:bg-emerald-100 selection:text-emerald-900">
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
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pemasukan</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                    Riwayat Dana Masuk • {stats.count} Transaksi
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/60 backdrop-blur-md border border-white rounded-2xl p-1 flex shadow-sm">
                            <div className="relative flex items-center">
                                <Search className="absolute left-4 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari sumber dana..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-transparent pl-11 pr-4 py-2.5 text-sm font-medium w-64 outline-none placeholder:text-slate-300 text-slate-700"
                                />
                            </div>
                        </div>

                        {/* Tombol Export dengan animasi */}
                        <motion.button
                            onClick={handleExport}
                            disabled={incomes.length === 0}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-slate-900 font-bold text-xs hover:shadow-xl transition-all shadow-sm ${incomes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {exportSuccess ? (
                                <>
                                    <Check size={14} className="text-emerald-600" />
                                    <span className="text-emerald-600">Terekspor!</span>
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

                {/* --- MAIN CONTENT AREA --- */}
                <div className="flex-1 flex gap-6 overflow-hidden">

                    {/* LEFT PANEL: LISTING (STICKY DATE) */}
                    <div className="flex-[1.5] flex flex-col bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-8 pt-8 pb-4 border-b border-slate-50">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Aliran Dana Masuk</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-10">
                            <AnimatePresence mode="popLayout">
                                {Object.keys(processedData).length > 0 ? (
                                    Object.keys(processedData).map((dateGroup) => (
                                        <div key={dateGroup} className="relative">
                                            {/* STICKY HEADER */}
                                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-8 py-3 border-b border-slate-50 shadow-sm">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
                                                    {dateGroup}
                                                </span>
                                            </div>

                                            {/* LIST TRANSAKSI */}
                                            <div className="px-4 py-2 space-y-1 mb-2">
                                                {processedData[dateGroup].map((item) => (
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        key={item.id}
                                                        className="group flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-emerald-50/40 transition-all duration-300 cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                                                <ArrowDownLeft size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800 tracking-tight">{item.keterangan}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">{item.kategori}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <p className="text-sm font-black tracking-tight text-emerald-600">
                                                                    + {formatCurrency(item.jumlah)}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">
                                                                    {item.metode || 'Berhasil'}
                                                                </p>
                                                            </div>
                                                            <ArrowRight size={14} className="text-slate-200 group-hover:text-emerald-500 transition-colors" />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                                        <FileText size={40} strokeWidth={1} className="mb-2" />
                                        <p className="text-xs font-bold uppercase tracking-widest">
                                            {searchTerm ? 'Tidak ada pemasukan ditemukan' : 'Belum ada pemasukan'}
                                        </p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* RIGHT PANEL: SUMMARY BOXES */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Total Income Card */}
                        <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-emerald-600/20">
                            <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                                <TrendingUp size={120} />
                            </div>
                            <h4 className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-2 italic">Total Pemasukan</h4>
                            <p className="text-3xl font-bold tracking-tighter mb-8">{formatCurrency(stats.totalIncome)}</p>

                            <div className="flex justify-between items-center text-emerald-100 text-sm border-t border-emerald-500/30 pt-4">
                                <span>Jumlah Transaksi</span>
                                <span className="font-bold text-white">{stats.count} kali</span>
                            </div>
                        </div>

                        {/* Statistik Card */}
                        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <BarChart3 size={20} />
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Statistik</h4>
                            </div>

                            <div className="space-y-6">
                                {/* Kategori Terbesar */}
                                <div>
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                                        <span className="text-slate-400">Sumber Terbesar</span>
                                        <span className="text-slate-900">{stats.topCategory[0]}</span>
                                    </div>
                                    <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-slate-50">
                                        <p className="text-xs font-bold text-slate-500">Kontribusi:</p>
                                        <p className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(stats.topCategory[1])}</p>
                                    </div>
                                </div>

                                {/* Daftar Semua Kategori */}
                                {stats.allCategories.length > 1 && (
                                    <div>
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                                            <span className="text-slate-400">Semua Kategori</span>
                                        </div>
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                            {stats.allCategories.map(([category, amount], idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                                    <span className="text-xs font-medium text-slate-600">{category}</span>
                                                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}