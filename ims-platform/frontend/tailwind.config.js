/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
                'primary-dark': 'rgb(var(--primary-dark-rgb) / <alpha-value>)',
                border: '#e5e7eb',
            },
        },
    },
    plugins: [],
};
