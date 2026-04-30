import { createClient } from '@supabase/supabase-js';

// ESTO ES EXCLUSIVO DE SAN JUSTO
const supabaseUrl = 'https://adkdesaeysijbgmiyywj.supabase.co';
const supabaseAnonKey = 'sb_publishable_9Kz2Mbfq4NCrFgr0zXw3zA_ALo1Iuvn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const safeStorageSet = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`[SafeStorage] Quota exceeded for ${key}`, e);
    }
};
