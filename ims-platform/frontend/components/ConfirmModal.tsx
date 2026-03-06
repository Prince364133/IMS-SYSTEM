'use client';

import { X, AlertTriangle, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface Props {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
    variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    loading = false,
    variant = 'danger'
}: Props) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: 'bg-red-50 text-red-600 border-red-100 ring-red-500 hover:bg-red-600',
        warning: 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-500 hover:bg-amber-600',
        info: 'bg-blue-50 text-blue-600 border-blue-100 ring-blue-500 hover:bg-blue-600',
    };

    const btnStyles = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
        info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header/Icon */}
                <div className="p-6 text-center">
                    <div className={clsx(
                        "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border",
                        variant === 'danger' ? "bg-red-50 border-red-100" :
                            variant === 'warning' ? "bg-amber-50 border-amber-100" :
                                "bg-blue-50 border-blue-100"
                    )}>
                        <AlertTriangle className={clsx(
                            "w-6 h-6",
                            variant === 'danger' ? "text-red-600" :
                                variant === 'warning' ? "text-amber-600" :
                                    "text-blue-600"
                        )} />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-center gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={clsx(
                            "flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2",
                            btnStyles[variant]
                        )}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
