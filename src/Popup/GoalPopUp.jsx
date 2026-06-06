import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Target, CheckCircle, AlertCircle,
    Plus, Minus, Laptop, Plane, Shield, Home, Car, Book, Heart,
    GraduationCap, Gamepad, Dumbbell, Music,
    Rocket, Sparkles, Zap
} from 'lucide-react';
import { goalService } from '../services/goal.service';

const ICONS = [
    { name: 'Laptop', component: Laptop, label: '💻 Laptop' },
    { name: 'Plane', component: Plane, label: '✈️ Plane' },
    { name: 'Shield', component: Shield, label: '🛡️ Shield' },
    { name: 'Home', component: Home, label: '🏠 Home' },
    { name: 'Car', component: Car, label: '🚗 Car' },
    { name: 'Book', component: Book, label: '📚 Book' },
    { name: 'Heart', component: Heart, label: '❤️ Heart' },
    { name: 'GraduationCap', component: GraduationCap, label: '🎓 Graduation' },
    { name: 'Gamepad', component: Gamepad, label: '🎮 Game' },
    { name: 'Dumbbell', component: Dumbbell, label: '💪 Fitness' },
    { name: 'Music', component: Music, label: '🎵 Music' },
    { name: 'Rocket', component: Rocket, label: '🚀 Rocket' },
    { name: 'Sparkles', component: Sparkles, label: '✨ Sparkles' },
    { name: 'Zap', component: Zap, label: '⚡ Zap' }
];

