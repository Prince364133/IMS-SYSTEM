'use client';

import { useState, useEffect } from 'react';
import api from '../../../lib/api';
import {
    Box, Package, Plus, Search, Loader2, X, AlertCircle,
    ArrowUpRight, ArrowDownLeft, History, Filter, MoreVertical,
    Edit2, Trash2, LayoutGrid, List as ListIcon, ShieldAlert
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const STATUS_BADGE: Record<string, string> = {
    active: 'badge-green',
    low_stock: 'badge-orange',
    out_of_stock: 'badge-red',
    discontinued: 'badge-gray',
};

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState<'items' | 'transactions'>('items');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [itemsRes, catRes] = await Promise.all([
                api.get('/api/inventory/items'),
                api.get('/api/inventory/categories')
            ]);
            setItems(itemsRes.data.items || []);
            setCategories(catRes.data.categories || []);
        } catch (err) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Inventory & Assets</h1>
                    <p className="page-subtitle">Manage company stock and internal assets</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary">
                        <History className="w-4 h-4" /> Transactions
                    </button>
                    <button className="btn-primary">
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Box className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Items</p>
                        <p className="text-xl font-bold text-gray-900">{items.length}</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">In Stock</p>
                        <p className="text-xl font-bold text-gray-900">{items.filter(i => i.totalQuantity > i.minStockLevel).length}</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-l-4 border-l-orange-500">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Low Stock</p>
                        <p className="text-xl font-bold text-gray-900">{items.filter(i => i.status === 'low_stock').length}</p>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-l-4 border-l-red-500">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Out of Stock</p>
                        <p className="text-xl font-bold text-gray-900">{items.filter(i => i.status === 'out_of_stock').length}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search items by name or SKU..."
                        className="input pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setView('grid')}
                            className={clsx("p-1.5 rounded-md transition-all", view === 'grid' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={clsx("p-1.5 rounded-md transition-all", view === 'list' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700")}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <select className="select w-40">
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="card py-20 text-center">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No items found</h3>
                    <p className="text-gray-500">Try adjusting your search or add a new item to get started.</p>
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        <div key={item._id} className="card group hover:border-indigo-200 hover:shadow-md transition-all p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Box className="w-5 h-5" />
                                </div>
                                <span className={clsx("badge text-[10px] uppercase font-bold", STATUS_BADGE[item.status] || 'badge-gray')}>
                                    {item.status.replace('_', ' ')}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
                            <p className="text-xs text-gray-400 font-mono mb-3 uppercase tracking-tighter">{item.sku || 'No SKU'}</p>

                            <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none mb-1">Stock</p>
                                    <p className={clsx("text-lg font-black",
                                        item.totalQuantity <= item.minStockLevel ? "text-orange-500" : "text-gray-900"
                                    )}>
                                        {item.totalQuantity} <span className="text-xs font-normal text-gray-400">pcs</span>
                                    </p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Item Details</th>
                                    <th>Category</th>
                                    <th>SKU</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item._id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <Box className="w-4 h-4" />
                                                </div>
                                                <span className="font-semibold text-gray-900">{item.name}</span>
                                            </div>
                                        </td>
                                        <td><span className="text-sm text-gray-600">{item.category?.name || '—'}</span></td>
                                        <td><span className="text-xs font-mono text-gray-400 uppercase">{item.sku || '—'}</span></td>
                                        <td>
                                            <span className={clsx("font-bold", item.totalQuantity <= item.minStockLevel ? "text-orange-600" : "text-gray-900")}>
                                                {item.totalQuantity}
                                            </span>
                                        </td>
                                        <td><span className="text-gray-600">₹{item.unitPrice?.toLocaleString()}</span></td>
                                        <td>
                                            <span className={clsx("badge text-[10px] uppercase font-bold", STATUS_BADGE[item.status] || 'badge-gray')}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><MoreVertical className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
