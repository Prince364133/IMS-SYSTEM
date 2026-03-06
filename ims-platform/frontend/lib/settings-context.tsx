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

            // Brand logic
            const themeColor = newCompany?.brandColor || newSettings.themeColor;
            if (themeColor) {
                document.documentElement.style.setProperty('--theme-color', themeColor);
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
