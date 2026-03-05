'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, X, FileIcon, ImageIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import clsx from 'clsx';

interface Props {
    relatedId: string;
    relatedModel: string;
    onClose: () => void;
    onSuccess: (file: any) => void;
}

interface FileItem {
    file: File;
    preview?: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
    progress: number;
    error?: string;
    result?: any;
}

const MAX_SIZE_MB = 10;
const ACCEPTED = ['image/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip'];

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FileUploadModal({ relatedId, relatedModel, onClose, onSuccess }: Props) {
    const [items, setItems] = useState<FileItem[]>([]);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((files: File[]) => {
        const newItems: FileItem[] = files
            .filter(f => f.size <= MAX_SIZE_MB * 1024 * 1024)
            .map((file) => ({
                file,
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                status: 'pending',
                progress: 0,
            }));
        setItems((prev) => [...prev, ...newItems]);
    }, []);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
    };

    const removeItem = (idx: number) => {
        setItems((prev) => {
            const next = [...prev];
            if (next[idx].preview) URL.revokeObjectURL(next[idx].preview!);
            next.splice(idx, 1);
            return next;
        });
    };

    const uploadAll = async () => {
        const pending = items.filter(i => i.status === 'pending');
        for (const item of pending) {
            const idx = items.indexOf(item);
            setItems(prev => prev.map((it, i) => i === idx ? { ...it, status: 'uploading' } : it));
            try {
                const form = new FormData();
                form.append('file', item.file);
                form.append('relatedId', relatedId);
                form.append('relatedModel', relatedModel);
                const { data } = await api.post('/api/files/upload', form, {
                    onUploadProgress: (e) => {
                        const pct = Math.round((e.loaded / (e.total || 1)) * 100);
                        setItems(prev => prev.map((it, i) => i === idx ? { ...it, progress: pct } : it));
                    },
                });
                setItems(prev => prev.map((it, i) => i === idx ? { ...it, status: 'done', progress: 100, result: data.file } : it));
                onSuccess(data.file);
            } catch (err: any) {
                setItems(prev => prev.map((it, i) => i === idx ? { ...it, status: 'error', error: err?.response?.data?.error || 'Upload failed' } : it));
            }
        }
    };

    const allDone = items.length > 0 && items.every(i => i.status === 'done' || i.status === 'error');
    const hasPending = items.some(i => i.status === 'pending');
    const isUploading = items.some(i => i.status === 'uploading');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Upload Files</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Drop zone */}
                <div
                    onDrop={onDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onClick={() => inputRef.current?.click()}
                    className={clsx(
                        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                        dragging
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
                    )}
                >
                    <Upload className={clsx('w-8 h-8 mx-auto mb-2', dragging ? 'text-indigo-500' : 'text-gray-300')} />
                    <p className="text-sm font-medium text-gray-700">
                        {dragging ? 'Drop files here' : 'Drag & drop or click to browse'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Images, ZIP · Max {MAX_SIZE_MB}MB each</p>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED.join(',')}
                        onChange={onInputChange}
                        className="hidden"
                    />
                </div>

                {/* File list */}
                {items.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-52 overflow-y-auto scrollbar-thin">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                                {/* Thumbnail or icon */}
                                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                                    {item.preview
                                        ? <img src={item.preview} alt="" className="w-full h-full object-cover" />
                                        : <FileIcon className="w-4 h-4 text-gray-400" />
                                    }
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-800 truncate">{item.file.name}</p>
                                    <p className="text-[10px] text-gray-400">{formatBytes(item.file.size)}</p>
                                    {item.status === 'uploading' && (
                                        <div className="h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                                        </div>
                                    )}
                                    {item.status === 'error' && (
                                        <p className="text-[10px] text-red-500 mt-0.5">{item.error}</p>
                                    )}
                                </div>

                                <div className="flex-shrink-0">
                                    {item.status === 'pending' && (
                                        <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    {item.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                                    {item.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                    {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-5">
                    <button onClick={onClose} className="btn-secondary flex-1">
                        {allDone ? 'Close' : 'Cancel'}
                    </button>
                    {!allDone && (
                        <button
                            onClick={uploadAll}
                            disabled={!hasPending || isUploading}
                            className="btn-primary flex-1"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {isUploading ? 'Uploading...' : `Upload ${items.filter(i => i.status === 'pending').length} file${items.filter(i => i.status === 'pending').length !== 1 ? 's' : ''}`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
