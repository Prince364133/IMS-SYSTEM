'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from './api';

interface Settings {
    companyName: string;
    logoUrl: string;
    themeColor: string;
}

interface SettingsContextType {
    settings: Settings;
    refreshSettings: () => Promise<void>;
    isLoading: boolean;
}

const defaultSettings: Settings = {
    companyName: 'Instaura IMS',
    logoUrl: '',
    themeColor: '#cf1d29',
};

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    refreshSettings: async () => { },
    isLoading: true,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const { data } = await api.get('/api/settings');
            const newSettings = data.settings || defaultSettings;
            setSettings(newSettings);

            // Apply theme color dynamically to root
            if (newSettings.themeColor) {
                document.documentElement.style.setProperty('--theme-color', newSettings.themeColor);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, refreshSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
