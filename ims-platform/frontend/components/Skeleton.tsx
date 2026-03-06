'use client';

import clsx from 'clsx';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animate?: 'pulse' | 'shimmer' | 'none';
}

export default function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
    animate = 'shimmer',
}: SkeletonProps) {
    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div
            className={clsx(
                'bg-gray-200 overflow-hidden relative',
                {
                    'rounded-full': variant === 'circular',
                    'rounded-xl': variant === 'rounded',
                    'rounded-md': variant === 'text',
                    'animate-pulse': animate === 'pulse',
                },
                className
            )}
            style={style}
        >
            {animate === 'shimmer' && (
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
        </div>
    );
}

// Pre-built variants for common use cases
export function SkeletonCard() {
    return (
        <div className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="space-y-2 flex-1">
                    <Skeleton variant="text" width="60%" height={12} />
                    <Skeleton variant="text" width="40%" height={10} />
                </div>
            </div>
            <Skeleton variant="rounded" width="100%" height={100} />
            <div className="flex gap-2">
                <Skeleton variant="rounded" width={60} height={24} />
                <Skeleton variant="rounded" width={60} height={24} />
            </div>
        </div>
    );
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="animate-in fade-in duration-500">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="py-4">
                    <Skeleton variant="text" width={i === 0 ? "80%" : "60%"} height={14} />
                </td>
            ))}
        </tr>
    );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i}><Skeleton variant="text" width={60} height={12} /></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <SkeletonTableRow key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function SkeletonStatsCard() {
    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
                <Skeleton variant="text" width="40%" height={14} />
                <Skeleton variant="circular" width={32} height={32} />
            </div>
            <Skeleton variant="text" width="60%" height={24} className="mb-1" />
            <Skeleton variant="text" width="30%" height={10} />
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="card p-5 space-y-4">
            <Skeleton variant="text" width="30%" height={16} />
            <div className="flex items-end gap-2 h-[180px] pt-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="rounded"
                        width="100%"
                        height={`${Math.floor(Math.random() * 60) + 30}%`}
                    />
                ))}
            </div>
        </div>
    );
}

export function SkeletonListItem() {
    return (
        <div className="card p-4 flex items-center gap-4">
            <Skeleton variant="circular" width={12} height={12} />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" height={14} />
                <Skeleton variant="text" width="30%" height={10} />
            </div>
            <div className="flex gap-2">
                <Skeleton variant="rounded" width={60} height={20} />
                <Skeleton variant="rounded" width={60} height={20} />
                <Skeleton variant="circular" width={28} height={28} />
            </div>
        </div>
    );
}

export function SkeletonKanbanColumn() {
    return (
        <div className="rounded-2xl border p-3 min-h-[420px] bg-gray-50 border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <Skeleton variant="text" width="40%" height={14} />
                <Skeleton variant="rounded" width={24} height={16} />
            </div>
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="card p-3 space-y-3">
                        <div className="flex gap-2">
                            <Skeleton variant="circular" width={8} height={8} className="mt-1" />
                            <Skeleton variant="text" width="80%" height={12} />
                        </div>
                        <Skeleton variant="text" width="40%" height={10} className="ml-4" />
                        <div className="flex justify-between items-center ml-4">
                            <Skeleton variant="text" width={40} height={10} />
                            <Skeleton variant="circular" width={24} height={24} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
