import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: 'Instaura IMS — Internal Management System',
    description: 'Scalable, cloud-hosted Internal Management System for Instaura.',
    keywords: 'IMS, HRMS, project management, attendance, Instaura',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="font-sans">
                <Providers>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: { borderRadius: '12px', fontSize: '14px', fontWeight: 500 },
                            success: { style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #d1fae5' } },
                            error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' } },
                        }}
                    />
                </Providers>
            </body>
        </html>
    );
}
