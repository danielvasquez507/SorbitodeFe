import { clsx } from 'clsx'; import { twMerge } from 'tailwind-merge'; export function cn(...inputs) { return twMerge(clsx(inputs)); }

export function formatearFechaVisual(fecha) {
    if (!fecha) return 'Sin fecha';
    if (fecha.includes('-')) {
        // Formato "2026-08-12 16:42:14"
        const [datePart, timePart] = fecha.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart ? timePart.split(':') : ['00', '00'];
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${parseInt(day, 10)} ${meses[parseInt(month, 10) - 1]} ${year}, ${hour}:${minute}`;
    }
    return fecha; // Para DD/MM/YYYY
}

export function formatMoney(amount) {
    if (amount == null) return '0.00';
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
