import React, { useState } from "react";
import { incomeService, expenseService } from "../services/transaction.service";

export default function PopUp({ isOpen, onClose, onSuccess }) {
    // Mode 'income' atau 'expense'
    const [type, setType] = useState('income');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        amount: '',
        paymentMethod: '',
        category: 'Salary',
        description: ''
    });

    if (!isOpen) return null;

    // Kategori berubah sesuai tipe transaksi
    const categories = type === 'income'
        ? ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
        : ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Other'];

    // Payment methods
    const paymentMethods = [
        'Cash',
        'Bank Transfer',
        'E-Wallet',
        'Credit Card',
        'Debit Card',
        'Other'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validasi
            if (!formData.amount || formData.amount <= 0) {
                throw new Error('Amount must be greater than 0');
            }
            if (!formData.paymentMethod) {
                throw new Error('Please select payment method');
            }

            // Siapkan data untuk dikirim
            const dataToSend = {
                amount: parseFloat(formData.amount),
                paymentMethod: formData.paymentMethod,
                category: formData.category,
                description: formData.description || ''
            };

            let response;
            if (type === 'income') {
                response = await incomeService.create(dataToSend);
            } else {
                response = await expenseService.create(dataToSend);
            }

            console.log(`${type} created:`, response);

            // Reset form
            setFormData({
                amount: '',
                paymentMethod: '',
                category: type === 'income' ? 'Salary' : 'Food',
                description: ''
            });

            // Panggil callback onSuccess
            if (onSuccess) {
                onSuccess(type);
            }

            // Close popup
            onClose();
        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay dengan blur */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>

            {/* MODAL - Ukuran seperti awal */}
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
                {/* Toggle Switch Pemasukan / Pengeluaran - Ukuran proporsional */}
                <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 relative">
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-500 ease-out shadow-sm ${type === 'income' ? 'left-1 bg-emerald-500' : 'left-[calc(50%-2px)] bg-rose-500'
                            }`}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setType('income');
                            setFormData({ ...formData, category: 'Salary', paymentMethod: '' });
                            setError('');
                        }}
                        className={`relative z-10 flex-1 py-2.5 text-sm font-black transition-colors duration-300 ${type === 'income' ? 'text-white' : 'text-slate-400'
                            }`}
                    >
                        Income
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setType('expense');
                            setFormData({ ...formData, category: 'Food', paymentMethod: '' });
                            setError('');
                        }}
                        className={`relative z-10 flex-1 py-2.5 text-sm font-black transition-colors duration-300 ${type === 'expense' ? 'text-white' : 'text-slate-400'
                            }`}
                    >
                        Expense
                    </button>
                </div>

                {/* Header - Ukuran compact */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            Tambah {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </h2>
                        <p className="text-slate-400 text-xs font-medium">Lengkapi detail transaksi Anda</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all hover:rotate-90"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Input Nominal */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">
                            Nominal Saldo
                        </label>
                        <div className="relative group">
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm transition-colors ${type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                                }`}>
                                Rp
                            </span>
                            <input
                                type="number"
                                placeholder="0"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 text-base font-black focus:bg-white outline-none transition-all focus:ring-0"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Input Payment Method */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">
                            Metode Pembayaran
                        </label>
                        <select
                            required
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 text-sm font-bold focus:bg-white outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-all"
                            disabled={loading}
                        >
                            <option value="">Pilih Bank / Dompet</option>
                            {paymentMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>

                    {/* Kategori Dinamis */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
                            Kategori
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat })}
                                    disabled={loading}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all transform active:scale-90 ${formData.category === cat
                                            ? (type === 'income'
                                                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                                : 'bg-rose-500 text-white shadow-sm shadow-rose-200')
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description (optional) */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 px-1">
                            Catatan (Opsional)
                        </label>
                        <input
                            type="text"
                            placeholder="Tambah catatan..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-800 text-sm font-medium focus:bg-white outline-none transition-all"
                            disabled={loading}
                        />
                    </div>

                    {/* Tombol Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full text-white font-black py-3.5 rounded-2xl shadow-lg transition-all transform active:scale-[0.97] mt-2 flex items-center justify-center gap-2 text-sm ${type === 'income'
                                ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100'
                                : 'bg-rose-500 hover:bg-rose-600 shadow-rose-100'
                            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-sm">Simpan {type === 'income' ? 'Pendapatan' : 'Pengeluaran'}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}