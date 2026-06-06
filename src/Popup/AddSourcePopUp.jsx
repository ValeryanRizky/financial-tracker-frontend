import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Plus, Wallet, CreditCard, Smartphone, Landmark,
    Banknote, QrCode, TrendingUp, Building2, CircleDollarSign,
    CheckCircle, AlertCircle, ArrowRight, PiggyBank, Coins
} from 'lucide-react';
import { walletService } from '../services/wallet.service';

// Tipe wallet dengan icon dan warna
const WALLET_TYPES = [
    {
        value: 'bank',
        label: 'Bank',
        icon: Landmark,
        color: 'bg-blue-600',
        lightColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
        categories: ['payment', 'savings']
    },
    {
        value: 'ewallet',
        label: 'E-Wallet',
        icon: Smartphone,
        color: 'bg-green-600',
        lightColor: 'bg-green-50',
        textColor: 'text-green-600',
        borderColor: 'border-green-200',
        categories: ['digital', 'payment']
    },
    {
        value: 'cash',
        label: 'Cash',
        icon: Coins,
        color: 'bg-emerald-600',
        lightColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
        borderColor: 'border-emerald-200',
        categories: ['payment', 'savings']
    },
    {
        value: 'credit',
        label: 'Credit Card',
        icon: CreditCard,
        color: 'bg-rose-600',
        lightColor: 'bg-rose-50',
        textColor: 'text-rose-600',
        borderColor: 'border-rose-200',
        categories: ['credit']
    },
    {
        value: 'debit',
        label: 'Debit Card',
        icon: CreditCard,
        color: 'bg-purple-600',
        lightColor: 'bg-purple-50',
        textColor: 'text-purple-600',
        borderColor: 'border-purple-200',
        categories: ['payment']
    },
    {
        value: 'qris',
        label: 'QRIS',
        icon: QrCode,
        color: 'bg-amber-600',
        lightColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-200',
        categories: ['digital']
    },
    {
        value: 'transfer',
        label: 'Transfer',
        icon: TrendingUp,
        color: 'bg-indigo-600',
        lightColor: 'bg-indigo-50',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-200',
        categories: ['payment']
    },
    {
        value: 'other',
        label: 'Other',
        icon: Wallet,
        color: 'bg-slate-600',
        lightColor: 'bg-slate-50',
        textColor: 'text-slate-600',
        borderColor: 'border-slate-200',
        categories: ['other']
    }
];

// Kategori
const CATEGORIES = [
    { value: 'payment', label: 'Payment Source', description: 'For daily transactions', icon: CircleDollarSign },
    { value: 'digital', label: 'Digital Wallet', description: 'E-wallets & QR payments', icon: Smartphone },
    { value: 'credit', label: 'Credit Card', description: 'Credit & installment cards', icon: CreditCard },
    { value: 'savings', label: 'Savings', description: 'Save money for future', icon: PiggyBank },
    { value: 'other', label: 'Other', description: 'Other payment methods', icon: Wallet }
];

// Icons untuk dipilih
const ICONS = [
    { value: '🏦', label: 'Bank' },
    { value: '📱', label: 'Mobile' },
    { value: '💳', label: 'Card' },
    { value: '💰', label: 'Money' },
    { value: '💵', label: 'Cash' },
    { value: '🏧', label: 'ATM' },
    { value: '💸', label: 'Transfer' },
    { value: '🪙', label: 'Coin' },
    { value: '💎', label: 'Premium' },
    { value: '⭐', label: 'Star' }
];

// Warna
const COLORS = [
    { value: 'bg-blue-600', label: 'Blue', class: 'bg-blue-600' },
    { value: 'bg-green-600', label: 'Green', class: 'bg-green-600' },
    { value: 'bg-emerald-600', label: 'Emerald', class: 'bg-emerald-600' },
    { value: 'bg-rose-600', label: 'Rose', class: 'bg-rose-600' },
    { value: 'bg-purple-600', label: 'Purple', class: 'bg-purple-600' },
    { value: 'bg-amber-600', label: 'Amber', class: 'bg-amber-600' },
    { value: 'bg-indigo-600', label: 'Indigo', class: 'bg-indigo-600' },
    { value: 'bg-slate-600', label: 'Slate', class: 'bg-slate-600' }
];

// 🔥 FUNGSI RESET STATE
const getInitialFormData = () => ({
    name: '',
    type: 'bank',
    category: 'payment',
    balance: '',
    icon: '🏦',
    color: 'bg-blue-600',
    institution: '',
    cardNumber: '',
    notes: ''
});

