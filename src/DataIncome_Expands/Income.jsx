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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../Sidebar/sidebar';
import { incomeService } from '../services/transaction.service';

export default function Income() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [exporting, setExporting] = useState(false);

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

    useEffect(() => {
        fetchIncomes();
    }, [fetchIncomes, refreshKey]);

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
        if (incomes.length === 0) {
            alert('Tidak ada data untuk diekspor');
            return;
        }
        setExporting(true);
        try {
            const doc = new jsPDF();
            const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            doc.setFillColor(16, 185, 129);
            doc.rect(0, 0, 210, 35, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('LAPORAN PEMASUKAN', 105, 22, { align: 'center' });

            doc.setTextColor(100, 116, 139);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Dicetak: ${currentDate} | ${currentTime}`, 20, 48);
            doc.setDrawColor(226, 232, 240);
            doc.line(20, 52, 190, 52);

            const totalIncome = incomes.reduce((sum, inc) => sum + inc.jumlah, 0);
            const transactionCount = incomes.length;
            const categories = incomes.reduce((acc, inc) => {
                acc[inc.kategori] = (acc[inc.kategori] || 0) + inc.jumlah;
                return acc;
            }, {});
            const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

            doc.setFillColor(249, 250, 251);
            doc.roundedRect(20, 60, 170, 40, 5, 5, 'F');
            doc.setTextColor(31, 41, 55);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('RINGKASAN', 25, 72);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            doc.text('Total Pemasukan:', 25, 82);
            doc.setTextColor(16, 185, 129);
            doc.setFont('helvetica', 'bold');
            doc.text(`Rp ${formatNumber(totalIncome)}`, 70, 82);

            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            doc.text('Jumlah Transaksi:', 25, 90);
            doc.setTextColor(31, 41, 55);
            doc.setFont('helvetica', 'bold');
            doc.text(`${transactionCount} kali`, 70, 90);

            doc.setTextColor(71, 85, 105);
            doc.text('Sumber Terbesar:', 25, 98);
            doc.setTextColor(16, 185, 129);
            doc.setFont('helvetica', 'bold');
            doc.text(`${topCategory[0]}`, 70, 98);
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');
            doc.text(`Rp ${formatNumber(topCategory[1])}`, 120, 98);

            doc.setFillColor(16, 185, 129);
            doc.rect(20, 110, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('DAFTAR TRANSAKSI PEMASUKAN', 105, 116, { align: 'center' });

            const tableData = incomes.map(inc => [
                new Date(inc.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
                inc.keterangan.length > 25 ? inc.keterangan.substring(0, 22) + '...' : inc.keterangan,
                inc.kategori,
                inc.metode || '-',
                `Rp ${formatNumber(inc.jumlah)}`
            ]);

            autoTable(doc, {
                startY: 118,
                head: [['Tanggal', 'Keterangan', 'Kategori', 'Metode', 'Jumlah']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center', valign: 'middle' },
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

            const finalY = doc.lastAutoTable?.finalY || 200;
            if (finalY + 20 < doc.internal.pageSize.height - 20) {
                doc.setDrawColor(226, 232, 240);
                doc.line(20, finalY + 10, 190, finalY + 10);
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184);
                doc.text('Laporan ini dibuat secara otomatis oleh Financial Tracker.', 105, finalY + 18, { align: 'center' });
            }

            doc.save(`Laporan_Pemasukan_${new Date().toISOString().split('T')[0]}.pdf`);
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
        const total = incomes.reduce((sum, curr) => sum + curr.jumlah, 0);
        const categories = incomes.reduce((acc, curr) => {
            acc[curr.kategori] = (acc[curr.kategori] || 0) + curr.jumlah;
            return acc;
        }, {});
        const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
        return {
            totalIncome: total,
            count: incomes.length,
            topCategory: sortedCategories[0] || ["-", 0],
            allCategories: sortedCategories
        };
    }, [incomes]);

    const processedData = useMemo(() => {
        let filtered = incomes.filter(t =>
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
    }, [incomes, searchTerm]);

    if (loading && incomes.length === 0) {
        return (
            <div className="flex h-screen bg-[#F4F4F7]">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
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
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Pemasukan</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                    Riwayat Dana Masuk • {stats.count} Transaksi
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
                                    placeholder="Cari sumber dana..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-transparent pl-11 pr-4 py-2 text-sm font-medium w-full sm:w-64 outline-none placeholder:text-slate-300 text-slate-700"
                                />
                            </div>
                        </div>

                        <motion.button
                            onClick={handleExportPDF}
                            disabled={incomes.length === 0 || exporting}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-white border border-slate-100 rounded-2xl text-slate-900 font-bold text-xs hover:shadow-xl transition-all shadow-sm ${(incomes.length === 0 || exporting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {exporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="hidden sm:inline text-emerald-600">Memproses...</span>
                                </>
                            ) : exportSuccess ? (
                                <>
                                    <Check size={14} className="text-emerald-600" />
                                    <span className="hidden sm:inline text-emerald-600">PDF Tersimpan!</span>
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

                {/* MAIN CONTENT AREA - Responsive */}
                <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* LEFT PANEL: LISTING */}
                    <div className="flex-1 lg:flex-[1.5] flex flex-col bg-white rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-3 sm:pb-4 border-b border-slate-50">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Aliran Dana Masuk</h3>
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
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        key={item.id}
                                                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-[1.5rem] hover:bg-emerald-50/40 transition-all duration-300 cursor-pointer gap-2 sm:gap-0"
                                                    >
                                                        <div className="flex items-center gap-3 sm:gap-4">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                                                <ArrowDownLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800 tracking-tight">{item.keterangan}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">{item.kategori}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                                                            <div className="text-left sm:text-right">
                                                                <p className="text-sm font-black tracking-tight text-emerald-600">+ {formatCurrency(item.jumlah)}</p>
                                                                <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">{item.metode || 'Berhasil'}</p>
                                                            </div>
                                                            <ArrowRight size={14} className="text-slate-200 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
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
                    <div className="flex-1 lg:flex-1 flex flex-col gap-4 sm:gap-6">
                        <div className="bg-emerald-600 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-white relative overflow-hidden group shadow-2xl shadow-emerald-600/20">
                            <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                                <TrendingUp size={80} className="sm:w-[120px] sm:h-[120px]" />
                            </div>
                            <h4 className="text-emerald-100 text-xs font-black uppercase tracking-widest mb-2 italic">Total Pemasukan</h4>
                            <p className="text-2xl sm:text-3xl font-bold tracking-tighter mb-6 sm:mb-8 break-words">{formatCurrency(stats.totalIncome)}</p>
                            <div className="flex justify-between items-center text-emerald-100 text-sm border-t border-emerald-500/30 pt-4">
                                <span>Jumlah Transaksi</span>
                                <span className="font-bold text-white">{stats.count} kali</span>
                            </div>
                        </div>

                        <div className="flex-1 bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 p-5 sm:p-8 shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-6 sm:mb-8">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <BarChart3 size={18} className="sm:w-5 sm:h-5" />
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Statistik</h4>
                            </div>

                            <div className="space-y-4 sm:space-y-6">
                                <div>
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                                        <span className="text-slate-400">Sumber Terbesar</span>
                                        <span className="text-slate-900 text-right break-words max-w-[150px]">{stats.topCategory[0]}</span>
                                    </div>
                                    <div className="p-3 sm:p-4 bg-[#F8FAFC] rounded-xl sm:rounded-2xl border border-slate-50">
                                        <p className="text-xs font-bold text-slate-500">Kontribusi:</p>
                                        <p className="text-base sm:text-lg font-black text-emerald-600 mt-1">{formatCurrency(stats.topCategory[1])}</p>
                                    </div>
                                </div>

                                {stats.allCategories.length > 1 && (
                                    <div>
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                                            <span className="text-slate-400">Semua Kategori</span>
                                        </div>
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                            {stats.allCategories.map(([category, amount], idx) => (
                                                <div key={idx} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-xl transition-colors gap-2">
                                                    <span className="text-xs font-medium text-slate-600 break-words">{category}</span>
                                                    <span className="text-xs font-bold text-emerald-600 text-right">{formatCurrency(amount)}</span>
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