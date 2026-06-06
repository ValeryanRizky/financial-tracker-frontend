import React, { useState, useEffect } from "react";
import { incomeService, expenseService } from "../services/transaction.service";
import { walletService } from "../services/wallet.service";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Wallet, Plus, Trash2, Check, RefreshCw } from "lucide-react";

export default function PopUp({ isOpen, onClose, onSuccess }) {
    const [type, setType] = useState('income');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [wallets, setWallets] = useState([]);
    const [loadingWallets, setLoadingWallets] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        category: 'Salary',
        description: '',
        walletId: ''
    });

    const [showCustomWallet, setShowCustomWallet] = useState(false);
    const [customWalletName, setCustomWalletName] = useState('');
    const [creatingWallet, setCreatingWallet] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch wallets ketika popup dibuka
    const fetchWallets = async () => {
        try {
            setLoadingWallets(true);
            const response = await walletService.getAll();
            let walletsData = response.data?.wallets || [];

            const cashExists = walletsData.some(w => w.name === 'Cash');
            if (!cashExists && walletsData.length === 0) {
                console.log('🏦 Creating default Cash wallet...');
                const cashWalletData = {
                    name: 'Cash',
                    type: 'cash',
                    category: 'payment',
                    balance: 0,
                    isActive: true,
                    color: 'bg-slate-500'
                };
                try {
                    const newCash = await walletService.create(cashWalletData);
                    walletsData = [newCash.data?.wallet || newCash];
                    console.log('✅ Default Cash wallet created');
                } catch (err) {
                    console.error('Error creating Cash wallet:', err);
                }
            } else if (!cashExists && walletsData.length > 0) {
                console.log('🏦 Creating Cash wallet...');
                const cashWalletData = {
                    name: 'Cash',
                    type: 'cash',
                    category: 'payment',
                    balance: 0,
                    isActive: true,
                    color: 'bg-slate-500'
                };
                try {
                    const newCash = await walletService.create(cashWalletData);
                    walletsData = [newCash.data?.wallet || newCash, ...walletsData];
                    console.log('✅ Cash wallet created');
                } catch (err) {
                    console.error('Error creating Cash wallet:', err);
                }
            }

            const sortedWallets = [...walletsData].sort((a, b) => {
                if (a.name === 'Cash') return -1;
                if (b.name === 'Cash') return 1;
                return a.name.localeCompare(b.name);
            });

            setWallets(sortedWallets);
            return sortedWallets;
        } catch (error) {
            console.error('Error fetching wallets:', error);
            return [];
        } finally {
            setLoadingWallets(false);
        }
    };

    const refreshWallets = async () => {
        setRefreshing(true);
        const newWallets = await fetchWallets();
        setRefreshing(false);
        return newWallets;
    };

    useEffect(() => {
        if (isOpen) {
            fetchWallets().then(walletsData => {
                if (walletsData.length > 0 && !formData.walletId) {
                    const cashWallet = walletsData.find(w => w.name === 'Cash');
                    const defaultWalletId = cashWallet ? cashWallet.id : walletsData[0].id;
                    setFormData(prev => ({
                        ...prev,
                        walletId: defaultWalletId
                    }));
                }
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const formatNumber = (value) => {
        if (!value) return '';
        const numberString = value.toString().replace(/\D/g, '');
        if (!numberString) return '';
        return new Intl.NumberFormat('id-ID').format(parseInt(numberString, 10));
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value;
        const numericValue = rawValue.replace(/\./g, '');
        setFormData({ ...formData, amount: formatNumber(numericValue) });
    };

    const getNumericAmount = () => {
        if (!formData.amount) return 0;
        return parseFloat(formData.amount.replace(/\./g, '')) || 0;
    };

    const handleClose = () => {
        setFormData({
            amount: '',
            category: type === 'income' ? 'Salary' : 'Food',
            description: '',
            walletId: wallets.find(w => w.name === 'Cash')?.id || wallets[0]?.id || ''
        });
        setError('');
        setShowCustomWallet(false);
        setCustomWalletName('');
        onClose();
    };

    const createNewWallet = async (walletName) => {
        try {
            setCreatingWallet(true);
            const walletData = {
                name: walletName,
                type: walletName === 'Cash' ? 'cash' : 'bank',
                category: 'payment',
                balance: 0,
                isActive: true,
                color: walletName === 'Cash' ? 'bg-slate-500' : 'bg-blue-500'
            };
            const response = await walletService.create(walletData);
            const newWallet = response.data?.wallet || response;
            const updatedWallets = await refreshWallets();
            const createdWallet = updatedWallets.find(w => w.name === walletName);
            if (createdWallet) {
                setFormData(prev => ({ ...prev, walletId: createdWallet.id }));
            }
            return newWallet;
        } catch (error) {
            console.error('Error creating wallet:', error);
            setError('Gagal membuat wallet baru');
            return null;
        } finally {
            setCreatingWallet(false);
        }
    };

    const handleAddCustomWallet = async () => {
        if (!customWalletName.trim()) {
            setError('Nama wallet tidak boleh kosong');
            return;
        }
        const newWalletName = customWalletName.trim();
        const existingWallet = wallets.find(w => w.name === newWalletName);
        if (existingWallet) {
            setError(`Wallet "${newWalletName}" sudah ada, silakan pilih dari daftar`);
            return;
        }
        const newWallet = await createNewWallet(newWalletName);
        if (newWallet) {
            setCustomWalletName('');
            setShowCustomWallet(false);
            setError('');
            window.dispatchEvent(new Event('wallet-added'));
        }
    };

    const handleDeleteWallet = async (walletId, walletName) => {
        if (walletName === 'Cash') {
            setError('Tidak dapat menghapus wallet Cash');
            return;
        }
        if (window.confirm(`Hapus wallet "${walletName}"?`)) {
            try {
                await walletService.delete(walletId);
                const updatedWallets = await refreshWallets();
                if (formData.walletId === walletId && updatedWallets.length > 0) {
                    const cashWallet = updatedWallets.find(w => w.name === 'Cash');
                    setFormData(prev => ({
                        ...prev,
                        walletId: cashWallet ? cashWallet.id : updatedWallets[0].id
                    }));
                }
                window.dispatchEvent(new Event('wallet-added'));
                setError('');
            } catch (error) {
                console.error('Error deleting wallet:', error);
                setError('Gagal menghapus wallet');
            }
        }
    };

    const handleSelectWallet = (walletId, walletName) => {
        setFormData(prev => ({ ...prev, walletId: walletId }));
    };

    const categories = type === 'income'
        ? ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
        : ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Other'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const numericAmount = getNumericAmount();
            if (!numericAmount || numericAmount <= 0) throw new Error('Nominal harus lebih dari 0');
            if (!formData.walletId) throw new Error('Pilih wallet');

            const selectedWallet = wallets.find(w => w.id === formData.walletId);
            const dataToSend = {
                amount: numericAmount,
                paymentMethod: selectedWallet?.name || 'Cash',
                category: formData.category,
                description: formData.description || '',
                walletId: formData.walletId
            };

            if (type === 'income') {
                await incomeService.create(dataToSend);
            } else {
                await expenseService.create(dataToSend);
            }

            setFormData({
                amount: '',
                category: type === 'income' ? 'Salary' : 'Food',
                description: '',
                walletId: wallets.find(w => w.name === 'Cash')?.id || wallets[0]?.id || ''
            });

            window.dispatchEvent(new Event('transaction-added'));
            window.dispatchEvent(new Event('wallet-added'));

            if (onSuccess) onSuccess(type);
            onClose();
        } catch (err) {
            console.error('❌ Error:', err);
            setError(err.message || 'Gagal menyimpan transaksi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal Container - Responsive */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                            className="relative w-full max-w-[95%] sm:max-w-md bg-white rounded-2xl sm:rounded-2xl shadow-xl pointer-events-auto overflow-hidden max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 bg-white flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${type === 'income' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                        {type === 'income' ? <TrendingUp size={16} className="sm:w-5 sm:h-5" /> : <TrendingDown size={16} className="sm:w-5 sm:h-5" />}
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                                            {type === 'income' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'}
                                        </h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400">Isi detail transaksi Anda</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    <X size={16} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 sm:p-5">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs sm:text-sm flex items-center gap-2"
                                    >
                                        <span>⚠️</span>
                                        {error}
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                                    {/* Type Toggle */}
                                    <div className="flex gap-1.5 sm:gap-2 p-1 bg-slate-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setType('income');
                                                const cashWallet = wallets.find(w => w.name === 'Cash');
                                                setFormData(prev => ({
                                                    ...prev,
                                                    category: 'Salary',
                                                    amount: prev.amount,
                                                    walletId: cashWallet?.id || wallets[0]?.id || ''
                                                }));
                                                setError('');
                                            }}
                                            className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            Pemasukan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setType('expense');
                                                const cashWallet = wallets.find(w => w.name === 'Cash');
                                                setFormData(prev => ({
                                                    ...prev,
                                                    category: 'Food',
                                                    amount: prev.amount,
                                                    walletId: cashWallet?.id || wallets[0]?.id || ''
                                                }));
                                                setError('');
                                            }}
                                            className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            Pengeluaran
                                        </button>
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-1 sm:mb-1.5">Nominal</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">Rp</span>
                                            <input
                                                type="text"
                                                placeholder="0"
                                                value={formData.amount}
                                                onChange={handleAmountChange}
                                                className="w-full pl-7 sm:pl-8 pr-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm sm:text-base font-medium focus:border-emerald-300 focus:bg-white outline-none transition-all"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    {/* Wallet Selection */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                                            <label className="block text-[10px] sm:text-xs font-medium text-slate-500">
                                                {type === 'income' ? 'Wallet Tujuan' : 'Wallet Sumber'}
                                            </label>
                                            <button
                                                type="button"
                                                onClick={refreshWallets}
                                                disabled={refreshing}
                                                className="p-0.5 sm:p-1 text-slate-400 hover:text-emerald-500 transition-all"
                                            >
                                                <RefreshCw size={10} className="sm:w-3 sm:h-3" />
                                            </button>
                                        </div>
                                        {loadingWallets || refreshing ? (
                                            <div className="flex justify-center py-2 sm:py-3">
                                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : wallets.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                {wallets.map((wallet) => {
                                                    const isSelected = formData.walletId === wallet.id;
                                                    return (
                                                        <div key={wallet.id} className="relative group">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelectWallet(wallet.id, wallet.name)}
                                                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${isSelected
                                                                    ? (type === 'income' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')
                                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                    }`}
                                                            >
                                                                <Wallet size={10} className="sm:w-3 sm:h-3" />
                                                                {wallet.name}
                                                                {isSelected && <Check size={8} className="sm:w-2.5 sm:h-2.5" />}
                                                            </button>
                                                            {wallet.name !== 'Cash' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteWallet(wallet.id, wallet.name)}
                                                                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                                                                >
                                                                    <Trash2 size={8} className="sm:w-2.5 sm:h-2.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-2 sm:py-3 text-slate-400 text-[10px] sm:text-xs">
                                                Belum ada wallet. Tambah wallet baru di bawah
                                            </div>
                                        )}
                                    </div>

                                    {/* Tombol Tambah Wallet Baru */}
                                    {!showCustomWallet ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowCustomWallet(true)}
                                            disabled={creatingWallet}
                                            className="w-full py-1.5 sm:py-2.5 border border-dashed border-emerald-300 rounded-xl text-emerald-600 text-[10px] sm:text-sm font-medium hover:bg-emerald-50 transition-all flex items-center justify-center gap-1 sm:gap-2 disabled:opacity-50"
                                        >
                                            <Plus size={12} className="sm:w-4 sm:h-4" />
                                            Tambah Wallet Baru
                                        </button>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-1.5 sm:space-y-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Contoh: Bank BRI, GoPay, OVO"
                                                value={customWalletName}
                                                onChange={(e) => setCustomWalletName(e.target.value)}
                                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2.5 bg-slate-50 border border-emerald-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-400 focus:bg-white transition-all"
                                                autoFocus
                                                disabled={creatingWallet}
                                            />
                                            <div className="flex gap-1.5 sm:gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomWallet}
                                                    disabled={creatingWallet}
                                                    className="flex-1 py-1.5 sm:py-2 bg-emerald-500 text-white rounded-lg text-[10px] sm:text-sm font-medium hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1 sm:gap-2"
                                                >
                                                    {creatingWallet ? (
                                                        <>
                                                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            <span>Membuat...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={12} className="sm:w-4 sm:h-4" />
                                                            <span>Buat Wallet</span>
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCustomWallet(false);
                                                        setCustomWalletName('');
                                                        setError('');
                                                    }}
                                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] sm:text-sm font-medium hover:bg-slate-200 transition-all"
                                                    disabled={creatingWallet}
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Category */}
                                    <div>
                                        <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-1 sm:mb-1.5">Kategori</label>
                                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, category: cat })}
                                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all ${formData.category === cat
                                                        ? (type === 'income' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-[10px] sm:text-xs font-medium text-slate-500 mb-1 sm:mb-1.5">Catatan (Opsional)</label>
                                        <input
                                            type="text"
                                            placeholder="Tambah catatan..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-300 focus:bg-white transition-all"
                                            disabled={loading}
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading || !formData.walletId}
                                        className={`w-full py-2 sm:py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${type === 'income'
                                            ? 'bg-emerald-500 hover:bg-emerald-600'
                                            : 'bg-rose-500 hover:bg-rose-600'
                                            } ${(loading || !formData.walletId) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={14} className="sm:w-4 sm:h-4" />
                                                <span>Simpan {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}