export default function AddSourcePopUp({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(getInitialFormData());

    // 🔥 RESET STATE setiap modal dibuka
    useEffect(() => {
        if (isOpen) {
            // Reset semua state ke awal
            setStep(1);
            setLoading(false);
            setError('');
            setSuccess(false);
            setFormData(getInitialFormData());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleTypeSelect = (type) => {
        const selectedType = WALLET_TYPES.find(t => t.value === type);
        if (selectedType) {
            setFormData({
                ...formData,
                type,
                category: selectedType.categories[0] || 'payment',
                icon: type === 'bank' ? '🏦' :
                    type === 'ewallet' ? '📱' :
                        type === 'cash' ? '💰' :
                            type === 'credit' ? '💳' :
                                type === 'debit' ? '💳' :
                                    type === 'qris' ? '📱' :
                                        type === 'transfer' ? '💸' : '🏦',
                color: selectedType.color
            });
            setStep(2);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            if (!formData.name) {
                throw new Error('Source name is required');
            }
            if (!formData.type) {
                throw new Error('Please select a source type');
            }
            if (!formData.category) {
                throw new Error('Please select a category');
            }
            if (formData.balance && parseFloat(formData.balance) < 0) {
                throw new Error('Balance cannot be negative');
            }

            const dataToSend = {
                name: formData.name,
                type: formData.type,
                category: formData.category,
                balance: formData.balance ? parseFloat(formData.balance) : 0,
                icon: formData.icon,
                color: formData.color,
                institution: formData.institution,
                cardNumber: formData.cardNumber,
                notes: formData.notes
            };

            const response = await walletService.create(dataToSend);
            console.log('Wallet created:', response);

            setSuccess(true);

            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 1500);

        } catch (err) {
            console.error('Error:', err);
            setError(err.message || 'Failed to create source');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setStep(1);
        setError('');
    };

    const handleClose = () => {
        // Reset state sebelum menutup
        setStep(1);
        setLoading(false);
        setError('');
        setSuccess(false);
        setFormData(getInitialFormData());
        onClose();
    };

    const selectedType = WALLET_TYPES.find(t => t.value === formData.type);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        onClick={handleClose}
                    />

                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl pointer-events-auto overflow-hidden"
                        >
                            {/* Header with progress */}
                            <div className="p-6 pb-4 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Plus size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">
                                                {step === 1 ? 'Add Payment Source' : 'Source Details'}
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                {step === 1 ? 'Choose source type' : 'Fill in the details'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
                                    >
                                        <X size={18} className="text-slate-400" />
                                    </button>
                                </div>

                                {/* Progress Steps */}
                                <div className="flex items-center gap-2">
                                    <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                    <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="px-6 pt-2">
                                <AnimatePresence mode="wait">
                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} />
                                            <span>Source added successfully!</span>
                                        </motion.div>
                                    )}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Content */}
                            <div className="p-6 pt-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {step === 1 ? (
                                    /* Step 1: Select Type */
                                    <div className="space-y-3">
                                        {WALLET_TYPES.map(type => (
                                            <motion.button
                                                key={type.value}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleTypeSelect(type.value)}
                                                className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-white rounded-2xl border-2 border-transparent hover:border-indigo-200 transition-all group"
                                            >
                                                <div className={`w-12 h-12 ${type.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                                                    <type.icon size={22} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                        {type.label}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">
                                                        {type.categories.map(c =>
                                                            CATEGORIES.find(cat => cat.value === c)?.label
                                                        ).join(', ')}
                                                    </p>
                                                </div>
                                                <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                            </motion.button>
                                        ))}
                                    </div>
                                ) : (
                                    /* Step 2: Fill Details */
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Source Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                                Source Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g., BCA, GoPay, Cash"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-indigo-300 outline-none transition-colors"
                                                required
                                                disabled={loading || success}
                                                autoFocus
                                            />
                                        </div>

                                        {/* Category (if not set automatically) */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                                Category
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-indigo-300 outline-none"
                                                disabled={loading || success}
                                            >
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Initial Balance */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                                Initial Balance (Optional)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={formData.balance}
                                                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-indigo-300 outline-none"
                                                    min="0"
                                                    disabled={loading || success}
                                                />
                                            </div>
                                        </div>

                                        {/* Institution (for banks/cards) */}
                                        {(formData.type === 'bank' || formData.type === 'credit' || formData.type === 'debit') && (
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                                    Institution/Bank Name
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Bank Central Asia"
                                                    value={formData.institution}
                                                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-indigo-300 outline-none"
                                                    disabled={loading || success}
                                                />
                                            </div>
                                        )}

                                        {/* Card Number (for cards) */}
                                        {(formData.type === 'credit' || formData.type === 'debit') && (
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                                    Card Number (Last 4 digits)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="**** 1234"
                                                    value={formData.cardNumber}
                                                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-indigo-300 outline-none"
                                                    maxLength="4"
                                                    disabled={loading || success}
                                                />
                                            </div>
                                        )}

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                                Notes (Optional)
                                            </label>
                                            <textarea
                                                placeholder="Add any notes..."
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                rows="2"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-indigo-300 outline-none resize-none"
                                                disabled={loading || success}
                                            />
                                        </div>

                                        {/* Icon Selection */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-2">
                                                Choose Icon
                                            </label>
                                            <div className="grid grid-cols-5 gap-2 p-2 bg-slate-50 rounded-xl">
                                                {ICONS.map(icon => (
                                                    <button
                                                        key={icon.value}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, icon: icon.value })}
                                                        className={`p-2 rounded-lg text-xl transition-all transform hover:scale-110 ${formData.icon === icon.value
                                                            ? 'bg-indigo-600 text-white scale-110'
                                                            : 'bg-white text-slate-600 hover:bg-indigo-50'
                                                            }`}
                                                        title={icon.label}
                                                    >
                                                        {icon.value}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Color Selection */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-2">
                                                Theme Color
                                            </label>
                                            <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl">
                                                {COLORS.map(color => (
                                                    <button
                                                        key={color.value}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, color: color.value })}
                                                        className={`w-8 h-8 rounded-lg transition-all transform hover:scale-110 ${formData.color === color.value
                                                            ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110'
                                                            : ''
                                                            } ${color.class}`}
                                                        title={color.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                                disabled={loading || success}
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading || success}
                                                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'Creating...' : success ? 'Success!' : 'Create Source'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}