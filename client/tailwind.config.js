/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#2563eb',
        'primary-light': '#60a5fa',
        'primary-dark': '#1e40af',
        'primary-lighter': '#dbeafe',
        'accent': '#f59e0b',
        'accent-light': '#fbbf24',
        'success': '#10b981',
        'success-light': '#d1fae5',
        'warning': '#f59e0b',
        'warning-light': '#fef3c7',
        'info': '#3b82f6',
        'error': '#ef4444',
        'error-light': '#fee2e2',
        'dark-bg': '#f3f4f6',
        'card-bg': '#ffffff',
        'hover-bg': '#f9fafb',
        'sidebar-bg': '#f0f9ff',
        'text-primary': '#111827',
        'text-secondary': '#6b7280',
        'text-muted': '#9ca3af',
        'border-color': '#e5e7eb',
        'border-dark': '#d1d5db',
        'border-light': '#f3f4f6',
        'orange': '#f59e0b',
        // Legacy colors for backward compatibility
        'dark-green': '#2563eb',
        'light-green': '#60a5fa',
        'accent-green': '#10b981',
      }
    },
  },
  plugins: [],
}
