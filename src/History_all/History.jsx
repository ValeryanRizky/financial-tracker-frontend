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
    Check,
    FileText,
    CreditCard,
    Tag,
    Filter
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    const [exporting, setExporting] = useState(false);
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

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
            console.log('🔄 Transaction added, refreshing...');
            setRefreshKey(prev => prev + 1);
        };
        window.addEventListener('transaction-added', handleTransactionAdded);
        return () => window.removeEventListener('transaction-added', handleTransactionAdded);
    }, []);

    // ========== FUNGSI FORMAT ANGKA DENGAN TITIK ==========
    const formatNumber = (amount) => {
        return new Intl.NumberFormat('id-ID').format(amount);
    };

    // Format mata uang
    const formatCurrency = (amount) => {
        return `Rp ${formatNumber(amount)}`;
    };

    // ========== FUNGSI EXPORT PDF ==========
    const handleExportPDF = async () => {
        if (transactions.length === 0) {
            alert('Tidak ada data untuk diekspor');
            return;
        }

        setExporting(true);

        try {
            // Filter data sesuai filter yang aktif
            const filteredForExport = transactions.filter(t => {
                const matchType = filterType === 'all' || t.tipe === filterType;
                const matchCategory = selectedCategory === 'all' || t.kategori === selectedCategory;
                const matchMethod = selectedMethod === 'all' || t.metode === selectedMethod;
                const matchSearch = t.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.metode.toLowerCase().includes(searchTerm.toLowerCase());

                return matchType && matchCategory && matchMethod && matchSearch;
            });

            if (filteredForExport.length === 0) {
                alert('Tidak ada data yang sesuai dengan filter');
                setExporting(false);
                return;
            }

            // Buat dokumen PDF
            const doc = new jsPDF();
            const currentDate = new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            const currentTime = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Header dengan warna biru
            doc.setFillColor(59, 130, 246);
            doc.rect(0, 0, 210, 35, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('LAPORAN RIWAYAT TRANSAKSI', 105, 22, { align: 'center' });

            // Informasi filter
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            let filterInfo = `Dicetak: ${currentDate} | ${currentTime}`;
            if (filterType !== 'all') filterInfo += ` | Tipe: ${filterType === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;
            if (selectedCategory !== 'all') filterInfo += ` | Kategori: ${selectedCategory}`;
            if (selectedMethod !== 'all') filterInfo += ` | Metode: ${selectedMethod}`;
            if (searchTerm) filterInfo += ` | Cari: ${searchTerm}`;
            doc.text(filterInfo, 20, 48);

            // Garis pemisah
            doc.setDrawColor(226, 232, 240);
            doc.line(20, 52, 190, 52);

            // Hitung statistik dari data yang difilter
            const totalIncome = filteredForExport.filter(t => t.tipe === 'income').reduce((sum, t) => sum + t.jumlah, 0);
            const totalExpense = filteredForExport.filter(t => t.tipe === 'expense').reduce((sum, t) => sum + t.jumlah, 0);
            const totalBalance = totalIncome - totalExpense;
            const transactionCount = filteredForExport.length;

            // Box Statistik
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(20, 60, 170, 50, 5, 5, 'F');

            doc.setTextColor(31, 41, 55);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('RINGKASAN TRANSAKSI', 25, 72);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            doc.setTextColor(71, 85, 105);
            doc.text('Total Pemasukan:', 25, 82);
            doc.setTextColor(16, 185, 129);
            doc.setFont('helvetica', 'bold');
            doc.text(`Rp ${formatNumber(totalIncome)}`, 70, 82);

            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            doc.text('Total Pengeluaran:', 25, 90);
            doc.setTextColor(225, 29, 72);
            doc.setFont('helvetica', 'bold');
            doc.text(`Rp ${formatNumber(totalExpense)}`, 70, 90);

            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            doc.text('Saldo Bersih:', 25, 98);
            doc.setTextColor(59, 130, 246);
            doc.setFont('helvetica', 'bold');
            doc.text(`Rp ${formatNumber(totalBalance)}`, 70, 98);

            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            doc.text('Jumlah Transaksi:', 25, 106);
            doc.setTextColor(31, 41, 55);
            doc.setFont('helvetica', 'bold');
            doc.text(`${transactionCount} kali`, 70, 106);

            // Judul Tabel
            doc.setFillColor(59, 130, 246);
            doc.rect(20, 120, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('DAFTAR TRANSAKSI', 105, 126, { align: 'center' });

            // Data untuk tabel
            const tableData = filteredForExport.map(t => [
                new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
                t.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran',
                t.keterangan.length > 20 ? t.keterangan.substring(0, 18) + '...' : t.keterangan,
                t.kategori,
                t.metode || '-',
                `${t.tipe === 'income' ? '+' : '-'} Rp ${formatNumber(t.jumlah)}`
            ]);

            autoTable(doc, {
                startY: 128,
                head: [['Tanggal', 'Tipe', 'Keterangan', 'Kategori', 'Metode', 'Jumlah']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [59, 130, 246],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8,
                    halign: 'center',
                    valign: 'middle'
                },
                bodyStyles: {
                    fontSize: 7,
                    textColor: [51, 65, 85],
                    valign: 'middle'
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                },
                columnStyles: {
                    0: { cellWidth: 28, halign: 'center' },
                    1: { cellWidth: 22, halign: 'center' },
                    2: { cellWidth: 38 },
                    3: { cellWidth: 28, halign: 'center' },
                    4: { cellWidth: 28, halign: 'center' },
                    5: { cellWidth: 32, halign: 'right' }
                },
                margin: { left: 20, right: 20 },
                didDrawPage: (data) => {
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(7);
                    doc.setTextColor(148, 163, 184);
                    doc.text(
                        `Halaman ${data.pageNumber} dari ${pageCount}`,
                        105,
                        doc.internal.pageSize.height - 10,
                        { align: 'center' }
                    );
                }
            });

            const finalY = doc.lastAutoTable?.finalY || 200;
            if (finalY + 20 < doc.internal.pageSize.height - 20) {
                doc.setDrawColor(226, 232, 240);
                doc.line(20, finalY + 10, 190, finalY + 10);
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184);
                doc.text('Laporan ini dibuat secara otomatis oleh Financial Tracker.', 105, finalY + 18, { align: 'center' });
            }

            const fileName = `Laporan_Riwayat_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);

        } catch (error) {
            console.error('Export PDF error:', error);
            alert(`Gagal mengekspor PDF: ${error.message || 'Terjadi kesalahan'}`);
        } finally {
            setExporting(false);
        }
    };

    // Ambil Opsi Unik untuk Dropdown
    const categories = useMemo(() => {
        const unique = [...new Set(transactions.map(t => t.kategori))];
        return ['all', ...unique];
    }, [transactions]);

    const methods = useMemo(() => {
        const unique = [...new Set(transactions.map(t => t.metode))];
        return ['all', ...unique];
    }, [transactions]);

    // Perhitungan Ringkasan
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

    // Filter Gabungan
    const processedData = useMemo(() => {
        let filtered = transactions.filter(t => {
            const matchType = filterType === 'all' || t.tipe === filterType;
            const matchCategory = selectedCategory === 'all' || t.kategori === selectedCategory;
            const matchMethod = selectedMethod === 'all' || t.metode === selectedMethod;
            const matchSearch = t.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.metode.toLowerCase().includes(searchTerm.toLowerCase());

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
    }, [transactions, filterType, searchTerm, selectedCategory, selectedMethod]);

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
                {/* HEADER */}
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
                        {/* Search Bar dengan placeholder yang lebih jelas */}
                        <div className="bg-white/60 backdrop-blur-md border border-white rounded-2xl p-1 flex shadow-sm">
                            <div className="relative flex items-center">
                                <Search className="absolute left-4 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari nama, kategori, atau metode..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-transparent pl-11 pr-4 py-2.5 text-sm font-medium w-64 outline-none placeholder:text-slate-300 text-slate-700"
                                />
                            </div>
                        </div>

                        {/* Filter Dropdowns */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 text-[11px] font-bold text-slate-700 shadow-sm outline-none hover:border-blue-200 transition-colors cursor-pointer appearance-none min-w-[120px]"
                        >
                            <option value="all">📂 SEMUA KATEGORI</option>
                            {categories.filter(c => c !== 'all').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <select
                            value={selectedMethod}
                            onChange={(e) => setSelectedMethod(e.target.value)}
                            className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 text-[11px] font-bold text-slate-700 shadow-sm outline-none hover:border-blue-200 transition-colors cursor-pointer appearance-none min-w-[120px]"
                        >
                            <option value="all">💳 SEMUA METODE</option>
                            {methods.filter(m => m !== 'all').map(met => (
                                <option key={met} value={met}>{met}</option>
                            ))}
                        </select>

                        {/* Tombol Export PDF */}
                        <motion.button
                            onClick={handleExportPDF}
                            disabled={transactions.length === 0 || exporting}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative flex items-center gap-2 px-5 py-3 bg-white border border-slate-100 rounded-2xl text-slate-900 font-bold text-xs hover:shadow-xl transition-all shadow-sm ${(transactions.length === 0 || exporting) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {exporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-blue-600">Memproses...</span>
                                </>
                            ) : exportSuccess ? (
                                <>
                                    <Check size={14} className="text-emerald-600" />
                                    <span className="text-emerald-600">PDF Tersimpan!</span>
                                </>
                            ) : (
                                <>
                                    <Download size={14} />
                                    <span>Export PDF</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* CONTENT AREA */}
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
                            <div className="text-xs text-slate-400">
                                <Filter size={12} className="inline mr-1" />
                                {processedData ? Object.keys(processedData).length : 0} grup
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
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <CreditCard size={10} className="text-blue-500" />
                                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                                                            {item.metode || 'Cash'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-px h-3 bg-slate-200"></div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Tag size={10} className="text-slate-400" />
                                                                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                                                            {item.kategori || 'Other'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <p className={`text-sm font-black tracking-tight ${item.tipe === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                                    {item.tipe === 'income' ? '+' : '-'} {formatCurrency(item.jumlah)}
                                                                </p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
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

                    {/* RIGHT PANEL */}
                    <div className="flex-1 flex flex-col gap-6">
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

                        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <PieChart size={20} />
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Ringkasan Global</h4>
                            </div>

                            <div className="space-y-8">
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

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Tertua</p>
                                        <p className="text-xs font-bold text-slate-800 mt-1">
                                            {transactions.length > 0
                                                ? new Date(transactions[transactions.length - 1]?.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Terbaru</p>
                                        <p className="text-xs font-bold text-slate-800 mt-1">
                                            {transactions.length > 0
                                                ? new Date(transactions[0]?.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
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