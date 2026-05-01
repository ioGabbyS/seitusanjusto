import { createClient } from '@supabase/supabase-js';

// ESTO ES EXCLUSIVO DE SAN JUSTO
const supabaseUrl = 'https://adkdesaeysijbgmiyywj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2Rlc2FleXNpamJnbWl5eXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MjEwOTcsImV4cCI6MjA5MzA5NzA5N30.eVN9Ooae5NFnJ0zs-D0Ln42wFidKQjz-V1Mh93nGRh8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const safeStorageSet = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`[SafeStorage] Quota exceeded for ${key}`, e);
    }
};
