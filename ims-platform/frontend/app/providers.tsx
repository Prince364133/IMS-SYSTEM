'use client';

import { SettingsProvider } from '../lib/settings-context';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SettingsProvider>
            {children}
        </SettingsProvider>
    );
}
