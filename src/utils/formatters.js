/**
 * Formats a number or numeric string as a currency string with thousands separators.
 * Example: 1000000 -> "1.000.000"
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const raw = value.toString().replace(/\D/g, '');
    if (!raw) return '';
    return Number(raw).toLocaleString('es-AR');
};

/**
 * Parses a formatted currency string back into a number.
 * Example: "1.000.000" -> 1000000
 */
export const parseCurrency = (str) => {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    return Number(str.toString().replace(/\./g, ''));
};

/**
 * Normalizes a string by removing accents and converting to lowercase.
 */
export const normalize = (str) => {
    if (!str) return '';
    return str.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};