const SOLID_COLORS = [
    { value: 'bg-blue-600', label: 'Blue', class: 'bg-blue-600', gradient: 'from-blue-500 to-blue-600' },
    { value: 'bg-rose-500', label: 'Rose', class: 'bg-rose-500', gradient: 'from-rose-500 to-rose-600' },
    { value: 'bg-emerald-500', label: 'Emerald', class: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600' },
    { value: 'bg-purple-600', label: 'Purple', class: 'bg-purple-600', gradient: 'from-purple-500 to-purple-600' },
    { value: 'bg-amber-500', label: 'Amber', class: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600' },
    { value: 'bg-indigo-600', label: 'Indigo', class: 'bg-indigo-600', gradient: 'from-indigo-500 to-indigo-600' }
];

const getGradientFromSolid = (solidColor) => {
    const color = SOLID_COLORS.find(c => c.value === solidColor);
    return color ? color.gradient : 'from-indigo-500 to-indigo-600';
};

const CATEGORIES = [
    'Tech', 'Travel', 'Finance', 'Education', 'Health', 'Property', 'Vehicle', 'Entertainment', 'Other'
];

export default function GoalPopUp({ isOpen, onClose, goal, onSuccess }) {
    const isManageMode = goal !== null && goal !== undefined;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [action, setAction] = useState('add');
    const [formData, setFormData] = useState({
        title: '', category: 'Tech', targetAmount: '', deadline: '', color: 'bg-blue-600', icon: 'Laptop'
    });
    const [amount, setAmount] = useState('');

    const formatIDR = (val) => {
        if (val === undefined || val === null) return 'Rp 0';
        return `Rp ${val.toLocaleString('id-ID')}`;
    };

    const handleAmountChange = (e) => {
        const digitsOnly = e.target.value.replace(/[^\d]/g, '');
        if (!digitsOnly) { setAmount(''); return; }
        setAmount(parseInt(digitsOnly, 10).toLocaleString('id-ID'));
    };

    const getNumericAmount = () => {
        if (!amount) return 0;
        return parseInt(amount.replace(/[^\d]/g, ''), 10) || 0;
    };

    const handleTargetChange = (e) => {
        const digitsOnly = e.target.value.replace(/[^\d]/g, '');
        if (!digitsOnly) { setFormData({ ...formData, targetAmount: '' }); return; }
        setFormData({ ...formData, targetAmount: parseInt(digitsOnly, 10).toLocaleString('id-ID') });
    };

    const getNumericTarget = () => {
        if (!formData.targetAmount) return 0;
        return parseInt(formData.targetAmount.replace(/[^\d]/g, ''), 10) || 0;
    };

    useEffect(() => {
        if (isOpen) {
            if (isManageMode) {
                setAmount('');
                setAction('add');
            } else {
                setFormData({
                    title: '', category: 'Tech', targetAmount: '', deadline: '', color: 'bg-blue-600', icon: 'Laptop'
                });
            }
            setError('');
            setSuccess(false);
            setLoading(false);
        }
    }, [isOpen, goal]);

    if (!isOpen) return null;

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
            if (!formData.title) throw new Error('Title is required');
            const numericTarget = getNumericTarget();
            if (!numericTarget || numericTarget <= 0) throw new Error('Target amount must be greater than 0');
            if (!formData.deadline) throw new Error('Deadline is required');

            const deadline = new Date(formData.deadline);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            if (deadline < today) throw new Error('Deadline cannot be in the past');

            await goalService.create({
                title: formData.title,
                category: formData.category,
                targetAmount: numericTarget,
                currentAmount: 0,
                deadline: formData.deadline,
                color: formData.color,
                icon: formData.icon
            });
            setSuccess(true);
            setTimeout(() => { if (onSuccess) onSuccess(); onClose(); }, 1500);
        } catch (err) {
            setError(err.message);
            console.error('Create error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleManageSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
            const numericAmount = getNumericAmount();
            if (!numericAmount || numericAmount <= 0) throw new Error('Masukkan nominal yang valid');
            if (action === 'add') {
                if (goal.currentAmount + numericAmount > goal.targetAmount) throw new Error('Amount would exceed target');
                await goalService.addContribution(goal.id, numericAmount);
            } else {
                if (goal.currentAmount - numericAmount < 0) throw new Error('Insufficient balance in goal');
                await goalService.addContribution(goal.id, -numericAmount);
            }
            setSuccess(true);
            setAmount('');
            if (onSuccess) await onSuccess();
            setTimeout(() => { setSuccess(false); onClose(); }, 1000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const progress = isManageMode ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const remaining = isManageMode ? goal.targetAmount - goal.currentAmount : 0;

    const selectedIcon = ICONS.find(i => i.name === formData.icon);
    const IconComponent = selectedIcon?.component || Target;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                            className="relative w-full max-w-[95%] sm:max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden max-h-[85vh] flex flex-col"
                        >
                            <div className={`relative overflow-hidden bg-gradient-to-r ${isManageMode ? 'from-indigo-500 to-indigo-600' : 'from-blue-500 to-blue-600'} p-3 sm:p-4 flex-shrink-0`}>
                                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16" />
                                <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full -ml-10 sm:-ml-12 -mb-10 sm:-mb-12" />

                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                            <Target size={16} className="sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm sm:text-base font-bold text-white">
                                                {isManageMode ? 'Kelola Goal' : 'Buat Goal Baru'}
                                            </h2>
                                            <p className="text-white/80 text-[10px] sm:text-[11px]">
                                                {isManageMode ? goal?.title : 'Tentukan target keuangan Anda'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1 sm:p-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all text-white"
                                    >
                                        <X size={14} className="sm:w-4 sm:h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-3 sm:p-4 overflow-y-auto flex-1">
                                <AnimatePresence>
                                    {success && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-2 sm:mb-3 p-2 sm:p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-[11px] sm:text-xs flex items-center gap-1.5 sm:gap-2"
                                        >
                                            <CheckCircle size={12} className="sm:w-[14px] sm:h-[14px]" />
                                            <span>{isManageMode ? 'Goal berhasil diupdate!' : 'Goal berhasil dibuat!'}</span>
                                        </motion.div>
                                    )}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-2 sm:mb-3 p-2 sm:p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-[11px] sm:text-xs"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {isManageMode ? (
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className={`p-2 sm:p-3 rounded-xl ${goal.color || 'bg-indigo-600'} text-white`}>
                                            <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                                                <span className="text-[9px] sm:text-[10px] font-medium opacity-80">Progress</span>
                                                <span className="text-[11px] sm:text-xs font-bold">{progress.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-1 sm:h-1.5 bg-white/30 rounded-full mb-2 sm:mb-3">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(progress, 100)}%` }}
                                                    transition={{ duration: 0.8 }}
                                                    className="h-full bg-white rounded-full"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                                <div>
                                                    <p className="text-[8px] sm:text-[9px] font-medium opacity-80">Terkumpul</p>
                                                    <p className="text-xs sm:text-sm font-bold">{formatIDR(goal.currentAmount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] sm:text-[9px] font-medium opacity-80">Target</p>
                                                    <p className="text-xs sm:text-sm font-bold">{formatIDR(goal.targetAmount)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-white/20">
                                                <p className="text-[8px] sm:text-[9px] font-medium opacity-80">Sisa Target</p>
                                                <p className="text-sm sm:text-base font-bold">{formatIDR(remaining)}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-1.5 sm:gap-2">
                                            <button
                                                type="button"
                                                onClick={() => { setAction('add'); setAmount(''); setError(''); }}
                                                className={`flex-1 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${action === 'add'
                                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                <Plus size={12} className="sm:w-[14px] sm:h-[14px]" />
                                                <span>Tambah</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setAction('subtract'); setAmount(''); setError(''); }}
                                                className={`flex-1 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${action === 'subtract'
                                                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                <Minus size={12} className="sm:w-[14px] sm:h-[14px]" />
                                                <span>Tarik</span>
                                            </button>
                                        </div>

                                        <form onSubmit={handleManageSubmit} className="space-y-2 sm:space-y-3">
                                            <div>
                                                <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                    {action === 'add' ? 'Jumlah Ditambahkan' : 'Jumlah Ditarik'}
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-sm">Rp</span>
                                                    <input
                                                        type="text"
                                                        placeholder="0"
                                                        value={amount}
                                                        onChange={handleAmountChange}
                                                        className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm sm:text-base font-bold focus:border-emerald-300 focus:bg-white outline-none transition-all"
                                                        required
                                                        disabled={loading || success}
                                                        autoFocus
                                                    />
                                                </div>
                                                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 sm:mt-1">
                                                    Maksimal: {formatIDR(action === 'add' ? remaining : goal.currentAmount)}
                                                </p>
                                            </div>

                                            <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                                                {[50000, 100000, 500000, 1000000].map((qa) => {
                                                    const isDisabled = qa > (action === 'add' ? remaining : goal.currentAmount);
                                                    return (
                                                        <button
                                                            key={qa}
                                                            type="button"
                                                            onClick={() => setAmount(qa.toLocaleString('id-ID'))}
                                                            disabled={isDisabled}
                                                            className={`flex-1 min-w-[55px] sm:min-w-[60px] py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-medium transition-all ${isDisabled
                                                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                                }`}
                                                        >
                                                            Rp {qa.toLocaleString('id-ID')}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading || success || !amount}
                                                className={`w-full py-2 sm:py-2.5 rounded-xl text-white font-bold transition-all transform active:scale-95 text-xs sm:text-sm ${action === 'add'
                                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-md'
                                                    : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-md'
                                                    } ${(loading || success || !amount) ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {loading ? (
                                                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                        <span>Memproses...</span>
                                                    </div>
                                                ) : success ? 'Berhasil!' : `Konfirmasi ${action === 'add' ? 'Penambahan' : 'Penarikan'}`}
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <form onSubmit={handleCreateSubmit} className="space-y-2 sm:space-y-3">
                                        <div>
                                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                Nama Goal
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: MacBook Pro M3"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:border-indigo-300 focus:bg-white outline-none transition-all"
                                                required
                                                disabled={loading || success}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                Kategori
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-indigo-300 focus:bg-white outline-none transition-all"
                                                disabled={loading || success}
                                            >
                                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                Target
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-sm">Rp</span>
                                                <input
                                                    type="text"
                                                    placeholder="0"
                                                    value={formData.targetAmount}
                                                    onChange={handleTargetChange}
                                                    className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm sm:text-base font-bold focus:border-indigo-300 focus:bg-white outline-none transition-all"
                                                    required
                                                    disabled={loading || success}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                Tenggat Waktu
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.deadline}
                                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-indigo-300 focus:bg-white outline-none transition-all"
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                                disabled={loading || success}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                Pilih Icon
                                            </label>
                                            <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                                                {ICONS.slice(0, 8).map(icon => {
                                                    const IconComp = icon.component;
                                                    const isSelected = formData.icon === icon.name;
                                                    return (
                                                        <button
                                                            key={icon.name}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, icon: icon.name })}
                                                            className={`flex items-center justify-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 rounded-lg border transition-all ${isSelected
                                                                ? `border-indigo-400 bg-indigo-50 text-indigo-600`
                                                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                                                                }`}
                                                        >
                                                            <IconComp size={10} className="sm:w-3 sm:h-3" />
                                                            <span className="text-[8px] sm:text-[9px] font-medium">{icon.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                Warna Tema
                                            </label>
                                            <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                                {SOLID_COLORS.map(color => (
                                                    <button
                                                        key={color.value}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, color: color.value })}
                                                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all ${color.class} ${formData.color === color.value
                                                            ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110'
                                                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                                                            }`}
                                                        title={color.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${getGradientFromSolid(formData.color)} text-white`}>
                                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                                    <IconComponent size={12} className="sm:w-4 sm:h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs sm:text-sm">{formData.title || 'Nama Goal'}</p>
                                                    <p className="text-[8px] sm:text-[10px] opacity-80">{formData.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-[8px] sm:text-[9px] opacity-80">Target</p>
                                                    <p className="text-[10px] sm:text-xs font-bold">{formData.targetAmount ? formatIDR(getNumericTarget()) : 'Rp 0'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] sm:text-[9px] opacity-80">Tenggat</p>
                                                    <p className="text-[10px] sm:text-xs font-bold">{formData.deadline ? new Date(formData.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || success}
                                            className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                                        >
                                            {loading ? (
                                                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    <span>Membuat...</span>
                                                </div>
                                            ) : success ? 'Berhasil!' : 'Buat Goal'}
                                        </button>
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