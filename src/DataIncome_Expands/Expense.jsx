import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Search,
    Download,
    ArrowUpRight,
    TrendingDown,
    Zap,
    ArrowRight,
    FileText,
    Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../Sidebar/sidebar';
import { expenseService } from '../services/transaction.service';

export default function Expense() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [exporting, setExporting] = useState(false);

    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await expenseService.getAll({ limit: 1000 });
            const expenseData = response.data?.expenses?.map(exp => ({
                id: exp.id,
                tipe: 'expense',
                jumlah: exp.amount,
                kategori: exp.category,
                keterangan: exp.description || 'Pengeluaran',
                tanggal: exp.date,
                metode: exp.paymentMethod,
                createdAt: exp.createdAt
            })) || [];
            setExpenses(expenseData);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses, refreshKey]);

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

    const formatNumber = (amount) => {
        return new Intl.NumberFormat('id-ID').format(amount);
    };

    const handleExportPDF = async () => {
        if (expenses.length === 0) {
            alert('Tidak ada data untuk diekspor');
            return;
        }
        setExporting(true);
        try {
            const doc = new jsPDF();
            const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            doc.setFillColor(225, 29, 72);
            doc.rect(0, 0, 210, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('LAPORAN PENGELUARAN', 105, 22, { align: 'center' });

            doc.setTextColor(100, 116, 139);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Dicetak: ${currentDate} | ${currentTime}`, 20, 48);
            doc.setDrawColor(226, 232, 240);
            doc.line(20, 52, 190, 52);

            const totalExpense = expenses.reduce((sum, exp) => sum + exp.jumlah, 0);
            const transactionCount = expenses.length;
            const categories = expenses.reduce((acc, exp) => {
                acc[exp.kategori] = (acc[exp.kategori] || 0) + exp.jumlah;
                return acc;
            }, {});
            const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
            const biggestExpense = [...expenses].sort((a, b) => b.jumlah - a.jumlah)[0];

            doc.setFillColor(249, 250, 251);
            doc.roundedRect(20, 60, 170, 55, 5, 5, 'F');
            doc.setTextColor(31, 41, 55);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('RINGKASAN', 25, 72);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text('Total Pengeluaran:', 25, 82);
            doc.setTextColor(225, 29, 72);
            doc.setFont('helvetica', 'bold');
            doc.text(`Rp ${formatNumber(totalExpense)}`, 70, 82);

            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            doc.text('Jumlah Transaksi:', 25, 90);
            doc.setTextColor(31, 41, 55);
            doc.setFont('helvetica', 'bold');
            doc.text(`${transactionCount} kali`, 70, 90);

            doc.setTextColor(71, 85, 105);
            doc.text('Kategori Terbesar:', 25, 98);
            doc.setTextColor(225, 29, 72);
            doc.setFont('helvetica', 'bold');
            doc.text(`${topCategory[0]}`, 70, 98);
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');
            doc.text(`Rp ${formatNumber(topCategory[1])}`, 120, 98);

            doc.setTextColor(71, 85, 105);
            doc.text('Pengeluaran Terbesar:', 25, 106);
            doc.setTextColor(31, 41, 55);
            doc.setFont('helvetica', 'bold');
            doc.text(`${biggestExpense?.keterangan || '-'}`, 70, 106);
            doc.setTextColor(225, 29, 72);
            doc.setFont('helvetica', 'bold');
            doc.text(`Rp ${formatNumber(biggestExpense?.jumlah || 0)}`, 120, 106);

            doc.setFillColor(225, 29, 72);
            doc.rect(20, 125, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('DAFTAR TRANSAKSI PENGELUARAN', 105, 131, { align: 'center' });

            const tableData = expenses.map(exp => [
                new Date(exp.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
                exp.keterangan.length > 25 ? exp.keterangan.substring(0, 22) + '...' : exp.keterangan,
                exp.kategori,
                exp.metode || '-',
                `Rp ${formatNumber(exp.jumlah)}`
            ]);

            autoTable(doc, {
                startY: 133,
                head: [['Tanggal', 'Keterangan', 'Kategori', 'Metode', 'Jumlah']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center', valign: 'middle' },
                bodyStyles: { fontSize: 8, textColor: [51, 65, 85], valign: 'middle' },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                columnStyles: { 0: { cellWidth: 30, halign: 'center' }, 1: { cellWidth: 50 }, 2: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 30, halign: 'center' }, 4: { cellWidth: 40, halign: 'right' } },
                margin: { left: 20, right: 20 },
                didDrawPage: (data) => {
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFontSize(7);
                    doc.setTextColor(148, 163, 184);
                    doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
                }
            });

            const finalY = doc.lastAutoTable?.finalY || 210;
            if (finalY + 20 < doc.internal.pageSize.height - 20) {
                doc.setDrawColor(226, 232, 240);
                doc.line(20, finalY + 10, 190, finalY + 10);
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184);
                doc.text('Laporan ini dibuat secara otomatis oleh Financial Tracker.', 105, finalY + 18, { align: 'center' });
            }

            doc.save(`Laporan_Pengeluaran_${new Date().toISOString().split('T')[0]}.pdf`);
            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);
        } catch (error) {
            console.error('Export PDF error:', error);
            alert(`Gagal mengekspor PDF: ${error.message || 'Terjadi kesalahan'}`);
        } finally {
            setExporting(false);
        }
    };

    const stats = useMemo(() => {
        const total = expenses.reduce((sum, curr) => sum + curr.jumlah, 0);
        const biggestOne = [...expenses].sort((a, b) => b.jumlah - a.jumlah)[0];
        const categories = expenses.reduce((acc, curr) => {
            acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.jumlah;
            return acc;
        }, {});
        const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
        return {
            totalExpense: total,
            count: expenses.length,
            biggest: biggestOne || { keterangan: "-", jumlah: 0, kategori: "-" },
            topCategory: sortedCategories[0] || ["-", 0],
            allCategories: sortedCategories
        };
    }, [expenses]);

    const processedData = useMemo(() => {
        let filtered = expenses.filter(t =>
            t.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.kategori.toLowerCase().includes(searchTerm.toLowerCase())
        );
        filtered.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
        return filtered.reduce((acc, transaction) => {
            const dateObj = new Date(transaction.tanggal);
            const fullDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            if (!acc[fullDate]) acc[fullDate] = [];
            acc[fullDate].push(transaction);
            return acc;
        }, {});
    }, [expenses, searchTerm]);

    if (loading && expenses.length === 0) {
        return (
            <div className="flex h-screen bg-[#F4F4F7]">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <TrendingDown className="w-8 h-8 text-rose-600 opacity-50" />
                            </div>
                        </div>
                        <p className="mt-4 text-slate-600 font-medium">Memuat pengeluaran...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F4F4F7] font-sans selection:bg-rose-100 selection:text-rose-900">
            <Sidebar />

            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
                {/* HEADER - Responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 px-2 sm:px-4">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="group p-2 hover:bg-white rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            <ArrowLeft size={20} className="text-slate-400 group-hover:text-slate-900" />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Pengeluaran</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                    Riwayat Belanja • {stats.count} Transaksi
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-white/60 backdrop-blur-md border border-white rounded-2xl p-1 flex shadow-sm flex-1 sm:flex-initial">
                            <div className="relative flex items-center w-full">
                                <Search className="absolute left-4 text-slate-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari pengeluaran..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-transparent pl-11 pr-4 py-2 text-sm font-medium w-full sm:w-64 outline-none placeholder:text-slate-300 text-slate-700"
                                />
                            </div>
                        </div>

                        <motion.button
                            onClick={handleExportPDF}
                            disabled={expenses.length === 0 || exporting}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-white border border-slate-100 rounded-2xl text-slate-900 font-bold text-xs hover:shadow-xl transition-all shadow-sm ${(expenses.length === 0 || exporting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {exporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="hidden sm:inline text-rose-600">Memproses...</span>
                                </>
                            ) : exportSuccess ? (
                                <>
                                    <Check size={14} className="text-rose-600" />
                                    <span className="hidden sm:inline text-rose-600">PDF Tersimpan!</span>
                                </>
                            ) : (
                                <>
                                    <Download size={14} />
                                    <span className="hidden sm:inline">Export PDF</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* MAIN CONTENT - Responsive */}
                <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* LEFT PANEL: LISTING */}
                    <div className="flex-1 lg:flex-[1.5] flex flex-col bg-white rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-3 sm:pb-4 border-b border-slate-50">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rose-600">Daftar Transaksi Keluar</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-10">
                            <AnimatePresence mode="popLayout">
                                {Object.keys(processedData).length > 0 ? (
                                    Object.keys(processedData).map((dateGroup) => (
                                        <div key={dateGroup} className="relative">
                                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-4 sm:px-8 py-2 sm:py-3 border-b border-slate-50 shadow-sm">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{dateGroup}</span>
                                            </div>
                                            <div className="px-2 sm:px-4 py-2 space-y-1 mb-2">
                                                {processedData[dateGroup].map((item) => (
                                                    <motion.div
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        key={item.id}
                                                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-[1.5rem] hover:bg-rose-50/40 transition-all duration-300 cursor-pointer gap-2 sm:gap-0"
                                                    >
                                                        <div className="flex items-center gap-3 sm:gap-4">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center transition-all duration-500 group-hover:bg-rose-600 group-hover:text-white group-hover:rotate-12">
                                                                <ArrowUpRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800 tracking-tight">{item.keterangan}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">{item.kategori} • {item.metode}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                                                            <div className="text-left sm:text-right">
                                                                <p className="text-sm font-black tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors">- {formatCurrency(item.jumlah)}</p>
                                                                <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">Selesai</p>
                                                            </div>
                                                            <ArrowRight size={14} className="text-slate-200 group-hover:text-rose-500 transition-colors flex-shrink-0" />
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
                                            {searchTerm ? 'Tidak ada pengeluaran ditemukan' : 'Belum ada pengeluaran'}
                                        </p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* RIGHT PANEL: SUMMARY */}
                    <div className="flex-1 lg:flex-1 flex flex-col gap-4 sm:gap-6">
                        <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <TrendingDown size={80} className="sm:w-[120px] sm:h-[120px]" />
                            </div>
                            <h4 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 italic">Total Keluar</h4>
                            <p className="text-2xl sm:text-3xl font-bold tracking-tighter mb-6 sm:mb-8 break-words">{formatCurrency(stats.totalExpense)}</p>
                            <div className="flex justify-between items-center text-slate-400 text-sm border-t border-slate-800 pt-4">
                                <span>Jumlah Transaksi</span>
                                <span className="font-bold text-white">{stats.count} kali</span>
                            </div>
                        </div>

                        <div className="flex-1 bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 p-5 sm:p-8 shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-6 sm:mb-8">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                    <Zap size={18} className="sm:w-5 sm:h-5" />
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Info Penting</h4>
                            </div>

                            <div className="space-y-4 sm:space-y-6">
                                <div>
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                                        <span className="text-slate-400">Item Termahal</span>
                                    </div>
                                    <div className="p-3 sm:p-5 bg-rose-50/30 rounded-2xl sm:rounded-3xl border border-rose-100/50">
                                        <p className="text-sm font-bold text-slate-800 leading-tight break-words">{stats.biggest.keterangan}</p>
                                        <p className="text-sm text-slate-500 mt-1">{stats.biggest.kategori}</p>
                                        <p className="text-base sm:text-xl font-black text-rose-600 mt-2">{formatCurrency(stats.biggest.jumlah)}</p>
                                    </div>
                                </div>

                                {stats.topCategory[0] !== "-" && (
                                    <div>
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                                            <span className="text-slate-400">Kategori Terbesar</span>
                                            <span className="text-slate-900 text-right break-words max-w-[150px]">{stats.topCategory[0]}</span>
                                        </div>
                                        <div className="p-3 sm:p-4 bg-[#F8FAFC] rounded-xl sm:rounded-2xl border border-slate-50">
                                            <p className="text-xs font-bold text-slate-500">Total:</p>
                                            <p className="text-base sm:text-lg font-black text-rose-600 mt-1">{formatCurrency(stats.topCategory[1])}</p>
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