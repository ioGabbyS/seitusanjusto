import { createClient } from '@supabase/supabase-js';

// CREDENCIALES UNIFICADAS (Detección por dominio)
const isSanJusto = typeof window !== 'undefined' && (window.location.hostname.includes('sanjusto') || window.location.hostname.includes('seitu-fiel') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// URL y KEY de San Justo (Detectadas como funcionales)
const sanJustoUrl = import.meta.env.VITE_SUPABASE_URL || 'https://adkdesaeysijbgmiyywj.supabase.co';
const sanJustoKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2Rlc2FleXNpamJnbWl5eXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjEwOTcsImV4cCI6MjA5MzA5NzA5N30.eVN9Ooae5NFnJ0zs-D0Ln42wFidKQjz-V1Mh93nGRh8';

// URL y KEY de Castillo (Fallback)
const castilloUrl = 'https://qoxmjecahsauiccpmksa.supabase.co';
const castilloKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDA0MzYsImV4cCI6MjA4NTQ3NjQzNn0.m23PxCfqu6WUVjRiOpzmQziCml19Gm6nMo1msI5aAYs';

const supabaseUrl = isSanJusto ? sanJustoUrl : castilloUrl;
const supabaseAnonKey = isSanJusto ? sanJustoKey : castilloKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const safeStorageSet = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`[SafeStorage] Quota exceeded for ${key}`, e);
    }
};
