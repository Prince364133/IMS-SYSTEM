'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from './api';

interface Settings {
    companyName: string;
    logoUrl: string;
    themeColor: string;
    webhookUrl?: string;
    webhookSecret?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpSecure?: boolean;
    emailFrom?: string;
    lastEmailTestStatus?: 'success' | 'failure' | 'none';
    lastEmailTestDate?: Date | string;
    lastEmailTestError?: string;

    // AI Settings
    aiProvider?: 'none' | 'openai' | 'groq' | 'gemini';
    openaiKey?: string;
    groqKey?: string;
    geminiKey?: string;
    lastAiTestStatus?: 'success' | 'failure' | 'none';
    lastAiTestDate?: Date | string;
    lastAiTestError?: string;

    // Storage Configuration
    storageMode?: 'cloudinary' | 'google_drive' | 'local';
    googleDriveServiceAccount?: string;
    googleDriveFolderId?: string;
    cloudinaryCloudName?: string;
    cloudinaryApiKey?: string;
    cloudinaryApiSecret?: string;
    lastStorageTestStatus?: 'success' | 'failure' | 'none';
    lastStorageTestDate?: Date | string;
    lastStorageTestError?: string;

    // Database Configuration
    mongoUriDisplay?: string;
}

export interface CompanyConfig {
    companyName: string;
    companyLogo: string;
    emailLogo: string;
    tagline: string;
    brandColor: string;
    websiteUrl: string;
    companyEmail: string;
    supportEmail: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    gstNumber: string;
    registrationNumber: string;
    bankName: string;
    accountHolderName: string;
    bankAccountNumber: string;
    ifscCode: string;
    authorizedSignatory: string;
    designation: string;
    signatureImage: string;
    salaryReleaseDate?: number;
    workingDaysPerMonth?: number;
}

interface SettingsContextType {
    settings: Settings;
    company: CompanyConfig | null;
    refreshSettings: () => Promise<void>;
    isLoading: boolean;
}

const defaultSettings: Settings = {
    companyName: 'Internal Management System',
    logoUrl: '',
    themeColor: '#cf1d29',
};

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    company: null,
    refreshSettings: async () => { },
    isLoading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [company, setCompany] = useState<CompanyConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ── Theme Color Helpers ─────────────────────────────────────────────────────
    function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const cleaned = hex.replace(/^#/, '');
        if (cleaned.length === 3) {
            const r = parseInt(cleaned[0] + cleaned[0], 16);
            const g = parseInt(cleaned[1] + cleaned[1], 16);
            const b = parseInt(cleaned[2] + cleaned[2], 16);
            return { r, g, b };
        }
        if (cleaned.length === 6) {
            const r = parseInt(cleaned.slice(0, 2), 16);
            const g = parseInt(cleaned.slice(2, 4), 16);
            const b = parseInt(cleaned.slice(4, 6), 16);
            return { r, g, b };
        }
        return null;
    }

    function applyThemeColor(hex: string) {
        if (typeof window === 'undefined') return;
        const rgb = hexToRgb(hex);
        if (!rgb) return;
        // Primary channels — used by Tailwind: bg-primary, text-primary, ring-primary, etc.
        document.documentElement.style.setProperty('--primary-rgb', `${rgb.r} ${rgb.g} ${rgb.b}`);
        // Slightly darkened version for hover states (bg-primary-dark)
        const darkR = Math.max(0, rgb.r - 30);
        const darkG = Math.max(0, rgb.g - 10);
        const darkB = Math.max(0, rgb.b - 10);
        document.documentElement.style.setProperty('--primary-dark-rgb', `${darkR} ${darkG} ${darkB}`);
        // Also set hex for any direct CSS var(--theme-color) usages
        document.documentElement.style.setProperty('--theme-color', hex);
    }

    const refreshSettings = async () => {
        try {
            const [settingsRes, companyRes] = await Promise.all([
                api.get('/api/settings'),
                api.get('/api/company-config')
            ]);

            const newSettings = settingsRes.data.settings || defaultSettings;
            setSettings(newSettings);

            const newCompany = companyRes.data.config || null;
            setCompany(newCompany);

            if (typeof window !== 'undefined') {
                // Brand logic — apply theme color as CSS variables for Tailwind
                const themeColor = newCompany?.brandColor || newSettings.themeColor;
                if (themeColor) {
                    applyThemeColor(themeColor);
                }

                // Update Page Title and Favicon
                const title = newCompany?.companyName || newSettings.companyName || 'Internal Management System';
                document.title = `${title} — Management System`;

                const favicon = newCompany?.companyLogo || newSettings.logoUrl;
                if (favicon) {
                    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.getElementsByTagName('head')[0].appendChild(link);
                    }
                    link.href = favicon;
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings/company-config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, company, refreshSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
