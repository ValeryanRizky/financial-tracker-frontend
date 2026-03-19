import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Wallet,
    MoreVertical,
    ChevronRight,
    Smartphone,
    CreditCard,
    Building2,
    Banknote,
    QrCode,
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';
import Sidebar from '../Sidebar/sidebar';
import transactionsData from '../Mockdata/Mockdata.json';

export default function WalletPage() {

    const walletStats = useMemo(() => {
        const uniqueMethods = [...new Set(transactionsData.map(t => t.metode))];
        const initialBalances = {
            "Transfer": 25000000, "Debit": 10000000, "E-Wallet": 5000000,
            "Cash": 2000000, "QRIS": 3000000, "Kartu Kredit": 15000000
        };

        return uniqueMethods.map((method, index) => {
            const history = transactionsData.filter(t => t.metode === method);
            const income = history.filter(t => t.tipe === 'income').reduce((acc, curr) => acc + curr.jumlah, 0);
            const expense = history.filter(t => t.tipe === 'expense').reduce((acc, curr) => acc + curr.jumlah, 0);
            const currentBalance = (initialBalances[method] || 0) + income - expense;

            const getMeta = (m) => {
                switch (m) {
                    case 'Transfer': return { color: 'from-blue-600 to-blue-700', icon: <Building2 size={24} />, type: 'Main Bank' };
                    case 'Debit': return { color: 'from-indigo-500 to-indigo-600', icon: <CreditCard size={24} />, type: 'Checking' };
                    case 'E-Wallet': return { color: 'from-purple-500 to-purple-600', icon: <Smartphone size={24} />, type: 'Digital' };
                    case 'Cash': return { color: 'from-emerald-500 to-emerald-600', icon: <Banknote size={24} />, type: 'Physical' };
                    case 'QRIS': return { color: 'from-rose-500 to-rose-600', icon: <QrCode size={24} />, type: 'Instant' };
                    case 'Kartu Kredit': return { color: 'from-slate-700 to-slate-900', icon: <CreditCard size={24} />, type: 'Credit' };
                    default: return { color: 'from-slate-400 to-slate-500', icon: <Wallet size={24} />, type: 'Other' };
                }
            };
            return { id: index, name: method, balance: currentBalance, ...getMeta(method) };
        });
    }, []);

    const totalNetWorth = useMemo(() => walletStats.reduce((acc, curr) => acc + curr.balance, 0), [walletStats]);
    const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans">
            <Sidebar />

            <div className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto">

                {/* --- HEADER --- */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Wallet</h1>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <Plus size={20} />
                        <span className="hidden md:inline">Add Source</span>
                    </motion.button>
                </header>

                {/* --- CARD UTAMA (SOLUSI KEPOTONG) --- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    // Gunakan h-auto dan py-12 agar kontainer mengikuti besar teks
                    className="relative w-full h-auto min-h-[250px] bg-[#0F172A] rounded-[3rem] px-10 py-12 shadow-2xl overflow-hidden mb-12 text-white flex flex-col justify-center border border-white/5"
                >
                    <div className="relative z-10">
                        {/* Label Atas */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/20">
                                <Wallet size={18} className="text-blue-400" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Total Net Worth</span>
                        </div>

                        {/* Area Saldo - leading-tight sangat penting agar tidak kepotong bawahnya */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight py-2">
                                {formatCurrency(totalNetWorth)}
                            </h2>

                            {/* Financial Status Box */}

                        </div>
                    </div>

                    {/* Ornamen Latar Belakang */}
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                </motion.div>

                {/* --- GRID PAYMENT SOURCES --- */}
                <div className="mb-8 flex items-center gap-4 px-2">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Payment Sources</h3>
                    <div className="h-[1px] w-full bg-slate-200" />
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{walletStats.length}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10 font-sans">
                    <AnimatePresence>
                        {walletStats.map((wallet, index) => (
                            <motion.div
                                key={wallet.name}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -8 }}
                                className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col group transition-all hover:shadow-xl hover:shadow-slate-200/50"
                            >
                                <div className="p-6 flex-1 flex flex-col min-h-[160px]">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`w-14 h-14 bg-gradient-to-br ${wallet.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200`}>
                                            {wallet.icon}
                                        </div>
                                        <button className="text-slate-300 hover:text-slate-900 transition-colors">
                                            <MoreVertical size={20} />
                                        </button>
                                    </div>

                                    <div className="mt-auto px-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-0.5">{wallet.type}</p>
                                        <h4 className="text-xl font-black text-slate-800 tracking-tight">{wallet.name}</h4>
                                    </div>
                                </div>

                                <div className="bg-slate-50 m-1.5 p-4 rounded-[2rem] flex items-center justify-between group-hover:bg-slate-900 transition-all duration-300">
                                    <p className={`font-black tracking-tight ${wallet.balance < 0 ? 'text-rose-500' : 'text-slate-900'} group-hover:text-white`}>
                                        {formatCurrency(wallet.balance)}
                                    </p>
                                    <div className="bg-white p-2 rounded-full shadow-sm group-hover:bg-white/10 group-hover:text-white transition-all">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Button Tambah */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        className="border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-blue-300 hover:bg-blue-50/30 transition-all min-h-[260px]"
                    >
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                            <Plus size={24} className="text-slate-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Add New Source</span>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}