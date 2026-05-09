import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CATEGORIES, PACK_UNITS, INITIAL_PRODUCTS } from '../data/products';
import { LEGACY_PRODUCTS } from '../data/legacyProducts';
import { ICE_CREAM_PRODUCTS } from '../data/iceCreamProducts';
import { supabase, safeStorageSet } from '../utils/supabaseClient';
import { tenant } from '../config/tenant';

const STORAGE_KEYS = {
    PURCHASES: 'seitu_purchases',
    SALES: 'seitu_sales',
    SETTINGS: 'seitu_settings', // For stock alerts threshold etc
    CUSTOMERS: 'seitu_customers',
    REWARDS: 'seitu_rewards'
};

const StoreContext = createContext(null);

function useStoreSource() {
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [settings, setSettings] = useState({});

    // v5.8.0: Force Reset to clean 1103/1104 and Categories
    const CATALOG_VERSION = '5.8.2';

    // v16.82: Robust normalization function moved to top level hook scope
    // v5.3.2: RESTORATION MODE - ONLY FIXING REQUESTED ITEMS
    const nrm = (s) => {
        if (!s) return "";
        let str = s.toString().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/seibon/g, "seibom")
            .replace(/sei bom/g, "seibom")
            .replace(/bombom/g, "bombon")
            .replace(/nevado/g, "blanco")
            .replace(/clasico/g, "negro");

        // --- SPECIFIC FIXES (REQUESTED BY USER) ---
        if (str.includes("cormillot") && str.includes("vainilla")) return "frutillavainilla";
        if (str.includes("crocante")) return "palitocrocante";
        if (str.includes("almendrado") && str.includes("unid")) return "almendradounidad";
        if (str.includes("cookies") && str.includes("16")) return "seibomcookies";
        if (str.includes("blanco") && str.includes("16")) return "seibomblanco";

        // Identity-Safe Noise Removal (Piccole, Frisky, Giovi are now PROTECTED)
        str = str.replace(/\b(seitu|sei|helado|unidad|unid|unidades|u|un|pack|caja|extra|de|la|el|x|funcional)\b/g, " ");

        return str.replace(/[^a-z0-9]/g, "").trim();
    };

    const [catalog, setCatalog] = useState([]); // List of { id, name, category, cc, packUnits, ... }
    const [categories, setCategories] = useState([]); // Dynamic list of categories
    const [sessions, setSessions] = useState([]); // List of { id, cashier, startedAt, initialCash, endedAt, finalCash, ... }
    const [cashCuts, setCashCuts] = useState([]); // Legacy support, or merged into sessions
    const [expenses, setExpenses] = useState([]); // Daily expenses
    const [stockLogs, setStockLogs] = useState([]); // Audit logs
    const [debts, setDebts] = useState([]); // Provider debts
    const [employees, setEmployees] = useState([]); // Employee salaries & advances
    const [recurringExpenses, setRecurringExpenses] = useState([]); // Fixed costs
    const [auditLog, setAuditLog] = useState([]); // System audit logs
    const [envelopes, setEnvelopes] = useState([]); // Cash envelopes { id, name, balance, history, status }
    const [customers, setCustomers] = useState([]); // List of { id, name, dni, phone, email, points, history }
    const [rewards, setRewards] = useState([]); // List of { id, name, category, pointCost, stock }
    const [iceCreamStock, setIceCreamStock] = useState({}); // { flavorName: { front1: 0, front2: 0, reserve: 0 } }
    const [iceCreamLogs, setIceCreamLogs] = useState(() => JSON.parse(localStorage.getItem('seitu_ice_cream_logs') || '[]')); // Historial de cambios de helados
    const [staffUsers, setStaffUsers] = useState(() => JSON.parse(localStorage.getItem('seitu_staff_users') || '[]'));
    const [socialLinks, setSocialLinks] = useState(() => JSON.parse(localStorage.getItem('seitu_social_links') || JSON.stringify({ "instagram": tenant.instagramUrl, "tiktok": tenant.tiktokUrl, "facebook": tenant.facebookUrl, "whatsapp": tenant.social.whatsapp })));
    const [landingPosts, setLandingPosts] = useState(() => {
        const saved = localStorage.getItem('seitu_landing_posts');
        if (saved) return JSON.parse(saved);
        return [
            { id: 1, img: '/helados_banner.jpg', label: 'Sabores Premium', url: tenant.instagramUrl },
            { id: 2, img: '/cremas_1.jpg', label: 'Nuestras Cremas', url: tenant.instagramUrl },
            { id: 3, img: '/chocolates.jpg', label: 'Chocolates Intensos', url: tenant.instagramUrl },
            { id: 4, img: '/dulces_de_leche.jpg', label: 'Dulce de Leche Real', url: tenant.instagramUrl }
        ];
    });
    const [eventPostsPaloma, setEventPostsPaloma] = useState(() => {
        const saved = localStorage.getItem('seitu_event_paloma');
        return JSON.parse(saved || '[]');
    });
    const [eventPostsMartina, setEventPostsMartina] = useState(() => {
        const saved = localStorage.getItem('seitu_event_martina');
        return JSON.parse(saved || '[]');
    });
    const [autoApprovePaloma, setAutoApprovePaloma] = useState(() => {
        return localStorage.getItem('seitu_event_auto_approve') === 'true';
    });
    const [autoApproveMartina, setAutoApproveMartina] = useState(() => {
        return localStorage.getItem('seitu_event_auto_approve_martina') === 'true';
    });

    const [promoBanner, setPromoBanner] = useState(() => {
        const saved = localStorage.getItem('seitu_promo_banner');
        return JSON.parse(saved || JSON.stringify({ active: false, img: '', url: '' }));
    });

    // THEME FIX v3: Use new key so we ignore old corrupt data
    const [theme, setTheme] = useState(() => {
        try {
            const val = localStorage.getItem('seitu_theme_v3');
            if (!val) return 'light';
            // Only parse if it looks like JSON
            if (val.startsWith('{') || val.startsWith('[')) return JSON.parse(val);
            return val;
        } catch (e) {
            return 'light';
        }
    });

    // Theme Toggle Function (Ensure it exists)
    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('seitu_theme_v3', newTheme);
            return newTheme;
        });
    };

    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState(null);

    const formatSessionForCloud = (session) => ({
        id: session.id,
        cashier: session.cashier,
        started_at: session.startedAt,
        ended_at: session.endedAt,
        initial_cash: session.initialCash,
        final_cash: session.finalCash,
        sales_count: session.salesCount,
        declared_total: session.declaredTotal,
        difference: session.difference,
        expected_cash: session.expectedCash,
        last_order_number: session.lastOrderNumber,
        notes: session.notes,
        stats: session.stats || {},
        cash_breakdown: session.cashBreakdown || {}
    });

    const formatExpenseForCloud = (expense) => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        type: expense.type,
        timestamp: expense.timestamp,
        saved_to_envelope: expense.savedToEnvelope,
        envelope_name: expense.envelopeName,
        user_name: expense.user || activeSession?.cashier,
        session_id: expense.sessionId || activeSession?.id // Link to session
    });

    const formatDebtForCloud = (debt) => ({
        id: debt.id,
        created_at: debt.date || new Date().toISOString(),
        provider: debt.provider,
        details: debt.details,
        amount: debt.total || debt.amount, // handle both if exist, usually 'total' in addDebt
        date: debt.date,
        status: debt.status || 'pending',
        payments: debt.payments || []
    });

    const formatStockLogForCloud = (log) => ({
        id: log.id,
        created_at: log.timestamp || new Date().toISOString(),
        product_name: log.product,
        product_id: log.productId,
        category: log.category,
        quantity: Number(log.change || log.difference || 0),
        reason: log.reason,
        user_name: log.user || activeSession?.cashier || localStorage.getItem('seitu_user') || 'Admin',
        timestamp: log.timestamp,
        previous_stock: Number(log.oldStock || 0),
        new_stock: Number(log.newStock || 0),
        bultos: Number(log.bultos || 0),
        units: Number(log.units || 0),
        pack_units: Number(log.packUnits || 1),
        is_additive: !!log.isAdditive
    });

    const formatAuditLogForCloud = (log) => ({
        id: log.id,
        created_at: log.timestamp || new Date().toISOString(),
        action: log.action,
        details: log.details,
        user_name: log.user || activeSession?.cashier || localStorage.getItem('seitu_user') || 'Admin',
        timestamp: log.timestamp
    });

    const formatEnvelopeForCloud = (env) => ({
        id: env.id,
        created_at: new Date().toISOString(), // envelopes don't always have a creation date
        name: env.name,
        balance: Number(env.balance),
        status: env.status,
        history: env.history || []
    });

    const formatPurchaseForCloud = (p) => ({
        id: p.id,
        created_at: p.timestamp || new Date().toISOString(),
        date: p.date,
        invoice_number: p.invoiceNumber,
        items: p.items,
        subtotal: p.subtotal,
        iva_amount: p.ivaAmount,
        perceptions: p.perceptions,
        total: p.total,
        is_historical: p.isHistorical,
        timestamp: p.timestamp
    });

    const formatSaleForCloud = (s) => ({
        id: s.id,
        timestamp: s.timestamp,
        order_number: Number(s.orderNumber || 0),
        items: s.items,
        total_amount: Number(s.totalAmount || s.total || 0),
        payment_method: s.paymentMethod,
        customer_id: s.customerId,
        session_id: s.sessionId || activeSession?.id, // CRITICAL: Link sale to session
        points_redeemed: Number(s.pointsRedeemed || 0),
        cash_received: Number(s.cashReceived || 0),
        card_received: Number(s.cardReceived || 0),
        transfer_received: Number(s.transferReceived || 0),
        verified: !!s.verified,
        is_fiscal: !!s.isFiscal,
        fiscal_data: s.fiscalData || null,
        employee_id: s.employeeId || null
    });

    const formatCustomerForCloud = (c) => ({
        id: c.id,
        name: c.name,
        dni: c.dni,
        phone: c.phone,
        email: c.email,
        points: Number(c.points || 0),
        history: c.history || [],
        created_at: c.createdAt || c.created_at || new Date().toISOString()
    });

    // --- DATA LOADING & SYNC ---
    const loadData = useCallback(async () => {
        // 1. Instant Load from LocalStorage
        try {
            console.log("🚀 Iniciando carga instantánea (LocalStorage)...");

            // Version Check: If mismatch, clear catalog cache to purge ghost duplicates
            const savedVersion = localStorage.getItem('seitu_catalog_version');
            if (savedVersion !== CATALOG_VERSION) {
                console.log("ℹ️ Nueva versión detectada, limpiando caché antigua...");
                localStorage.setItem('seitu_catalog_version', CATALOG_VERSION);
                localStorage.removeItem('seitu_catalog');
                localStorage.removeItem('seitu_categories');
                // Al borrar estos, el código siguiente cargará INITIAL_PRODUCTS y CATEGORIES por defecto
            }

            const loadedPurchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.PURCHASES) || '[]');
            const loadedSales = JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
            const loadedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
            const loadedCatalog = JSON.parse(localStorage.getItem('seitu_catalog') || '[]');
            const loadedSessions = JSON.parse(localStorage.getItem('seitu_sessions') || '[]');
            const loadedExpenses = JSON.parse(localStorage.getItem('seitu_expenses') || '[]');
            const loadedDebts = JSON.parse(localStorage.getItem('seitu_debts') || '[]');
            const loadedEmployees = JSON.parse(localStorage.getItem('seitu_employees') || '[]');
            const loadedAuditLog = JSON.parse(localStorage.getItem('seitu_audit_log') || '[]');
            const loadedEnvelopes = JSON.parse(localStorage.getItem('seitu_envelopes') || '[]');
            const loadedCustomers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');

            // -------------------------------------------
            // Version Check: Handled at start of function
            // -------------------------------------------

            // Categories
            const storedCategories = localStorage.getItem('seitu_categories');
            let finalCategories = CATEGORIES;
            if (storedCategories) {
                try {
                    finalCategories = JSON.parse(storedCategories);
                } catch (e) {
                    console.error("Error parsing stored categories:", e);
                    finalCategories = CATEGORIES;
                }
            }
            setCategories(finalCategories);
            localStorage.setItem('seitu_categories', JSON.stringify(finalCategories));

            // Catalog
            const storedCatalog = localStorage.getItem('seitu_catalog');
            let finalCatalog = INITIAL_PRODUCTS;
            if (storedCatalog) {
                try {
                    const parsed = JSON.parse(storedCatalog);
                    if (parsed && parsed.length > 0) {
                        finalCatalog = parsed;
                    }
                } catch (e) {
                    console.error("Error parsing stored catalog:", e);
                    finalCatalog = INITIAL_PRODUCTS;
                }
            }
            setCatalog(finalCatalog);
            localStorage.setItem('seitu_catalog', JSON.stringify(finalCatalog));

            console.log(`📦 Catálogo cargado: ${finalCatalog.length} productos, ${finalCategories.length} categorías`);

            // -------------------------------------------
            const loadedRewards = JSON.parse(localStorage.getItem(STORAGE_KEYS.REWARDS) || '[]');
            const loadedIceCreamStock = JSON.parse(localStorage.getItem('seitu_ice_cream_stock') || '{}');
            const loadedIceCreamLogs = JSON.parse(localStorage.getItem('seitu_ice_cream_logs') || '[]');
            const loadedStockLogs = JSON.parse(localStorage.getItem('seitu_stock_logs') || '[]'); // FIX: Load Stock Logs!
            const loadedStaffUsers = JSON.parse(localStorage.getItem('seitu_staff_users') || '[]');

            setPurchases(loadedPurchases);
            setSales(loadedSales);
            setSettings(loadedSettings);
            setExpenses(loadedExpenses);
            setSessions(loadedSessions);
            setDebts(loadedDebts);
            setEmployees(loadedEmployees);
            setAuditLog(loadedAuditLog);
            setEnvelopes(loadedEnvelopes);
            setCustomers(loadedCustomers);
            setRewards(loadedRewards);
            setIceCreamStock(loadedIceCreamStock);
            setIceCreamLogs(loadedIceCreamLogs);
            setStockLogs(loadedStockLogs);
            setStaffUsers(loadedStaffUsers);

            const loadedSocialLinks = JSON.parse(localStorage.getItem('seitu_social_links') || JSON.stringify({ "instagram": tenant.instagramUrl, "tiktok": tenant.tiktokUrl, "facebook": tenant.facebookUrl, "whatsapp": tenant.social.whatsapp }));
            const loadedLandingPosts = JSON.parse(localStorage.getItem('seitu_landing_posts') || '[]');
            const loadedEventPaloma = JSON.parse(localStorage.getItem('seitu_event_paloma') || localStorage.getItem('seitu_event_martina') || '[]');

            setSocialLinks(loadedSocialLinks);
            if (loadedLandingPosts.length > 0) setLandingPosts(loadedLandingPosts);
            setEventPostsPaloma(loadedEventPaloma);


            console.log("✅ Datos locales cargados. Apps desbloqueada.");
        } catch (e) {
            console.error("Local Load Error:", e);
        } finally {
            setLoading(false); // Unlock UI immediately
        }

        // 2. Background Sync from Cloud
        syncFromCloud();

        // 3. Periodic Auto-Sync every 15 minutes (optimized for free tier)
        const interval = setInterval(() => {
            syncFromCloud();
        }, 900000);

        return () => clearInterval(interval);
    }, []);

    const updateIceCreamStock = (flavor, updates, userRole = 'admin', userName = 'Admin') => {
        setIceCreamStock(prev => {
            const currentFlavorStock = prev[flavor] || { front1: 0, front2: 0, reserve: 0, necessary: 0 };
            const newState = {
                ...prev,
                [flavor]: {
                    ...currentFlavorStock,
                    ...updates
                }
            };
            safeStorageSet('seitu_ice_cream_stock', JSON.stringify(newState));

            // Registro de Auditoría
            const logEntries = Object.entries(updates).map(([field, newValue]) => {
                const oldValue = currentFlavorStock[field];
                if (oldValue === newValue) return null;
                return {
                    id: Date.now() + Math.random(),
                    timestamp: new Date().toISOString(),
                    flavor,
                    field,
                    oldValue,
                    newValue,
                    userRole, // Local log update
                    userName // Store who did it
                };
            }).filter(Boolean);

            if (logEntries.length > 0) {
                setIceCreamLogs(prevLogs => {
                    const newLogs = [...logEntries, ...prevLogs].slice(0, 100);
                    localStorage.setItem('seitu_ice_cream_logs', JSON.stringify(newLogs));
                    return newLogs;
                });
            }

            if (supabase) {
                // Sincronizar Stock
                supabase.from('ice_cream_stock').upsert({
                    id: flavor,
                    front1: newState[flavor].front1,
                    front2: newState[flavor].front2,
                    reserve: newState[flavor].reserve,
                    necessary: newState[flavor].necessary,
                    updated_at: new Date().toISOString()
                }).then(({ error }) => {
                    if (error) console.error('Error ice cream sync:', error);
                });

                // Sincronizar Logs
                if (logEntries.length > 0) {
                    const cloudLogs = logEntries.map(l => ({
                        flavor: l.flavor,
                        field: l.field,
                        old_value: l.oldValue,
                        new_value: l.newValue,
                        timestamp: l.timestamp,
                        user_role: l.userRole, // Sync user role to DB
                        user_name: l.userName // Sync name to cloud
                    }));
                    supabase.from('ice_cream_logs').insert(cloudLogs).then(({ error }) => {
                        if (error) console.error('Error logs sync:', error);
                    });
                }
            }
            return newState;
        });
    };

    const bulkUpdateIceCreamStock = (updatesArray, userRole = 'admin', userName = 'Admin') => {
        setIceCreamStock(prev => {
            const newState = { ...prev };
            let allLogEntries = [];

            updatesArray.forEach(({ flavor, updates }) => {
                const currentFlavorStock = newState[flavor] || { front1: 0, front2: 0, reserve: 0, necessary: 0 };
                newState[flavor] = {
                    ...currentFlavorStock,
                    ...updates
                };

                const logEntries = Object.entries(updates).map(([field, newValue]) => {
                    const oldValue = currentFlavorStock[field];
                    if (oldValue === newValue) return null;
                    return {
                        id: Date.now() + Math.random(),
                        timestamp: new Date().toISOString(),
                        flavor,
                        field,
                        oldValue,
                        newValue,
                        userRole,
                        userName
                    };
                }).filter(Boolean);
                allLogEntries = [...allLogEntries, ...logEntries];
            });

            safeStorageSet('seitu_ice_cream_stock', JSON.stringify(newState));

            if (allLogEntries.length > 0) {
                setIceCreamLogs(prevLogs => {
                    const newLogs = [...allLogEntries, ...prevLogs].slice(0, 100);
                    localStorage.setItem('seitu_ice_cream_logs', JSON.stringify(newLogs));
                    return newLogs;
                });
            }

            if (supabase) {
                const upsertData = updatesArray.map(({ flavor }) => ({
                    id: flavor,
                    front1: newState[flavor].front1,
                    front2: newState[flavor].front2,
                    reserve: newState[flavor].reserve,
                    necessary: newState[flavor].necessary,
                    updated_at: new Date().toISOString()
                }));

                supabase.from('ice_cream_stock').upsert(upsertData).then(({ error }) => {
                    if (error) console.error('Error bulk stock sync:', error);
                });

                if (allLogEntries.length > 0) {
                    const cloudLogs = allLogEntries.map(l => ({
                        flavor: l.flavor,
                        field: l.field,
                        old_value: l.oldValue,
                        new_value: l.newValue,
                        timestamp: l.timestamp,
                        user_role: l.userRole,
                        user_name: l.userName
                    }));
                    supabase.from('ice_cream_logs').insert(cloudLogs).then(({ error }) => {
                        if (error) console.error('Error bulk logs sync:', error);
                    });
                }
            }
            return newState;
        });
    };

    const syncFromCloud = async () => {
        if (!supabase || isSyncing) return;
        setIsSyncing(true);
        console.log("⏳ Sincronizando con la nube en segundo plano...");

        // Load Global Settings first
        try {
            const { data, error } = await supabase.from('settings').select('*');
            if (!error && data) {
                const social = data.find(s => s.id === 'social_links');
                if (social) {
                    setSocialLinks(social.configuration);
                    localStorage.setItem('seitu_social_links', JSON.stringify(social.configuration));
                }
                const gallery = data.find(s => s.id === 'landing_posts');
                if (gallery) {
                    setLandingPosts(gallery.configuration.posts);
                    localStorage.setItem('seitu_landing_posts', JSON.stringify(gallery.configuration.posts));
                }
                const paloma = data.find(s => s.id === 'event_paloma15') || data.find(s => s.id === 'event_martina15');
                if (paloma) {
                    setEventPostsPaloma(paloma.configuration.posts || []);
                    localStorage.setItem('seitu_event_paloma', JSON.stringify(paloma.configuration.posts || []));
                    if (paloma.configuration.autoApprove !== undefined) {
                        setAutoApprovePaloma(paloma.configuration.autoApprove);
                        localStorage.setItem('seitu_event_auto_approve', paloma.configuration.autoApprove.toString());
                    }
                }
                const promo = data.find(s => s.id === 'promo_banner');
                if (promo) {
                    setPromoBanner(promo.configuration);
                    localStorage.setItem('seitu_promo_banner', JSON.stringify(promo.configuration));
                }
            }
        } catch (e) {
            console.error("Error fetching settings:", e);
        }

        try {
            // Helper to merge arrays of objects by ID, preferring cloud if local is empty or older?
            // For now: Cloud is master for Catalog/Customers, Local is master for others unless empty.
            const mergeCloud = (local, cloud, sortField = null) => {
                if (!local || !local.length) return cloud;
                if (!cloud || !cloud.length) return local;

                const map = new Map();
                local.forEach(item => map.set(item.id, item));

                cloud.forEach(item => {
                    const existing = map.get(item.id);
                    if (!existing) {
                        map.set(item.id, item);
                    } else {
                        // Conflict resolution for Sessions: Keep the "most advanced" one
                        if (item.hasOwnProperty('lastOrderNumber')) {
                            const localOrders = existing.lastOrderNumber || 0;
                            const cloudOrders = item.lastOrderNumber || 0;
                            // Keep whichever has more orders, or if cloud is closed and local is open, keep cloud
                            if (item.endedAt && !existing.endedAt) {
                                map.set(item.id, item);
                                // Keep local closed
                            } else if (Number(cloudOrders) >= Number(localOrders)) {
                                map.set(item.id, { ...existing, ...item });
                            } else {
                                // Important: Keep larger sales count even if cloud says less (conflict resolution)
                                map.set(item.id, { ...item, ...existing });
                            }
                        } else {
                            // Conflict resolution for Sales/Expenses: PRESERVE local sessionId/orderNumber if cloud lacks them
                            const mergeResult = { ...existing, ...item };
                            // v3.7: Aggressive preservation of local session metadata
                            if (existing.sessionId && (!item.sessionId || item.sessionId === 'null')) {
                                mergeResult.sessionId = existing.sessionId;
                            }
                            if (existing.orderNumber && !item.orderNumber) {
                                mergeResult.orderNumber = existing.orderNumber;
                            }
                            // Priority to non-zero amounts
                            if (Number(item.totalAmount || 0) === 0 && (Number(existing.totalAmount || 0) > 0)) {
                                mergeResult.totalAmount = existing.totalAmount;
                            }

                            // v5.8.2: Preserve EARLIEST createdAt to fix "all created today" issue
                            if (existing.createdAt && item.createdAt) {
                                const dateLocal = new Date(existing.createdAt).getTime();
                                const dateCloud = new Date(item.createdAt).getTime();
                                if (dateLocal > 0 && dateCloud > 0) {
                                    mergeResult.createdAt = dateLocal < dateCloud ? existing.createdAt : item.createdAt;
                                }
                            }

                            map.set(item.id, mergeResult);
                        }
                    }
                });

                const combined = Array.from(map.values());
                if (sortField) {
                    return combined.sort((a, b) => {
                        const valA = a[sortField] ? new Date(a[sortField]).getTime() : 0;
                        const valB = b[sortField] ? new Date(b[sortField]).getTime() : 0;
                        return valB - valA;
                    });
                }
                return combined;
            };

            // SYNC CATALOG
            try {
                const { data: cloudCatalog } = await supabase.from('catalog').select('*').limit(10000);
                if (cloudCatalog) {
                    const mapped = cloudCatalog.map(item => ({
                        id: item.id,
                        name: item.name,
                        category: item.category,
                        price: Number(item.price || 0),
                        quantity: Number(item.quantity) || 0,
                        barcode: item.barcode || '',
                        image: item.image || '',
                        minStock: Number(item.min_stock) || 5,
                        cc: Number(item.cc) || 0,
                        packUnits: Number(item.pack_units) || 1,
                        pointsEarnedRatio: Number(item.points_earned_ratio || 0),
                        pointCost: Number(item.point_cost || 0),
                        bonusPoints: Number(item.bonus_points || 0),
                        stockResetAt: item.stock_reset_at || null
                    }));

                    if (mapped.length > 0) {
                        try {
                            const resetMapStr = localStorage.getItem('seitu_stock_reset_map');
                            if (resetMapStr) {
                                const resetMap = JSON.parse(resetMapStr);
                                mapped.forEach(p => {
                                    if (resetMap[p.id]) p.stockResetAt = resetMap[p.id];
                                });
                            }
                        } catch (e) { /* ignore parse errors */ }

                        // v5.9: Smart Merge Logic - Prevent deletion of newly added products on local device
                        setCatalog(prev => {
                            const cloudMap = new Map(mapped.map(p => [p.id, p]));
                            const merged = [...mapped];

                            // Add local items that haven't reached cloud yet (Protect new additions)
                            prev.forEach(p => {
                                if (!cloudMap.has(p.id)) {
                                    merged.push(p);
                                    console.log("🛡️ Protegiendo producto local no sincronizado:", p.name);
                                }
                            });

                            safeStorageSet('seitu_catalog', JSON.stringify(merged));
                            return merged;
                        });

                        // Auto-rebuild categories from the products
                        const derivedCats = [...new Set(mapped.map(p => p.category).filter(Boolean))].sort();
                        setCategories(derivedCats);
                        safeStorageSet('seitu_categories', JSON.stringify(derivedCats));
                        console.log("✅ Catálogo sincronizado (Smart Merge activo).");
                    }
                }
            } catch (e) {
                console.error("Sync Error (Catalog):", e);
            }

            // SYNC CUSTOMERS (v5.8.1: Multi-device sync enabled)
            try {
                const { data: cloudCustomers } = await supabase.from('customers').select('*').limit(10000);
                if (cloudCustomers) {
                    const mapped = cloudCustomers.map(c => ({
                        id: c.id?.toString(),
                        name: c.name || (c.firstname ? `${c.firstname} ${c.lastname || ''}`.trim() : 'Sin Nombre'),
                        dni: c.dni || c.document_number || '',
                        phone: c.phone || '',
                        email: c.email || '',
                        points: Number(c.points || c.current_points) || 0,
                        history: c.history || [],
                        createdAt: c.created_at || c.createdAt || new Date().toISOString()
                    }));

                    setCustomers(prev => {
                        const merged = mergeCloud(prev, mapped);
                        safeStorageSet(STORAGE_KEYS.CUSTOMERS, JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (e) {
                console.error("Sync Error (Customers):", e);
            }

            // SYNC SESSIONS
            try {
                const { data: cloudSessions } = await supabase.from('sessions').select('*').order('started_at', { ascending: false }).limit(500);
                if (cloudSessions) {
                    const mappedSessions = cloudSessions.map(s => ({
                        id: s.id,
                        cashier: s.cashier,
                        startedAt: s.started_at,
                        endedAt: s.ended_at,
                        initialCash: s.initial_cash,
                        finalCash: s.final_cash,
                        salesCount: s.sales_count,
                        declaredTotal: s.declared_total,
                        difference: s.difference,
                        expectedCash: s.expected_cash,
                        lastOrderNumber: s.last_order_number,
                        notes: s.notes,
                        stats: s.stats,
                        cashBreakdown: s.cash_breakdown
                    }));
                    setSessions(prev => {
                        const merged = mergeCloud(prev, mappedSessions, 'startedAt');
                        safeStorageSet('seitu_sessions', JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (e) {
                console.error("Sync Error (Sessions):", e);
            }

            // SYNC SALES
            try {
                const { data: cloudSales } = await supabase.from('sales').select('*').order('timestamp', { ascending: false }).limit(2000);
                if (cloudSales) {
                    const mapped = cloudSales.map(s => ({
                        id: s.id,
                        timestamp: s.timestamp,
                        orderNumber: s.order_number,
                        items: s.items,
                        totalAmount: Number(s.total_amount || s.total || 0), // LEGACY FALLBACK
                        paymentMethod: s.payment_method,
                        customerId: s.customer_id,
                        sessionId: s.session_id,
                        pointsRedeemed: Number(s.points_redeemed) || 0,
                        cashReceived: Number(s.cash_received) || 0,
                        cardReceived: Number(s.card_received) || 0,
                        transferReceived: Number(s.transfer_received) || 0,
                        verified: !!s.verified,
                        isFiscal: !!s.is_fiscal,
                        fiscalData: s.fiscal_data,
                        employeeId: s.employee_id
                    }));
                    setSales(prev => {
                        const merged = mergeCloud(prev, mapped, 'timestamp');
                        safeStorageSet(STORAGE_KEYS.SALES, JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (e) {
                console.error("Sync Error (Sales):", e);
            }

            // SYNC PURCHASES
            try {
                const { data: cloudPurchases } = await supabase.from('purchases').select('*').order('timestamp', { ascending: false }).limit(500);
                if (cloudPurchases) {
                    const mapped = cloudPurchases.map(p => ({
                        id: p.id,
                        timestamp: p.timestamp,
                        date: p.date,
                        invoiceNumber: p.invoice_number,
                        items: p.items,
                        subtotal: Number(p.subtotal || 0),
                        ivaAmount: Number(p.iva_amount || 0),
                        perceptions: Number(p.perceptions || 0),
                        total: Number(p.total || 0),
                        isHistorical: !!p.is_historical
                    }));
                    setPurchases(prev => {
                        const merged = mergeCloud(prev, mapped, 'timestamp');
                        safeStorageSet(STORAGE_KEYS.PURCHASES, JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (e) {
                console.error("Sync Error (Purchases):", e);
            }

            // SYNC EXPENSES
            try {
                const { data: cloudExpenses } = await supabase.from('expenses').select('*').order('timestamp', { ascending: false }).limit(200);
                if (cloudExpenses) {
                    const mapped = cloudExpenses.map(ex => ({
                        id: ex.id,
                        description: ex.description,
                        amount: Number(ex.amount),
                        type: ex.type,
                        timestamp: ex.timestamp,
                        savedToEnvelope: ex.saved_to_envelope,
                        envelopeName: ex.envelope_name,
                        user: ex.user_name,
                        sessionId: ex.session_id // Map from cloud
                    }));
                    setExpenses(prev => {
                        const merged = mergeCloud(prev, mapped, 'timestamp');
                        safeStorageSet('seitu_expenses', JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (e) {
                console.error("Sync Error (Expenses):", e);
            }

            // SYNC EMPLOYEES (Disabled: table missing in cloud)
            /*
            try {
                const { data: cloudEmployees } = await supabase.from('employees').select('*');
                if (cloudEmployees) {
                    const mapped = cloudEmployees.map(e => ({
                        id: e.id,
                        name: e.name,
                        active: e.active,
                        records: e.records || []
                    }));
                    setEmployees(mapped);
                    safeStorageSet('seitu_employees', JSON.stringify(mapped));
                }
            } catch (e) {}
            */

            // SYNC DEBTS
            try {
                const { data: cloudDebts } = await supabase.from('debts').select('*');
                if (cloudDebts) {
                    const mapped = cloudDebts.map(d => ({
                        id: d.id,
                        provider: d.provider,
                        details: d.details,
                        total: d.amount,
                        date: d.date,
                        status: d.status,
                        payments: d.payments || []
                    }));
                    setDebts(prev => {
                        const merged = mergeCloud(prev, mapped);
                        safeStorageSet('seitu_debts', JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (e) {
                console.warn("Sync Error (Debts):", e.message);
            }

            // SYNC ENVELOPES
            try {
                const { data: cloudEnvelopes } = await supabase.from('envelopes').select('*');
                if (cloudEnvelopes) {
                    const mapped = cloudEnvelopes.map(env => ({
                        id: env.id,
                        name: env.name,
                        balance: Number(env.balance),
                        status: env.status,
                        history: env.history || []
                    }));
                    setEnvelopes(prev => {
                        const merged = mergeCloud(prev, mapped);
                        safeStorageSet('seitu_envelopes', JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (e) {
                console.warn("Sync Error (Envelopes):", e.message);
            }


            // SYNC ICE CREAM STOCK
            try {
                const { data: cloudIceCream } = await supabase.from('ice_cream_stock').select('*');
                if (cloudIceCream && cloudIceCream.length > 0) {
                    const mapped = {};
                    cloudIceCream.forEach(item => {
                        mapped[item.id] = {
                            front1: Number(item.front1) || 0,
                            front2: Number(item.front2) || 0,
                            reserve: Number(item.reserve) || 0,
                            necessary: Number(item.necessary) || 0
                        };
                    });
                    setIceCreamStock(prev => {
                        const merged = { ...prev, ...mapped };
                        safeStorageSet('seitu_ice_cream_stock', JSON.stringify(merged));
                        return merged;
                    });
                    console.log("✅ Helados sincronizados (merged):", Object.keys(mapped).length);
                }
            } catch (e) {
                console.warn("Sync Error (Ice Cream):", e.message);
            }

            // SYNC ICE CREAM LOGS
            try {
                const { data: cloudIceCreamLogs } = await supabase.from('ice_cream_logs').select('*').order('timestamp', { ascending: false }).limit(100);
                if (cloudIceCreamLogs && cloudIceCreamLogs.length > 0) {
                    const mapped = cloudIceCreamLogs.map(log => ({
                        id: log.id,
                        timestamp: log.timestamp,
                        flavor: log.flavor,
                        field: log.field,
                        oldValue: log.old_value,
                        newValue: log.new_value,
                        userRole: log.user_role, // Map user_role from cloud
                        userName: log.user_name // Map user_name from cloud
                    }));
                    setIceCreamLogs(prev => {
                        // Merge logs by ID to avoid duplicates
                        const existingIds = new Set(prev.map(l => l.id));
                        const newEntries = mapped.filter(l => !existingIds.has(l.id));
                        const merged = [...newEntries, ...prev].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100);
                        safeStorageSet('seitu_ice_cream_logs', JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (e) {
                console.warn("Sync Error (Ice Cream Logs):", e.message);
            }

            // SYNC STAFF USERS
            try {
                const { data: cloudStaff } = await supabase.from('staff_users').select('*');
                if (cloudStaff) {
                    setStaffUsers(cloudStaff);
                    safeStorageSet('seitu_staff_users', JSON.stringify(cloudStaff));
                }
            } catch (e) {
                console.warn("Sync Error (Staff Users):", e.message);
            }

            // v16.88: NEW - SYNC STOCK LOGS (Required for Matriz/Auditoria across devices)
            try {
                const { data: cloudStockLogs } = await supabase.from('stock_logs').select('*').order('timestamp', { ascending: false }).limit(1000);
                if (cloudStockLogs) {
                    const mapped = cloudStockLogs.map(l => ({
                        id: l.id,
                        timestamp: l.timestamp,
                        product: l.product_name,
                        productId: l.product_id,
                        category: l.category,
                        oldStock: Number(l.previous_stock || 0),
                        newStock: Number(l.new_stock || 0),
                        difference: Number(l.quantity || 0),
                        reason: l.reason,
                        user: l.user_name || 'Desconocido',
                        bultos: Number(l.bultos || 0),
                        units: Number(l.units || 0),
                        packUnits: Number(l.pack_units || 1),
                        isAdditive: !!l.is_additive
                    }));
                    setStockLogs(prev => {
                        const merged = mergeCloud(prev, mapped, 'timestamp');
                        safeStorageSet('seitu_stock_logs', JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (e) {
                console.warn("Sync Error (Stock Logs):", e.message);
            }


            // SYNC REWARDS
            try {
                const { data: cloudRewards, error } = await supabase.from('rewards').select('*');

                if (cloudRewards) {
                    const mapped = cloudRewards.map(r => ({
                        id: r.id,
                        name: r.name,
                        category: r.category,
                        pointCost: Number(r.point_cost || r.pointCost || 0),
                        stock: Number(r.stock || 0),
                        image: r.image
                    }));

                    setRewards(prev => {
                        const merged = mergeCloud(prev, mapped);
                        safeStorageSet(STORAGE_KEYS.REWARDS, JSON.stringify(merged));
                        return merged;
                    });
                    console.log(`🎁 Premios sincronizados: ${mapped.length}`);
                }
            } catch (e) {
                console.warn("Sync Error (Rewards):", e.message);
            }

            console.log("✅ Sincronización completa.");
        } catch (error) {
            console.error("❌ Error en syncFromCloud:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        console.log("🚀 Seitu Store v1.0.10 - Initializing sync...");
        if (loading) {
            loadData();
        }
    }, [loadData]);


    // Theme logic
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('seitu_theme_v3', theme);
    }, [theme]);


    const addCategory = (name) => {
        if (!name) return;
        if (categories.includes(name)) return;
        const newCats = [...categories, name];
        setCategories(newCats);
        safeStorageSet('seitu_categories', JSON.stringify(newCats));
    };

    const removeCategory = (name) => {
        const newCats = categories.filter(c => c !== name);
        setCategories(newCats);
        safeStorageSet('seitu_categories', JSON.stringify(newCats));
    };




    const addToCatalog = (product) => {
        const newProduct = { ...product, id: Date.now().toString() };
        const newCatalog = [...catalog, newProduct];
        setCatalog(newCatalog);
        safeStorageSet('seitu_catalog', JSON.stringify(newCatalog));

        // Sincronizar con Supabase
        if (supabase) {
            supabase.from('catalog').upsert({
                id: newProduct.id,
                name: newProduct.name,
                category: newProduct.category,
                price: newProduct.price || 0,
                quantity: newProduct.quantity || 0,
                min_stock: newProduct.minStock || 5,
                cc: newProduct.cc || 0,
                pack_units: newProduct.packUnits || 1,
                barcode: newProduct.barcode || '',
                image: newProduct.image || '',
                bonus_points: newProduct.bonusPoints || 0,
                points_earned_ratio: newProduct.pointsEarnedRatio !== undefined ? newProduct.pointsEarnedRatio : 1,
                point_cost: newProduct.pointCost || 0
            }).then(({ error }) => {
                if (error) console.error('Error al sincronizar producto:', error);
                else console.log('✅ Producto sincronizado:', newProduct.name);
            });
        }
    };

    const updateCatalogItem = (id, updates) => {
        const newCatalog = catalog.map(p => p.id === id ? { ...p, ...updates } : p);
        setCatalog(newCatalog);
        safeStorageSet('seitu_catalog', JSON.stringify(newCatalog));

        // Sincronizar con Supabase
        if (supabase) {
            const updatedProduct = newCatalog.find(p => p.id === id);
            if (updatedProduct) {
                supabase.from('catalog').upsert({
                    id: updatedProduct.id,
                    name: updatedProduct.name,
                    category: updatedProduct.category,
                    price: updatedProduct.price || 0,
                    quantity: updatedProduct.quantity || 0,
                    min_stock: updatedProduct.minStock || 5,
                    cc: updatedProduct.cc || 0,
                    pack_units: updatedProduct.packUnits || 1,
                    barcode: updatedProduct.barcode || '',
                    image: updatedProduct.image || '',
                    bonus_points: updatedProduct.bonusPoints || 0,
                    points_earned_ratio: updatedProduct.pointsEarnedRatio !== undefined ? updatedProduct.pointsEarnedRatio : 1,
                    point_cost: updatedProduct.pointCost || 0
                }).then(({ error }) => {
                    if (error) {
                        console.error('Error al actualizar producto:', error);
                        alert(`ERROR AL GUARDAR PRODUCTO: ${error.message}`);
                    }
                    else console.log('✅ Producto actualizado:', updatedProduct.name);
                });
            }
        }
    };

    const removeFromCatalog = (id) => {
        const newCatalog = catalog.filter(p => p.id !== id);
        setCatalog(newCatalog);
        safeStorageSet('seitu_catalog', JSON.stringify(newCatalog));

        // Eliminar de Supabase
        if (supabase) {
            supabase.from('catalog').delete().eq('id', id).then(({ error }) => {
                if (error) console.error('Error al eliminar producto:', error);
                else console.log('✅ Producto eliminado de la nube');
            });
        }
    };



    const updateWholeCatalog = async (newCatalog) => {
        setCatalog(newCatalog);
        safeStorageSet('seitu_catalog', JSON.stringify(newCatalog));

        // --- SYNC TO CLOUD ---
        if (supabase) {
            console.log("📤 Sincronizando catálogo completo con la nube...");
            const cloudData = newCatalog.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                price: Number(p.price) || 0,
                quantity: Number(p.quantity) || 0,
                barcode: p.barcode || '',
                image: p.image || '',
                min_stock: Number(p.minStock) || 5,
                cc: Number(p.cc) || 0,
                pack_units: Number(p.packUnits) || 1,
                points_earned_ratio: p.pointsEarnedRatio !== undefined ? p.pointsEarnedRatio : 1
            }));

            // Split in chunks
            const chunkSize = 50;
            for (let i = 0; i < cloudData.length; i += chunkSize) {
                const chunk = cloudData.slice(i, i + chunkSize);
                const { error } = await supabase.from('catalog').upsert(chunk);
                if (error) console.error("Error syncing catalog chunk:", error);
            }
            console.log("✅ Catálogo sincronizado en la nube.");
        }
    };

    const clearAllImages = () => {
        const newCatalog = catalog.map(item => ({ ...item, image: '' }));
        setCatalog(newCatalog);
        safeStorageSet('seitu_catalog', JSON.stringify(newCatalog));
        addAuditEntry('MAINTENANCE', 'Se eliminaron todas las fotos del catálogo para liberar espacio.');
        return { success: true, count: catalog.filter(i => i.image).length };
    };



    const addPurchase = (invoice) => {
        const newPurchase = {
            ...invoice,
            id: Date.now().toString(),
            timestamp: new Date().toISOString()
        };
        const newPurchases = [newPurchase, ...purchases]; // Prepend (DESC)
        setPurchases(newPurchases);
        safeStorageSet(STORAGE_KEYS.PURCHASES, JSON.stringify(newPurchases));
        syncToCloud(formatPurchaseForCloud(newPurchase), 'purchases');
    };

    const addSale = (saleData) => {
        // Find active session to increment order number
        let orderNumber = 1; // Default if no session
        const activeIndex = sessions.findIndex(s => !s.endedAt);
        let updatedSessions = [...sessions];

        if (activeIndex !== -1) {
            const currentSession = updatedSessions[activeIndex];
            const nextOrder = (currentSession.lastOrderNumber || 0) + 1;
            const nextSalesCount = (currentSession.salesCount || 0) + 1;

            // Update session state
            const updatedSession = {
                ...currentSession,
                lastOrderNumber: nextOrder,
                salesCount: nextSalesCount
            };
            updatedSessions[activeIndex] = updatedSession;

            setSessions(updatedSessions);
            safeStorageSet('seitu_sessions', JSON.stringify(updatedSessions));

            // Sync session state to cloud immediately
            syncSession(updatedSession);

            orderNumber = nextOrder;
        }

        const newSale = {
            ...saleData,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            orderNumber: orderNumber,
            sessionId: activeSession?.id // Attach to active session
        };

        const newSales = [newSale, ...sales]; // Insertar al inicio (DESC)
        setSales(newSales);
        safeStorageSet(STORAGE_KEYS.SALES, JSON.stringify(newSales));
        syncToCloud(formatSaleForCloud(newSale), 'sales'); // Sincronizar inmediatamente

        const itemsDetail = newSale.items.map(i => `${i.name}${i.quantity > 1 ? ` (${i.quantity})` : ''}`).join(', ');

        // --- PERSONAL DEBT LOGIC ---
        if (newSale.paymentMethod === 'personal' && newSale.employeeId) {
            addEmployeeRecord(newSale.employeeId, {
                type: 'adelanto',
                amount: newSale.totalAmount,
                description: itemsDetail, // Detailed items
                fromRegister: false
            });
        }

        // Support for individual items assigned to employees (Selective Discounts/Expenses in POS)
        newSale.items.forEach(item => {
            if (item.employeeId && (item.price < 0 || item.isExpense)) {
                addEmployeeRecord(item.employeeId, {
                    type: 'adelanto',
                    amount: Math.abs(item.price * (item.quantity || 1)),
                    description: `Consumo/Desc: ${item.name}${item.obs ? ` (${item.obs})` : ''} - Venta #${newSale.orderNumber}`,
                    fromRegister: false
                });
            }
        });

        let pointsEarnedReport = 0;

        // --- POINTS LOGIC ---
        if (newSale.customerId) {
            // Deduct points if any rewards were taken
            const rewardPoints = newSale.items
                .filter(i => i.isReward)
                .reduce((sum, i) => sum + (i.pointCost * i.quantity), 0);

            // Calculate points PER ITEM based on Ratio
            const totalPointsEarned = newSale.items.reduce((sum, item) => {
                const product = catalog.find(c => c.name === item.name);

                // If item is a Redemption (price 0 and isRedemption flag), it earns 0 points
                if (item.isRedemption) return sum;

                // Default ratio 1 if not set
                const ratio = product?.pointsEarnedRatio !== undefined ? Number(product.pointsEarnedRatio) : 1;

                // EXCEPTION: Cafetería never earns points
                const cat = (product?.category || item.category || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (cat.includes('cafeteria')) return sum;

                // Points = (Price * Qty) / 100 * Ratio
                const itemTotal = (item.price * (item.quantity || 1));
                const itemPoints = Math.floor((itemTotal / 100) * ratio);

                // Add legacy bonus points if any (optional, but keeping for compatibility)
                const bonus = Number(product?.bonusPoints || 0) * (item.quantity || 1);

                return sum + itemPoints + bonus;
            }, 0);

            pointsEarnedReport = totalPointsEarned;

            // Use the same detail description
            addPointsToCustomer(newSale.customerId, totalPointsEarned, (newSale.pointsRedeemed || 0) + rewardPoints, newSale.id, itemsDetail);
        }

        return { ...newSale, pointsEarned: pointsEarnedReport }; // Return ensuring POS gets the enriched data
    };

    // --- CLOUD SYNC LOGIC (SUPABASE) ---
    const syncToCloud = async (data, type) => {
        if (!supabase) return;

        let formattedData = data;
        if (type === 'customers') {
            formattedData = formatCustomerForCloud(data);
        }

        try {
            const { error } = await supabase
                .from(type)
                .upsert(formattedData, { onConflict: 'id' });
            if (error) {
                console.error(`Sync error (${type}):`, error);
                setSyncError(`${type}: ${error.message}`);
            } else {
                setSyncError(null);
            }
        } catch (err) {
            console.error(`Sync exception (${type}):`, err);
            setSyncError(err.message);
        }
    };

    // --- CUSTOMER & LOYALTY MANAGEMENT ---
    const addCustomer = (customerData) => {
        const newCustomer = {
            id: Date.now().toString(),
            name: '',
            dni: '',
            phone: '',
            email: '',
            points: 0,
            history: [],
            ...customerData,
            createdAt: new Date().toISOString()
        };
        const newCustomers = [...customers, newCustomer];
        setCustomers(newCustomers);
        safeStorageSet(STORAGE_KEYS.CUSTOMERS, JSON.stringify(newCustomers));
        addAuditEntry('CUSTOMER_CREATED', `Cliente creado: ${newCustomer.name} (${newCustomer.dni || 'S/DNI'})`);
        syncToCloud(formatCustomerForCloud(newCustomer), 'customers');
        return newCustomer;
    };

    const updateCustomer = (id, updates) => {
        const updatedCustomer = customers.find(c => c.id === id);
        if (!updatedCustomer) return;

        const newCustomers = customers.map(c => c.id === id ? { ...c, ...updates } : c);
        setCustomers(newCustomers);
        safeStorageSet(STORAGE_KEYS.CUSTOMERS, JSON.stringify(newCustomers));
        syncToCloud(formatCustomerForCloud({ ...updatedCustomer, ...updates }), 'customers');
    };

    const deleteCustomer = (id) => {
        const cust = customers.find(c => c.id === id);
        const newCustomers = customers.filter(c => c.id !== id);
        setCustomers(newCustomers);
        safeStorageSet(STORAGE_KEYS.CUSTOMERS, JSON.stringify(newCustomers));
        addAuditEntry('CUSTOMER_DELETED', `Cliente eliminado: ${cust?.name || id}`);
    };

    const addPointsToCustomer = (customerId, pointsEarnedInput, pointsRedeemed, saleId, description = '') => {
        // pointsEarnedInput can be raw amount (legacy) or calculated points (new)

        const pointsEarned = Number(pointsEarnedInput);

        setCustomers(prev => {
            const updated = prev.map(c => {
                if (c.id === customerId) {
                    const newPoints = c.points + pointsEarned - pointsRedeemed;
                    const historyEntry = {
                        id: `${Date.now()}-${Math.random().toString().slice(2)}`,
                        date: new Date().toISOString(),
                        saleId,
                        pointsEarned,
                        pointsRedeemed,
                        description, // Saved description
                        amountSpent: 0,
                        balance: newPoints
                    };
                    const result = {
                        ...c,
                        points: newPoints,
                        history: [historyEntry, ...(c.history || [])]
                    };
                    syncToCloud(formatCustomerForCloud(result), 'customers');
                    return result;
                }
                return c;
            });
            safeStorageSet(STORAGE_KEYS.CUSTOMERS, JSON.stringify(updated));
            return updated;
        });
    };

    // --- REWARDS CATALOG MANAGEMENT ---
    const formatRewardForCloud = (reward) => ({
        id: reward.id,
        name: reward.name,
        category: reward.category,
        point_cost: reward.pointCost, // Map camelCase to snake_case
        stock: reward.stock,
        image: reward.image
    });

    const addReward = (rewardData) => {
        const newReward = {
            id: Date.now().toString(),
            name: '',
            category: 'Puntos',
            pointCost: 0,
            stock: 0,
            ...rewardData
        };
        const newRewards = [...rewards, newReward];
        setRewards(newRewards);
        safeStorageSet(STORAGE_KEYS.REWARDS, JSON.stringify(newRewards));

        // Sync with proper mapping
        if (supabase) {
            supabase.from('rewards').upsert(formatRewardForCloud(newReward)).then(({ error }) => {
                if (error) console.error("Error creating reward:", error);
            });
        }
        return newReward;
    };

    const updateReward = (id, updates) => {
        const updatedReward = rewards.find(r => r.id === id);
        if (!updatedReward) return;

        const fullUpdatedReward = { ...updatedReward, ...updates };
        const newRewards = rewards.map(r => r.id === id ? fullUpdatedReward : r);
        setRewards(newRewards);
        safeStorageSet(STORAGE_KEYS.REWARDS, JSON.stringify(newRewards));

        // Explicit sync with alert for debugging
        // Silent sync
        if (supabase) {
            supabase.from('rewards').upsert(formatRewardForCloud(fullUpdatedReward)).then(({ error }) => {
                if (error) console.error('Error saving reward:', error);
                else console.log('✅ Premio guardado en nube');
            });
        }
    };

    const deleteReward = (id) => {
        const newRewards = rewards.filter(r => r.id !== id);
        setRewards(newRewards);
        safeStorageSet(STORAGE_KEYS.REWARDS, JSON.stringify(newRewards));

        // Explicitly delete from Supabase
        if (supabase) {
            supabase.from('rewards').delete().eq('id', id).then(({ error }) => {
                if (error) console.error('Error al eliminar premio de nube:', error);
                else console.log('✅ Premio eliminado de nube:', id);
            });
        }
    };

    // New Session Management

    // formatSessionForCloud moved up

    const syncSession = async (session) => {
        if (!supabase) return;
        const cloudData = formatSessionForCloud(session);
        const { error } = await supabase.from('sessions').upsert(cloudData);
        if (error) {
            console.error('Error syncing session:', error);
            setSyncError(`sessions: ${error.message}`);
        } else {
            setSyncError(null);
        }
    };
    const openSession = (sessionData) => {
        // sessionData: { cashier: 'Name', initialCash: 10000 }

        // Anti-duplicate guard: don't open if there's already an active session
        const existingActive = sessions.find(s => !s.endedAt);
        if (existingActive) {
            console.warn("Active session already exists:", existingActive.id);
            alert(`Ya existe un turno activo de ${existingActive.cashier}. Por favor ciérralo antes de abrir uno nuevo.`);
            return;
        }

        const newSession = {
            ...sessionData,
            id: Date.now().toString(),
            startedAt: new Date().toISOString(),
            endedAt: null,
            finalCash: 0,
            salesCount: 0,
            declaredTotal: 0,
            lastOrderNumber: 0
        };
        const newSessions = [newSession, ...sessions];
        setSessions(newSessions);
        safeStorageSet('seitu_sessions', JSON.stringify(newSessions));
        syncSession(newSession);
    };

    const closeSession = (closeData) => {
        // closeData: { declaredTotal: 25000, notes: '...', salesCount: ... }
        // Find active session
        const activeIndex = sessions.findIndex(s => !s.endedAt);
        if (activeIndex === -1) {
            console.error("No active session to close");
            return;
        }

        const updatedSessions = [...sessions];
        updatedSessions[activeIndex] = {
            ...updatedSessions[activeIndex],
            ...closeData,
            endedAt: new Date().toISOString()
        };

        setSessions(updatedSessions);
        safeStorageSet('seitu_sessions', JSON.stringify(updatedSessions));
        syncSession(updatedSessions[activeIndex]);

        // Also save to legacy cashCuts for compatibility if needed, but 'sessions' is superior
    };

    const updateActiveSession = (updates) => {
        const activeIndex = sessions.findIndex(s => !s.endedAt);
        if (activeIndex === -1) return;

        const updatedSessions = [...sessions];
        updatedSessions[activeIndex] = {
            ...updatedSessions[activeIndex],
            ...updates
        };

        setSessions(updatedSessions);
        // Only save to localStorage if there are actual updates to prevent infinite loops if used in effects
        safeStorageSet('seitu_sessions', JSON.stringify(updatedSessions));
        syncSession(updatedSessions[activeIndex]);
    };

    const activeSession = sessions.find(s => !s.endedAt) || null;

    const checkSessionStatus = () => {
        return !!activeSession;
    };

    const addCashCut = (cutData) => {
        // Deprecated or mapped to closeSession?
        // Let's keep it for now but maybe unused
        const newCuts = [...cashCuts, { ...cutData, id: Date.now().toString() }];
        setCashCuts(newCuts);
        safeStorageSet('seitu_cash_cuts', JSON.stringify(newCuts));
    };

    const addExpense = async (expense) => {
        const newMovement = {
            ...expense,
            type: expense.type || 'expense',
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            sessionId: activeSession?.id
        };
        const newExpenses = [newMovement, ...expenses];
        setExpenses(newExpenses);
        safeStorageSet('seitu_expenses', JSON.stringify(newExpenses));

        if (supabase) {
            try {
                const { error } = await supabase.from('expenses').upsert(formatExpenseForCloud(newMovement));
                if (error) console.error('Error syncing expense:', error);
            } catch (err) {
                console.error('Error syncing expense:', err);
            }
        }
    };

    const deleteExpense = async (expenseId) => {
        if (!confirm('¿Seguro?? Se borrará del historial y el arqueo.')) return;
        const newExpenses = expenses.filter(e => e.id !== expenseId);
        setExpenses(newExpenses);
        safeStorageSet('seitu_expenses', JSON.stringify(newExpenses));
        if (supabase) await supabase.from('expenses').delete().eq('id', expenseId);
    };

    const deleteSale = async (saleId) => {
        if (!confirm('¿Borrar VENTA? Afectará al arqueo.')) return;

        const saleToDelete = sales.find(s => s.id === saleId);
        
        const newSales = sales.filter(s => s.id !== saleId);
        setSales(newSales);
        safeStorageSet('seitu_sales', JSON.stringify(newSales));
        if (supabase) await supabase.from('sales').delete().eq('id', saleId);

        if (saleToDelete) {
            const auditMsg = `Venta eliminada: Orden #${saleToDelete.orderNumber || saleToDelete.id.substring(0,6)} por $${saleToDelete.totalAmount || saleToDelete.total || 0}`;
            addAuditEntry('SALE_DELETED', auditMsg);
            
            const currentActiveSession = sessions.find(s => !s.endedAt) || null;
            if (currentActiveSession) {
                const currentNotes = currentActiveSession.notes || '';
                const timeStr = new Date().toLocaleTimeString();
                const newNotes = currentNotes + `\n[${timeStr}] ⚠️ ${auditMsg}`;
                updateActiveSession({ notes: newNotes.trim() });
            }
        }
    };


    const updateExpense = async (id, updates) => {
        const newExpenses = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
        setExpenses(newExpenses);
        safeStorageSet('seitu_expenses', JSON.stringify(newExpenses));

        // Sync to Supabase
        if (supabase) {
            try {
                const updatedExpense = newExpenses.find(e => e.id === id);
                if (updatedExpense) {
                    const { error } = await supabase.from('expenses').upsert(formatExpenseForCloud(updatedExpense));
                    if (error) console.error('Error syncing updated expense:', error);
                }
            } catch (err) {
                console.error('Error syncing updated expense:', err);
            }
        }
    };

    const factoryReset = async () => {
        if (!window.confirm("🔥 ¿ESTÁS SEGURO? Esta acción es IRREVERSIBLE.\n\nSe borrará TODO el catálogo de la nube, el stock de helados y los registros de auditoría.\n\nSolo se restaurará el catálogo oficial de la planilla.")) {
            return;
        }

        setLoading(true);
        try {
            console.log("🔥 INICIANDO WIPE TOTAL & RESET...");
            alert("Iniciando borrado total. Por favor espera a que la página se recargue sola (puede tardar un minuto)...");

            // 1. CLEAR CLOUD TABLES (Catalog & Ice Cream)
            if (supabase) {
                console.log("Deleting cloud tables...");
                await supabase.from('catalog').delete().neq('id', 'WIPE_FORCE_NON_EXISTENT');
                await supabase.from('ice_cream_stock').delete().neq('id', 'WIPE_FORCE_NON_EXISTENT');
                await supabase.from('ice_cream_logs').delete().neq('id', 'WIPE_FORCE_NON_EXISTENT');
                console.log("Cloud tables deleted.");
            }

            // 2. PREPARE INITIAL CATALOG
            const initialCatalog = INITIAL_PRODUCTS;

            // 3. UPDATE CLOUD CATALOG (Chunked to avoid errors)
            if (supabase) {
                console.log(`Inserting ${initialCatalog.length} initial catalog items into cloud...`);
                const cloudData = initialCatalog.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: Number(p.price) || 0,
                    quantity: Number(p.quantity) || 0,
                    min_stock: Number(p.minStock) || 5,
                    cc: p.cc || 0,
                    pack_units: p.packUnits || 1,
                    barcode: p.barcode || '',
                    points_earned_ratio: p.pointsEarnedRatio !== undefined ? p.pointsEarnedRatio : 1
                }));

                // Split in chunks of 50
                const chunkSize = 50;
                for (let i = 0; i < cloudData.length; i += chunkSize) {
                    const chunk = cloudData.slice(i, i + chunkSize);
                    const { error } = await supabase.from('catalog').insert(chunk);
                    if (error) throw error;
                    console.log(`Inserted catalog chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(cloudData.length / chunkSize)}`);
                }
                console.log("Initial catalog inserted into cloud.");
            }

            // 4. UPDATE LOCAL STORAGE & STATE
            setCatalog(initialCatalog);
            setIceCreamStock({});
            setIceCreamLogs([]);
            safeStorageSet('seitu_catalog', JSON.stringify(initialCatalog));
            safeStorageSet('seitu_ice_cream_stock', JSON.stringify({}));
            safeStorageSet('seitu_ice_cream_logs', JSON.stringify([]));

            // 5. CATEGORIES REGENERATION
            const initialCats = Array.from(new Set(initialCatalog.map(p => p.category))).sort();
            setCategories(initialCats);
            safeStorageSet('seitu_categories', JSON.stringify(initialCats));

            console.log("✅ WIPE & RESET COMPLETADO.");
            alert("Sistema reseteado correctamente. La página se recargará ahora.");
            window.location.reload();
        } catch (error) {
            console.error("❌ Error en factoryReset:", error);
            alert("Error al resetear: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = async () => {
        if (!window.confirm("⚠️ ¿ATENCIÓN: Estás seguro de BORRAR TODO EL HISTORIAL DE VENTAS Y TURNOS?\n\n- Se eliminarán todas las ventas, cajas cerradas, gastos y movimientos.\n- Los productos y precios SE MANTENDRÁN intactos.\n- El stock podría desajustarse y requerir un conteo nuevo.\n\n¿Continuar?")) {
            return;
        }

        setLoading(true);
        try {
            console.log("🔥 LIMPIANDO HISTORIAL (FORCE MODE)...");

            // 1. CLEAR LOCAL STATE IMMEDIATELY
            setSales([]);
            setSessions([]);
            setPurchases([]);
            setExpenses([]);
            setStockLogs([]);
            setAuditLog([]);
            setIceCreamLogs([]);
            setIceCreamStock({});

            // 2. NUKE LOCAL STORAGE (The only way to be sure)
            console.log("💥 NUKING LOCAL STORAGE...");
            try {
                // Mantenemos solo items críticos si hiciera falta, pero "Borrar historial" suele implicar resetear datos locales.
                // Guardamos el tema (dark mode) si existe
                const theme = localStorage.getItem('theme');
                const adminKey = localStorage.getItem('adminKey'); // Si usas esto

                localStorage.clear();

                // Restaurar configs básicas
                if (theme) localStorage.setItem('theme', theme);
                if (adminKey) localStorage.setItem('adminKey', adminKey);

                // Forzar estado vacío explícitamente también
                safeStorageSet(STORAGE_KEYS.SESSIONS, '[]');
                safeStorageSet('seitu_sessions', '[]'); // Nombre alternativo común
                safeStorageSet('seitu-storage-sessions', '[]');
            } catch (e) {
                console.error("Local Storage Clear Error:", e);
            }

            // 3. CLEAR CLOUD TABLES (Explicitly one by one to catch errors)
            if (supabase) {
                console.log("Deleting history from cloud tables...");

                // Helper to delete all rows
                const deleteAll = async (table) => {
                    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything force
                    if (error) console.error(`Error clearing ${table}:`, error);
                    else console.log(`Cleared ${table}`);
                };

                // ORDER IS CRITICAL (Foreign Key Constraints)
                // 1. Delete Details first
                await deleteAll('sales');
                await deleteAll('purchases');
                await deleteAll('expenses');
                await deleteAll('stock_logs');
                await deleteAll('audit_logs');
                await deleteAll('ice_cream_logs');
                await deleteAll('ice_cream_stock');
                await deleteAll('debts');

                // 2. Delete Parent (Sessions) LAST
                await deleteAll('sessions');

                console.log("Cloud history cleared.");
            }

            alert("✅ HISTORIAL ELIMINADO CORRECTAMENTE.\n\nEl sistema se recargará ahora para refrescar todo.");
            window.location.reload();

        } catch (error) {
            console.error("Error clearing history:", error);
            alert("Error al limpiar historial: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const restoreDefaultCatalog = factoryReset; // Alias for backward compatibility

    const updateProductSettings = (productName, newSettings) => {
        const updated = { ...settings, [productName]: { ...settings[productName], ...newSettings } };
        setSettings(updated);
        safeStorageSet(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    };

    const updateGlobalSettings = (newGlobalSettings) => {
        const updated = { ...settings, _global: { ...settings._global, ...newGlobalSettings } };
        setSettings(updated);

        try {
            safeStorageSet(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        } catch (e) {
            console.error("LocalStorage full:", e);
        }

        if (supabase) {
            // Upsert using 'configuration' column for flexibility
            supabase.from('settings').upsert({ id: 'global', configuration: updated._global }).then(({ error }) => {
                if (error) {
                    console.error('Error saving settings:', error);
                } else {
                    console.log('✅ Configuración guardada en Nube.');
                }
            });
        }
    };

    // Derived state: Inventory
    const getInventory = () => {
        const inventory = {};

        // 1. Initialize with Catalog Items (Legacy Data + New Items)
        catalog.forEach(item => {
            if (!item || !item.name) return;
            // v4.7: Normalized key to prevent duplicates in POS UI
            const key = `${nrm(item.category)} - ${nrm(item.name)}`;
            const itemSettings = settings[item.name] || {};

            const existing = inventory[key];
            if (existing) {
                // Merge logic for UI display
                inventory[key] = {
                    ...existing,
                    quantity: (Number(existing.quantity || 0) + Number(item.quantity || 0)),
                    currentStock: (Number(existing.currentStock || 0) + Number(item.quantity || 0)),
                    price: (Number(item.price || 0) > Number(existing.price || 0)) ? item.price : existing.price,
                    barcode: item.barcode || existing.barcode || "",
                    id: (item.id && !item.id.toString().startsWith('init-')) ? item.id : existing.id
                };
            } else {
                inventory[key] = {
                    ...item,
                    ...itemSettings,
                    totalPurchased: 0,
                    totalSold: 0,
                    currentStock: Number(item.quantity || 0),
                    stockResetAt: item.stockResetAt || null
                };
            }
        });

        // 2. Add Purchases (Increase Stock)
        purchases.forEach(invoice => {
            // SKIP stock addition if it's a historical record
            if (invoice.isHistorical) return;

            invoice.items.forEach(item => {
                const key = `${nrm(item.category)} - ${nrm(item.name)}`;
                // If purchase item not in catalog, add it
                if (!inventory[key]) {
                    inventory[key] = {
                        id: 'generating...',
                        name: item.name,
                        category: item.category,
                        price: 0,
                        minStock: 5,
                        currentStock: 0,
                        totalPurchased: 0,
                        totalSold: 0,
                        stockResetAt: null
                    };
                }
                // Skip purchases that happened BEFORE the last physical count (recuento)
                const resetAt = inventory[key].stockResetAt;
                if (resetAt && invoice.date) {
                    const purchaseTime = new Date(invoice.date).getTime();
                    const resetTime = new Date(resetAt).getTime();
                    if (purchaseTime < resetTime) return; // Pre-recuento, already counted
                }
                inventory[key].totalPurchased += Number(item.quantity || 0) * (Number(item.packUnits) || 1);
                inventory[key].currentStock += Number(item.quantity || 0) * (Number(item.packUnits) || 1);
            });
        });

        // 3. Subtract Sales (Decrease Stock)
        sales.forEach(record => {
            record.items.forEach(item => {
                let key = `${nrm(item.category)} - ${nrm(item.name)}`;

                // Fallback for loose matches (e.g. searching for "FRUTILLA" in "C. FRUTILLA")
                if (!inventory[key]) {
                    const itemNameUpper = (item.name || '').toUpperCase();
                    // Find keys where the product name is part of the full catalog key
                    const possibleKeys = Object.keys(inventory).filter(k => k.toUpperCase().includes(itemNameUpper));
                    if (possibleKeys.length === 1) key = possibleKeys[0];
                }

                if (inventory[key]) {
                    // Skip sales that happened BEFORE the last physical count (recuento)
                    const resetAt = inventory[key].stockResetAt;
                    if (resetAt && record.timestamp) {
                        const saleTime = new Date(record.timestamp).getTime();
                        const resetTime = new Date(resetAt).getTime();
                        if (saleTime < resetTime) return; // Pre-recuento, already counted
                    }
                    inventory[key].totalSold += Number(item.quantity);
                    inventory[key].currentStock -= Number(item.quantity);
                }

                // --- RECIPES / DEDUCTIONS (Insumos/Containers) ---
                const RECIPES = {
                    // 1 Kilo matches
                    'promo 1 kg': [{ target: 'Pote 1 Kg', qty: 1 }],
                    'promo 1 kilo': [{ target: 'Pote 1 Kg', qty: 1 }],
                    '1 kilo': [{ target: 'Pote 1 Kg', qty: 1 }],
                    '1 kg': [{ target: 'Pote 1 Kg', qty: 1 }],
                    '1kg': [{ target: 'Pote 1 Kg', qty: 1 }], // No space match

                    // 2 Kilos matches
                    'promo 2 kilos': [{ target: 'Pote 1 Kg', qty: 2 }],
                    'promo 2 kg': [{ target: 'Pote 1 Kg', qty: 2 }],
                    '2 kilos': [{ target: 'Pote 1 Kg', qty: 2 }],

                    // 1/2 Kilo matches
                    'promo 1/2 kilo': [{ target: 'Pote 1/2 Kg', qty: 1 }],
                    'promo 1/2 kg': [{ target: 'Pote 1/2 Kg', qty: 1 }],
                    '1/2 kilo': [{ target: 'Pote 1/2 Kg', qty: 1 }],
                    '1/2 kg': [{ target: 'Pote 1/2 Kg', qty: 1 }],
                    'medio kilo': [{ target: 'Pote 1/2 Kg', qty: 1 }],
                    '1/2 de helado': [{ target: 'Pote 1/2 Kg', qty: 1 }], // Ticket match

                    // 1/4 Kilo matches
                    'promo 2 x 1/4': [{ target: 'Pote 1/4 Kg', qty: 2 }],
                    'promo 3 x 1/4': [{ target: 'Pote 1/4 Kg', qty: 3 }],
                    'promo 4 x 1/4': [{ target: 'Pote 1/4 Kg', qty: 4 }],
                    'promo helado 2 1/4': [{ target: 'Pote 1/4 Kg', qty: 2 }], // Ticket match
                    'promo 1/4': [{ target: 'Pote 1/4 Kg', qty: 1 }],
                    '1/4 kilo': [{ target: 'Pote 1/4 Kg', qty: 1 }],
                    '1/4 kg': [{ target: 'Pote 1/4 Kg', qty: 1 }],
                    'cuarto kilo': [{ target: 'Pote 1/4 Kg', qty: 1 }],
                    '1/4 de helado': [{ target: 'Pote 1/4 Kg', qty: 1 }], // Ticket match

                    // Takeaway / Descartables
                    'subatido': [{ target: 'SuBatido (Vaso)', qty: 1 }],
                    'vaso café grande': [{ target: 'Vaso Café Grande', qty: 1 }],
                    'vaso café chico': [{ target: 'Vaso Café Chico', qty: 1 }],
                };

                const itemNameLower = item.name.toLowerCase();

                const recipeKeys = Object.keys(RECIPES).sort((a, b) => b.length - a.length);

                // Check for recipe match
                // We search if any key in RECIPES matches the sold item name loosely or strictly
                // Strategy: Find the first key that is contained in itemNameLower
                const recipeKey = recipeKeys.find(key => itemNameLower.includes(key));

                if (recipeKey) {
                    // console.log(`[Stock] Deducting supplies for: ${item.name} (Matched: ${recipeKey})`);
                    const ingredients = RECIPES[recipeKey];
                    ingredients.forEach(ing => {
                        // Find the ingredient in inventory (loose match again or strict?)
                        // 'Pote 1 Kg (Telgopor)' should allow loose match if we only have 'Pote 1 Kg'
                        const targetKey = Object.keys(inventory).find(k => k.toLowerCase().includes(ing.target.toLowerCase()));

                        if (targetKey && inventory[targetKey]) {
                            const qtyToDeduct = Number(item.quantity) * ing.qty;
                            // console.log(`   -> Deducting ${qtyToDeduct} of ${targetKey}`);
                            inventory[targetKey].totalSold += qtyToDeduct;
                            inventory[targetKey].currentStock -= qtyToDeduct;
                        } else {
                            // console.warn(`   -> Ingredient not found: ${ing.target}`);
                        }
                    });
                }
            });
        });


        // Return array format for components
        return Object.values(inventory).map(item => ({
            ...item,
            quantity: item.currentStock // Standardize 'quantity' as the current available stock
        }));
    };

    // Helper: Get sales since last cut or active session start
    const getCurrentSessionSales = () => {
        if (!activeSession) return [];

        // v5.3.4: Strict Filtering - No more leak between sessions
        const startTime = new Date(activeSession.startedAt).getTime();

        return sales.filter(s => {
            // Link by explicit ID (Modern)
            if (s.sessionId == activeSession.id) return true;

            // OR Link by Time window ONLY if after the start of THIS session
            const saleTime = new Date(s.timestamp).getTime();
            return saleTime >= startTime;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };


    // --- AUTO-SYNC SESSIONS ---
    useEffect(() => {
        if (!supabase) return;

        // Pick sessions that are CLOSED and NOT synced (or dirty)
        // For simplicity, we can just try to upsert the last closed session if it changed
        const closedSessions = sessions.filter(s => s.endedAt);
        if (closedSessions.length === 0) return;

        // Simple strategy: Sync the last 3 closed sessions to be safe
        const recentSessions = closedSessions
            .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
            .slice(0, 3);

        recentSessions.forEach(session => {
            const formatted = formatSessionForCloud(session);
            supabase.from('sessions').upsert(formatted)
                .then(({ error }) => {
                    if (error) console.error('Auto-sync error:', error);
                    else console.log('✅ Auto-synced session:', session.id);
                });
        });

    }, [sessions]); // Trigger whenever sessions list changes (e.g. after closeSession)

    const forceSyncSessions = async () => {
        if (!supabase) return { success: false, error: 'Supabase no conectado' };

        try {
            console.log(`🔄 Force syncing all data...`);

            // --- AUTOMATIC REPAIR BEFORE UPLOAD ---
            console.log("🧹 Reparando catálogo antes de subir...");
            const cleanCatalog = await fixCatalogNames(true);

            let syncCount = 0;

            // 1. SYNC ALL SESSIONS (Active & Closed)
            if (sessions.length > 0) {
                console.log(`.. Syncing ${sessions.length} sessions...`);
                for (const session of sessions) {
                    const formatted = formatSessionForCloud(session);
                    const { error } = await supabase.from('sessions').upsert(formatted);
                    if (error) console.error(`Error syncing session ${session.id}:`, error);
                    else syncCount++;
                }
            }

            // 2. SYNC RECENT SALES
            const recentSales = sales.filter(s => new Date(s.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
            if (recentSales.length > 0) {
                console.log(`.. Syncing ${recentSales.length} sales...`);
                // Use chunking to avoid large payload errors
                for (let i = 0; i < recentSales.length; i += 50) {
                    const chunk = recentSales.slice(i, i + 50).map(s => formatSaleForCloud(s));
                    const { error } = await supabase.from('sales').upsert(chunk);
                    if (error) console.error(`Error syncing sales chunk:`, error);
                }
            }

            // 3. SYNC EXPENSES
            const recentExpenses = expenses.filter(e => new Date(e.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
            if (recentExpenses.length > 0) {
                console.log(`.. Syncing ${recentExpenses.length} expenses...`);
                for (let i = 0; i < recentExpenses.length; i += 50) {
                    const chunk = recentExpenses.slice(i, i + 50).map(e => formatExpenseForCloud(e));
                    await supabase.from('expenses').upsert(chunk);
                }
            }

            // 4. SYNC CATALOG & PRODUCTS
            const targetCatalog = cleanCatalog || catalog;
            if (targetCatalog.length > 0) {
                const catalogData = targetCatalog.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: Number(p.price) || 0,
                    quantity: Number(p.quantity) || 0,
                    barcode: p.barcode || '',
                    image: p.image || '',
                    min_stock: Number(p.minStock) || 5,
                    cc: Number(p.cc) || 0,
                    pack_units: Number(p.packUnits) || 1,
                    points_earned_ratio: Number(p.pointsEarnedRatio || 0),
                    point_cost: Number(p.pointCost || 0),
                    bonus_points: Number(p.bonusPoints || 0)
                }));
                // Chunked upsert
                for (let i = 0; i < catalogData.length; i += 50) {
                    await supabase.from('catalog').upsert(catalogData.slice(i, i + 50));
                }
            }

            // SYNC DEBTS
            if (debts.length > 0) {
                const formattedDebts = debts.map(formatDebtForCloud);
                await supabase.from('debts').upsert(formattedDebts);
            }

            // SYNC STOCK LOGS (Last 30 days)
            const logWindow = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const recentLogs = stockLogs.filter(l => new Date(l.timestamp) > logWindow);
            if (recentLogs.length > 0) {
                for (let i = 0; i < recentLogs.length; i += 50) {
                    const chunk = recentLogs.slice(i, i + 50).map(formatStockLogForCloud);
                    await supabase.from('stock_logs').upsert(chunk);
                }
            }

            // SYNC AUDIT LOGS (Last 7 days)
            const auditWindow = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentAudit = auditLog.filter(l => new Date(l.timestamp) > auditWindow);
            if (recentAudit.length > 0) {
                await supabase.from('audit_logs').upsert(recentAudit.map(formatAuditLogForCloud));
            }

            // SYNC ENVELOPES
            if (envelopes.length > 0) {
                await supabase.from('envelopes').upsert(envelopes.map(formatEnvelopeForCloud));
            }

            console.log('✅ Force sync complete');
            return { success: true, count: syncCount };
        } catch (error) {
            console.error('Force sync failed:', error);
            return { success: false, error: error.message };
        }
    };

    // Helper: Get expenses since last cut or active session start
    const getCurrentSessionExpenses = () => {
        if (!activeSession) return [];

        // v5.3.4: Strict Filtering - Prevent leaks
        const startTime = new Date(activeSession.startedAt).getTime();

        return expenses.filter(e => {
            if (e.sessionId == activeSession.id) return true;

            const expTime = new Date(e.timestamp).getTime();
            return expTime >= startTime;
        });
    };


    const addStockLog = (log) => {
        const fullLog = {
            ...log,
            id: log.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
            timestamp: log.timestamp || new Date().toISOString()
        };
        const newLogs = [fullLog, ...stockLogs].slice(0, 1000); // Keep last 1000 locally
        setStockLogs(newLogs);
        safeStorageSet('seitu_stock_logs', JSON.stringify(newLogs));

        if (supabase) {
            supabase.from('stock_logs').insert([formatStockLogForCloud(fullLog)]).then(({ error }) => {
                if (error) console.error('Add stock log sync error:', error);
            });
        }
    };

    const deleteStockSession = (sessionTs, user) => {
        const sessionDateKey = sessionTs.slice(0, 16);
        const logsToDelete = stockLogs.filter(log =>
            log.timestamp.startsWith(sessionDateKey) && log.user === user
        );

        const remainingLogs = stockLogs.filter(log =>
            !(log.timestamp.startsWith(sessionDateKey) && log.user === user)
        );

        setStockLogs(remainingLogs);
        safeStorageSet('seitu_stock_logs', JSON.stringify(remainingLogs));

        if (supabase && logsToDelete.length > 0) {
            const idsToDelete = logsToDelete.map(l => l.id);
            // Stock logs in cloud use either 'id' or we might need to filter by product/user/timestamp if id is different
            // But based on formatStockLogForCloud, we use log.id
            supabase.from('stock_logs').delete().in('id', idsToDelete).then(({ error }) => {
                if (error) {
                    console.error('Error deleting stock logs from cloud:', error);
                }
            });
        }
    };

    const adjustStock = (productIdOrName, newQuantity, reason, user) => {
        // Find product by ID first (more precise), then Name
        const product = catalog.find(p => p.id === productIdOrName) || catalog.find(p => p.name === productIdOrName);

        if (!product) {
            console.error("Product not found for adjustment:", productIdOrName);
            return;
        }

        // Get current derived stock details
        const inv = getInventory();

        // CRITICAL DE DUPLICATES FIX:
        // Las ventas históricas pueden estar dispersas en varios "items de inventario" (fantasmas)
        // debido a diferencias de mayúsculas/minúsculas o IDs antiguos.
        // Para calcular la Base Correcta, debemos sumar TODAS las ventas asociadas a este nombre.

        const normalizedTarget = product.name.trim().toLowerCase();

        // Find ALL matching items in inventory (Real + Ghosts)
        const matchingItems = inv.filter(i =>
            i.id === product.id ||
            (i.name && i.name.trim().toLowerCase() === normalizedTarget)
        );

        if (matchingItems.length === 0) {
            console.error("Inventory Item not found for adjustment:", productIdOrName);
            return;
        }

        // Sumarizar históricos
        let totalPurchased = 0;
        let totalSold = 0;

        // El currentStock actual "percibido" por el sistema es la suma de los stocks de estos items? 
        // O más bien, nos interesa cuánto se vendió históricamente para compensarlo.

        matchingItems.forEach(i => {
            totalPurchased += (i.totalPurchased || 0);
            totalSold += (i.totalSold || 0);
        });

        // Current Actual Stock (del item principal o suma? Para el log usamos lo que sea más representativo)
        // Si el usuario ve "-45", ese es el número que queremos corregir.
        // Ese número viene de (Base - Ventas).
        // Si sumamos todas las ventas, obtenemos 85.
        // Si la Base actual es 40. 40 - 85 = -45. Correcto.

        // Item principal para sacar stock actual de referencia
        const mainItem = matchingItems.find(i => i.id === product.id) || matchingItems[0];
        const currentActualStock = mainItem.quantity; // Ojo: inventory.quantity suele ser el stock calculado final.
        // En getInventory (que no vi completo), item.quantity solia ser el Base. item.currentStock era el final.
        // Asumamos que mainItem.currentStock es lo que ve el usuario.
        const currentVisibleStock = matchingItems.reduce((acc, i) => acc + (i.currentStock || 0), 0);

        console.log(`Adjusting Stock for ${product.name}. Found ${matchingItems.length} sources. Sold: ${totalSold}, Purch: ${totalPurchased}. Visible: ${currentVisibleStock}`);

        // Formula: Actual = Base + Purchased - Sold
        // To reach a Desired Actual Stock, we need:
        // Desired Base = Desired Actual - Purchased + Sold
        // (If Purchased=0, Sold=85, Desired=40 -> Base = 40 - 0 + 85 = 125)
        // (Base=125, Purch=0, Sold=85 -> Actual = 125-85 = 40). PERFECT.
        const newBaseQuantity = Number(newQuantity) - totalPurchased + totalSold;

        // Update Catalog (Base Quantity)
        updateCatalogItem(product.id, { quantity: newBaseQuantity });

        addStockLog({
            product: product.name, // Use canonical name
            oldStock: currentVisibleStock,
            newStock: Number(newQuantity),
            difference: Number(newQuantity) - currentVisibleStock, // Changed from currentActualStock
            reason,
            user: user || activeSession?.cashier || localStorage.getItem('seitu_user') || 'Admin'
        });
    };

    const bulkAdjustStock = (adjustments, userArg = 'Admin') => {
        // v5.2: Robust Bulk Adjustment - Now handles MISSING items by creating them
        const user = (userArg === 'Admin' || !userArg)
            ? (activeSession?.cashier || localStorage.getItem('seitu_user') || 'Admin')
            : userArg;

        const currentInv = getInventory();

        setCatalog(prev => {
            const updated = [...prev];
            const cloudUpserts = [];

            adjustments.forEach(adj => {
                // Matching logic: ID > Barcode+Category > Barcode > Name+Category (Fuzzy)
                let itemIndex = updated.findIndex(p => {
                    const adjId = adj.productId?.toString() || "";
                    const pId = p.id?.toString() || "";
                    // 1. Strict ID Match (direct or proxy) — HIGHEST PRIORITY
                    if (adjId && pId && (adjId === pId || adjId === `missing-${pId}`)) return true;
                    return false;
                });

                // 2. If no ID match, try Barcode + Category (handles same barcode in different categories)
                if (itemIndex === -1 && adj.barcode && adj.barcode.trim() !== "") {
                    itemIndex = updated.findIndex(p =>
                        p.barcode && p.barcode.trim() !== "" && adj.barcode === p.barcode &&
                        adj.category && p.category && nrm(adj.category) === nrm(p.category)
                    );
                    // 2b. Barcode only (no category check) as fallback
                    if (itemIndex === -1) {
                        itemIndex = updated.findIndex(p =>
                            p.barcode && p.barcode.trim() !== "" && adj.barcode === p.barcode
                        );
                    }
                }

                // 3. Name + Category (Fuzzy - Only if no barcode match)
                if (itemIndex === -1) {
                    itemIndex = updated.findIndex(p => {
                        if (nrm(adj.productName) === nrm(p.name)) {
                            if (adj.category && p.category && nrm(adj.category) === nrm(p.category)) return true;
                            if (!adj.category) return true;
                        }
                        return false;
                    });
                }

                const adjustmentValue = Number(adj.newTotal) || 0;
                let finalItem;

                if (itemIndex !== -1) {
                    const p = updated[itemIndex];
                    let newBaseQuantity;

                    if (adj.isAdditive) {
                        // MODO PEDIDO: Sumamos al stock base
                        newBaseQuantity = (p.quantity || 0) + adjustmentValue;
                        updated[itemIndex] = { ...p, quantity: newBaseQuantity };
                    } else {
                        // MODO RECUENTO: El valor ingresado ES el stock real.
                        // Guardamos stockResetAt para que getInventory() ignore ventas/compras anteriores.
                        newBaseQuantity = adjustmentValue;
                        const resetTimestamp = new Date().toISOString();
                        updated[itemIndex] = { ...p, quantity: newBaseQuantity, stockResetAt: resetTimestamp };
                        console.log(`[RECUENTO] ${p.name}: stock=${adjustmentValue}, resetAt=${resetTimestamp}`);
                    }

                    finalItem = updated[itemIndex];
                } else {
                    // PRODUCTO NO ENCONTRADO: Lo creamos
                    let finalId = adj.productId || "";
                    if (finalId.startsWith('missing-')) {
                        const extracted = finalId.replace('missing-', '');
                        // If it's a numeric ID from template, use it. Otherwise use random
                        if (extracted && !isNaN(extracted)) finalId = extracted;
                        else finalId = "";
                    }

                    if (!finalId) {
                        finalId = `init-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    }

                    const newItem = {
                        id: finalId,
                        name: adj.productName.toUpperCase(),
                        category: adj.category || "HELADOS",
                        quantity: adjustmentValue, // Como es nuevo, el base es el total deseado
                        barcode: adj.barcode || "",
                        price: 0
                    };
                    updated.push(newItem);
                    finalItem = newItem;
                }

                if (supabase && finalItem) {
                    const upsertObj = {
                        id: finalItem.id,
                        name: finalItem.name,
                        category: finalItem.category,
                        price: finalItem.price || 0,
                        quantity: finalItem.quantity,
                        min_stock: finalItem.minStock || 5,
                        cc: finalItem.cc || 0,
                        pack_units: finalItem.packUnits || 1,
                        barcode: finalItem.barcode || '',
                        image: finalItem.image || '',
                        points_earned_ratio: finalItem.pointsEarnedRatio !== undefined ? finalItem.pointsEarnedRatio : 1,
                        point_cost: finalItem.pointCost || 0,
                        bonus_points: finalItem.bonusPoints || 0,
                        updated_at: new Date().toISOString()
                    };
                    // Include stock_reset_at if it exists (RECUENTO mode)
                    if (finalItem.stockResetAt) upsertObj.stock_reset_at = finalItem.stockResetAt;
                    cloudUpserts.push(upsertObj);
                }
            });

            safeStorageSet('seitu_catalog', JSON.stringify(updated));

            // Persist stockResetAt timestamps separately (survives cloud sync overwrites)
            const resetMap = {};
            updated.forEach(p => { if (p.stockResetAt) resetMap[p.id] = p.stockResetAt; });
            safeStorageSet('seitu_stock_reset_map', JSON.stringify(resetMap));

            if (supabase && cloudUpserts.length > 0) {
                supabase.from('catalog').upsert(cloudUpserts).then(({ error }) => {
                    if (error) console.error('Bulk stock sync error:', error);
                });
            }

            return updated;
        });

        // Logging Logic
        const newLogs = adjustments.map(adj => {
            const item = currentInv.find(i =>
                (adj.productId && adj.productId === i.id) ||
                (adj.barcode && i.barcode === adj.barcode) ||
                (nrm(i.name) === nrm(adj.productName))
            );

            const currentStock = item ? (item.currentStock || 0) : 0;
            const newTotalCalc = adj.isAdditive ? (currentStock + (Number(adj.newTotal) || 0)) : (Number(adj.newTotal) || 0);
            const difference = newTotalCalc - currentStock;

            return {
                id: (Date.now() + Math.random()).toString(),
                timestamp: new Date().toISOString(),
                product: adj.productName,
                productId: adj.productId || (item ? item.id : null),
                category: adj.category,
                oldStock: currentStock,
                newStock: newTotalCalc,
                difference: difference,
                reason: adj.reason,
                user,
                bultos: adj.bultos,
                units: adj.units,
                packUnits: adj.packUnits,
                isAdditive: adj.isAdditive
            };
        });

        setStockLogs(prev => {
            const up = [...newLogs, ...prev];
            safeStorageSet('seitu_stock_logs', JSON.stringify(up));
            return up;
        });

        if (supabase) {
            supabase.from('stock_logs').insert(newLogs.map(l => formatStockLogForCloud(l))).then(({ error }) => {
                if (error) console.error('Bulk stock log sync error:', error);
            });
        }
    };

    // v16.86: Apply a past physical count session to current inventory
    const applyStockSession = (sessionTs, user, isAdditive = false) => {
        const sessionDateKey = sessionTs.slice(0, 16);
        const sessionLogs = stockLogs.filter(log =>
            log.timestamp.startsWith(sessionDateKey) && log.user === user && (log.bultos !== undefined || log.units !== undefined)
        );

        if (sessionLogs.length === 0) return;

        const currentCatalog = catalog;
        const normalizedCatalog = currentCatalog.map(p => ({
            ...p,
            normName: nrm(p.name),
            normCat: nrm(p.category)
        }));

        const adjustments = sessionLogs.map(log => {
            // MATCHING LOGIC
            let targetItem = null;

            // 1. Match by ID (Best)
            if (log.productId) {
                targetItem = normalizedCatalog.find(p => p.id === log.productId);

                // 1.1 Match by ID Fuzzy (Fix for corrupted IDs with spaces from old logs)
                if (!targetItem) {
                    const fixedLogId = log.productId.replace(/\s+/g, '-'); // Try replacing spaces with dashes
                    targetItem = normalizedCatalog.find(p => p.id === fixedLogId);
                }
                // 1.2 Attempt reversing the fix (dashes to spaces, unlikely but safe)
                if (!targetItem) {
                    const fixedLogId = log.productId.replace(/-/g, ' ');
                    targetItem = normalizedCatalog.find(p => p.id === fixedLogId);
                }
            }

            // 2. Match by Strict Name + Category
            if (!targetItem) {
                targetItem = normalizedCatalog.find(p =>
                    p.normName === nrm(log.product) && p.normCat === nrm(log.category)
                );
            }

            // 3. Match by Name Only (Normalized)
            if (!targetItem) {
                targetItem = normalizedCatalog.find(p => p.normName === nrm(log.product));
            }

            // 4. Loose Match (Contains) - Essential for Handle Prefixes v16.76
            if (!targetItem) {
                const logNameNorm = nrm(log.product);
                targetItem = normalizedCatalog.find(p => p.normName.includes(logNameNorm) || logNameNorm.includes(p.normName));
            }

            if (!targetItem) {
                console.warn(`Could not match historical log product: ${log.product} (${log.category})`);
                return null;
            }

            return {
                productId: targetItem.id,
                productName: targetItem.name,
                category: targetItem.category,
                newTotal: log.newStock, // This is the total count in that session
                reason: isAdditive ? `Ingreso de mercadería desde Auditoría (${new Date(sessionTs).toLocaleString()})` : `Sincronización desde Auditoría (${new Date(sessionTs).toLocaleString()})`,
                bultos: log.bultos,
                units: log.units,
                packUnits: log.packUnits,
                isAdditive: isAdditive // v16.86: Support adding instead of overwriting
            };
        }).filter(Boolean);

        if (adjustments.length > 0) {
            bulkAdjustStock(adjustments, user || 'Admin');
            return true;
        }
        return false;
    };



    const updateSocialLinks = (newLinks) => {
        const updated = { ...socialLinks, ...newLinks };
        setSocialLinks(updated);
        safeStorageSet('seitu_social_links', JSON.stringify(updated));

        if (supabase) {
            supabase.from('settings').upsert({ id: 'social_links', configuration: updated }).then(({ error }) => {
                if (error) console.error('Error syncing social links:', error);
            });
        }
    };

    const updateLandingPosts = (newPosts) => {
        setLandingPosts(newPosts);
        safeStorageSet('seitu_landing_posts', JSON.stringify(newPosts));

        if (supabase) {
            supabase.from('settings').upsert({ id: 'landing_posts', configuration: { posts: newPosts } }).then(({ error }) => {
                if (error) console.error('Error syncing landing posts:', error);
            });
        }
    };

    const updatePromoBanner = (newBanner) => {
        setPromoBanner(newBanner);
        safeStorageSet('seitu_promo_banner', JSON.stringify(newBanner));

        if (supabase) {
            supabase.from('settings').upsert({ id: 'promo_banner', configuration: newBanner }).then(({ error }) => {
                if (error) console.error('Error syncing promo banner:', error);
            });
        }
    };

    const addEventPostPaloma = async (post) => {
        let latestPosts = eventPostsPaloma;
        let latestAuto = autoApprovePaloma;

        // Intentar obtener lo último de la nube para no pisar mensajes de otros
        if (supabase) {
            try {
                const { data } = await supabase.from('settings').select('*').eq('id', 'event_paloma15').single();
                if (data && data.configuration) {
                    latestPosts = data.configuration.posts || [];
                    latestAuto = data.configuration.autoApprove ?? false;
                }
            } catch (e) {
                console.warn("Error fetching latest event config, using local:", e);
            }
        }

        const newPost = {
            ...post,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            approved: latestAuto,
            approvedDirectly: latestAuto // Flag to show it was auto-approved
        };
        const updated = [newPost, ...latestPosts];

        setEventPostsPaloma(updated);
        // Note: We DON'T call setAutoApprovePaloma(latestAuto) here 
        // to avoid overwriting the admin's local toggle if it just changed.

        safeStorageSet('seitu_event_paloma', JSON.stringify(updated));
        if (supabase) {
            // CRITICAL: We use what we just fetched from the cloud (latestAuto) 
            // to avoid overwriting with a stale local state from the guest.
            await supabase.from('settings').upsert({
                id: 'event_paloma15',
                configuration: {
                    posts: updated,
                    autoApprove: latestAuto
                }
            });
        }
        return newPost;
    };

    const addEventPostMartina = async (post) => {
        let latestPosts = eventPostsMartina;
        let latestAuto = autoApproveMartina;

        if (supabase) {
            try {
                const { data } = await supabase.from('settings').select('*').eq('id', 'event_martina15').single();
                if (data && data.configuration) {
                    latestPosts = data.configuration.posts || [];
                    latestAuto = data.configuration.autoApprove ?? false;
                }
            } catch (e) {
                console.warn("Error fetching latest event config:", e);
            }
        }

        const newPost = {
            ...post,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            approved: latestAuto,
            approvedDirectly: latestAuto
        };
        const updated = [newPost, ...latestPosts];
        setEventPostsMartina(updated);
        safeStorageSet('seitu_event_martina', JSON.stringify(updated));

        if (supabase) {
            await supabase.from('settings').upsert({
                id: 'event_martina15',
                configuration: { posts: updated, autoApprove: latestAuto }
            });
        }
        return newPost;
    };

    const updateEventPostPaloma = async (id, updates) => {
        let latestPosts = eventPostsPaloma;
        if (supabase) {
            try {
                const { data } = await supabase.from('settings').select('*').eq('id', 'event_paloma15').single();
                if (data && data.configuration) latestPosts = data.configuration.posts || [];
            } catch (e) { }
        }

        const updated = latestPosts.map(p => p.id === id ? { ...p, ...updates } : p);
        setEventPostsPaloma(updated);
        safeStorageSet('seitu_event_paloma', JSON.stringify(updated));
        if (supabase) {
            await supabase.from('settings').upsert({ id: 'event_paloma15', configuration: { posts: updated, autoApprove: autoApprovePaloma } });
        }
    };

    const deleteEventPostPaloma = async (id) => {
        let latestPosts = eventPostsPaloma;
        if (supabase) {
            try {
                const { data } = await supabase.from('settings').select('*').eq('id', 'event_paloma15').single();
                if (data && data.configuration) latestPosts = data.configuration.posts || [];
            } catch (e) { }
        }

        const updated = latestPosts.filter(p => p.id !== id);
        setEventPostsPaloma(updated);
        safeStorageSet('seitu_event_paloma', JSON.stringify(updated));
        if (supabase) {
            await supabase.from('settings').upsert({ id: 'event_paloma15', configuration: { posts: updated, autoApprove: autoApprovePaloma } });
        }
    };

    const deleteEventPostMartina = async (id) => {
        let latestPosts = eventPostsMartina;
        if (supabase) {
            try {
                const { data } = await supabase.from('settings').select('*').eq('id', 'event_martina15').single();
                if (data && data.configuration) latestPosts = data.configuration.posts || [];
            } catch (e) { }
        }
        const updated = latestPosts.filter(p => p.id !== id);
        setEventPostsMartina(updated);
        safeStorageSet('seitu_event_martina', JSON.stringify(updated));
        if (supabase) {
            await supabase.from('settings').upsert({ id: 'event_martina15', configuration: { posts: updated, autoApprove: autoApproveMartina } });
        }
    };

    const setPalomaAutoApprove = (val) => {
        setAutoApprovePaloma(val);
        localStorage.setItem('seitu_event_auto_approve', val.toString());
        if (supabase) {
            // Use current state for posts to not lose them
            supabase.from('settings').upsert({
                id: 'event_paloma15',
                configuration: {
                    posts: eventPostsPaloma,
                    autoApprove: val
                }
            }).then(({ error }) => {
                if (!error) console.log("✅ Auto-approve setting saved to cloud:", val);
            });
        }
    };

    const clearEventPalomaData = async () => {
        if (!window.confirm("⚠️ ¿BORRAR TODO EL EVENTO ACTUAL?\n\nSe eliminarán todos los mensajes y fotos de la pantalla de 15 años. Esta acción es definitiva.")) return;

        setEventPostsPaloma([]);
        safeStorageSet('seitu_event_paloma', '[]');
        if (supabase) {
            await supabase.from('settings').upsert({ id: 'event_paloma15', configuration: { posts: [], autoApprove: false } });
        }
        alert("✅ Evento reiniciado correctamente.");
    };

    const updateEventPostMartina = async (id, updates) => {
        const updated = eventPostsMartina.map(p => p.id === id ? { ...p, ...updates } : p);
        setEventPostsMartina(updated);
        safeStorageSet('seitu_event_martina', JSON.stringify(updated));
        if (supabase) {
            await supabase.from('settings').upsert({
                id: 'event_martina15',
                configuration: { posts: updated, autoApprove: autoApproveMartina }
            });
        }
    };

    const setMartinaAutoApprove = async (val) => {
        setAutoApproveMartina(val);
        localStorage.setItem('seitu_event_auto_approve_martina', val.toString());
        if (supabase) {
            await supabase.from('settings').upsert({
                id: 'event_martina15',
                configuration: { posts: eventPostsMartina, autoApprove: val }
            });
        }
    };

    const clearEventMartinaData = async () => {
        if (!window.confirm('¿Borrar TODO el historial de Martina?')) return;
        setEventPostsMartina([]);
        localStorage.removeItem('seitu_event_martina');
        if (supabase) {
            await supabase.from('settings').upsert({
                id: 'event_martina15',
                configuration: { posts: [], autoApprove: autoApproveMartina }
            });
        }
    };


    // --- ADVANCED REPAIR TOOLS (v3.9) ---
    // --- ADVANCED REPAIR TOOLS (v4.0 - Aggressive Deduplication) ---
    // --- ADVANCED REPAIR TOOLS (v6.0 - Universal Recovery) ---
    const fixCatalogNames = async () => {
        if (!supabase) return;
        setLoading(true);
        const btn = document.getElementById('btn-fix-catalog') || document.getElementById('btn-repair-all');
        if (btn) btn.innerText = "⏳ RESTAURANDO TODO...";

        try {
            // 1. Pull Fresh from Cloud
            const { data: cloudCatalog, error: fetchErr } = await supabase.from('catalog').select('*');
            if (fetchErr) throw fetchErr;

            const inventory = cloudCatalog || [];
            const idsToDelete = [];
            const cleanCatalog = [];
            let stockRecovered = 0;

            // 2. MASTER LIST MERGE (Helados + Cafetería/Personalizados)
            // Esto asegura que los Conos y promociones de productos.js vuelvan a aparecer
            const masterList = [...ICE_CREAM_PRODUCTS, ...INITIAL_PRODUCTS];

            // 3. PRE-GROUP INVENTORY BY OFFICIAL IDENTITY
            const inventoryGroups = new Map();
            inventory.forEach(item => {
                // Match by ID or Barcode
                const masterMatch = masterList.find(m =>
                    item.id?.toString() === m.id?.toString() ||
                    (m.barcode && item.barcode && item.barcode === m.barcode)
                );

                if (masterMatch) {
                    const group = inventoryGroups.get(masterMatch.id) || {
                        sum: 0,
                        prices: [],
                        barcodes: new Set(),
                        originalIds: new Set(),
                        meta: []
                    };

                    const q = Number(item.quantity) || 0;
                    if (q < 10000 && q > -10000) group.sum += q;

                    // Si el precio en la nube es > 0, lo guardamos para preservarlo
                    if (Number(item.price) > 0) group.prices.push(Number(item.price));
                    if (item.barcode) group.barcodes.add(item.barcode);
                    group.originalIds.add(item.id);
                    inventoryGroups.set(masterMatch.id, group);
                }
            });

            // 4. REBUILD FROM MASTER
            masterList.forEach(master => {
                const group = inventoryGroups.get(master.id);

                let finalQuantity = 0;
                let finalPrice = master.price || 0;
                let finalBarcode = master.barcode || "";

                if (group) {
                    finalQuantity = group.sum;

                    // LÓGICA DE PRECIO PROTEGIDA: 
                    // Si tenemos un precio en la nube (> 0), lo usamos. 
                    // Si no, usamos el del maestro.
                    if (group.prices.length > 0) {
                        finalPrice = group.prices[0];
                    } else {
                        finalPrice = master.price || 0;
                    }

                    const userBarcode = Array.from(group.barcodes)[0];
                    finalBarcode = master.barcode || userBarcode || "";

                    group.originalIds.forEach(oid => {
                        if (oid !== master.id && !oid.toString().startsWith('init-')) {
                            idsToDelete.push(oid);
                        }
                    });

                    if (finalQuantity !== 0) stockRecovered++;
                }

                cleanCatalog.push({
                    ...master,
                    id: master.id,
                    quantity: finalQuantity,
                    price: finalPrice,
                    barcode: finalBarcode
                });
            });

            // 5. Cleanup Orphans & Preserve Others (Manual Items not in master)
            inventory.forEach(item => {
                const alreadyIncluded = cleanCatalog.some(c => c.id === item.id);
                if (alreadyIncluded) return;

                const isPersonalized = item.category?.toUpperCase().includes("PERSONALIZAD");
                const isCafeteria = item.category?.toUpperCase().includes("CAFETER") || item.category?.toUpperCase().includes("PROMOS");
                const isInsumo = item.category?.toUpperCase().includes("INSUMO");
                const isPalito = item.category?.toUpperCase().includes("PALITO") || item.category?.toUpperCase().includes("SEIBOM") || item.category?.toUpperCase().includes("SEIBON");

                if (isPersonalized || isCafeteria || isInsumo || isPalito) {
                    cleanCatalog.push(item);
                } else {
                    // It's a rogue ice cream or unknown item
                    idsToDelete.push(item.id);
                }
            });

            // 6. NUCLEAR CLOUD CLEANUP
            const uniqueIdsToDelete = [...new Set(idsToDelete)];
            if (uniqueIdsToDelete.length > 0) {
                const chunkSize = 100;
                for (let i = 0; i < uniqueIdsToDelete.length; i += chunkSize) {
                    await supabase.from('catalog').delete().in('id', uniqueIdsToDelete.slice(i, i + chunkSize));
                }
            }

            // 7. RESTORE OFFICIAL DATA
            const cloudUpsertData = cleanCatalog.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                price: Number(p.price) || 0,
                quantity: Number(p.quantity) || 0,
                min_stock: Number(p.min_stock || p.minStock) || 5,
                cc: Number(p.cc) || 0,
                pack_units: Number(p.pack_units || p.packUnits) || 1,
                barcode: p.barcode || '',
                image: p.image || '',
                bonus_points: Number(p.bonus_points || p.bonusPoints) || 0,
                points_earned_ratio: p.points_earned_ratio !== undefined ? p.points_earned_ratio : (p.pointsEarnedRatio !== undefined ? p.pointsEarnedRatio : 1),
                point_cost: Number(p.point_cost || p.pointCost) || 0
            }));

            const { error: upsertErr } = await supabase.from('catalog').upsert(cloudUpsertData);
            if (upsertErr) throw upsertErr;

            // 8. FINAL SYNC
            localStorage.removeItem('seitu_catalog');
            setCatalog(cleanCatalog);

            alert(`✅ RECUPERACIÓN TOTAL COMPLETADA:\n\n- Los Conos han sido restaurados con sus precios.\n- Se han preservado los precios de los Almendrados.\n- Catálogo sincronizado.`);
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert("Error en recuperación: " + e.message);
        } finally {
            setLoading(false);
            if (btn) btn.innerText = "🛠️ Reparar Catálogo";
        }
    };
    const exportData = () => {
        const data = {};
        // Collect all keys starting with seitu_
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('seitu_')) {
                const val = localStorage.getItem(key);
                try {
                    data[key] = JSON.parse(val);
                } catch (e) {
                    data[key] = val; // Store as raw string if not JSON
                }
            }
        });
        return JSON.stringify(data, null, 2);
    };

    const importData = (jsonString) => {
        try {
            const data = JSON.parse(jsonString);
            // Basic validation: check if it looks like our data
            if (!data || typeof data !== 'object') throw new Error("Invalid format");

            // Restore keys
            Object.keys(data).forEach(key => {
                if (key.startsWith('seitu_')) {
                    safeStorageSet(key, JSON.stringify(data[key]));
                }
                // LEGACY SUPPORT: Map old keys to new 'seitu_' keys
                else {
                    const legacyMap = {
                        'sessions': 'seitu_sessions',
                        'cashCuts': 'seitu_cash_cuts', // Very important for recovery
                        'sales': 'seitu_sales',
                        'purchases': 'seitu_purchases',
                        'customers': 'seitu_customers',
                        'catalog': 'seitu_catalog',
                        'expenses': 'seitu_expenses',
                        'stockLogs': 'seitu_stock_logs',
                        'categories': 'seitu_categories',
                        'debts': 'seitu_debts',
                        'employees': 'seitu_employees',
                        'recurringExpenses': 'seitu_recurring_expenses',
                        'envelopes': 'seitu_envelopes',
                        'rewards': 'seitu_rewards',
                        'activeSession': 'seitu_active_session' // IMPORTANT: Current open shift
                    };
                    if (legacyMap[key]) {
                        console.log(`♻️ Mapping legacy key: ${key} -> ${legacyMap[key]}`);
                        safeStorageSet(legacyMap[key], JSON.stringify(data[key]));
                    }
                }
            });
            window.location.reload(); // Reload to apply changes
            return { success: true };
        } catch (e) {
            console.error("Import failed", e);
            return { success: false, error: e.message };
        }
    };

    const purgeOldData = (monthsToKeep) => {
        try {
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
            const cutoffTime = cutoffDate.getTime();

            let deletedCount = 0;

            // 1. Filter Sales
            const initialSales = sales.length;
            const newSales = sales.filter(s => new Date(s.timestamp).getTime() > cutoffTime);
            deletedCount += (initialSales - newSales.length);
            setSales(newSales);
            safeStorageSet(STORAGE_KEYS.SALES, JSON.stringify(newSales));

            // 2. Filter Sessions
            const initialSessions = sessions.length;
            // Only remove ENDED sessions. Keep active ones.
            const newSessions = sessions.filter(s => !s.endedAt || new Date(s.endedAt).getTime() > cutoffTime);
            deletedCount += (initialSessions - newSessions.length);
            setSessions(newSessions);
            safeStorageSet('seitu_sessions', JSON.stringify(newSessions));

            // 3. Filter Expenses
            const initialExpenses = expenses.length;
            const newExpenses = expenses.filter(e => new Date(e.timestamp).getTime() > cutoffTime);
            deletedCount += (initialExpenses - newExpenses.length);
            setExpenses(newExpenses);
            safeStorageSet('seitu_expenses', JSON.stringify(newExpenses));

            // 4. Filter Purchases (Stock history)
            const initialPurchases = purchases.length;
            const newPurchases = purchases.filter(p => new Date(p.timestamp).getTime() > cutoffTime);
            deletedCount += (initialPurchases - newPurchases.length);
            setPurchases(newPurchases);
            safeStorageSet(STORAGE_KEYS.PURCHASES, JSON.stringify(newPurchases));

            // 5. Filter Stock Logs
            const initialLogs = stockLogs.length;
            const newLogs = stockLogs.filter(l => new Date(l.timestamp).getTime() > cutoffTime);
            deletedCount += (initialLogs - newLogs.length);
            setStockLogs(newLogs);
            safeStorageSet('seitu_stock_logs', JSON.stringify(newLogs));

            return { success: true, count: deletedCount };
        } catch (e) {
            console.error(e);
            return { success: false, error: e.message };
        }
    };

    const addAuditEntry = (action, details, user) => {
        const fullUser = user || activeSession?.cashier || localStorage.getItem('seitu_user') || 'Admin';

        const newEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action,
            details,
            user: fullUser
        };

        setAuditLog(prev => {
            const newLog = [newEntry, ...prev].slice(0, 1000);
            safeStorageSet('seitu_audit_log', JSON.stringify(newLog));
            return newLog;
        });

        if (supabase) {
            supabase.from('audit_logs').insert([formatAuditLogForCloud(newEntry)]).then(({ error }) => {
                if (error) console.error('Audit log sync error:', error);
            });
        }
    };

    // --- REALTIME SUBSCRIPTION FOR PALOMA 15 ---
    useEffect(() => {
        if (!supabase) return;

        // Suscribirse a cambios en la tabla 'settings' para el evento
        const channel = supabase
            .channel('event-paloma-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'settings',
                    filter: `id=eq.event_paloma15`
                },
                (payload) => {
                    if (payload.new && payload.new.configuration && payload.new.configuration.posts) {
                        console.log('⚡ [Realtime] Actualización del evento recibida!');
                        const newPosts = payload.new.configuration.posts;
                        setEventPostsPaloma(newPosts);
                        localStorage.setItem('seitu_event_paloma', JSON.stringify(newPosts));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getStorageUsage = () => {
        let total = 0;
        for (let x in localStorage) {
            if (localStorage.hasOwnProperty(x)) {
                total += (localStorage[x].length * 2); // charCode is 2 bytes
            }
        }
        const totalMB = (total / (1024 * 1024)).toFixed(2);
        // localStorage limit is usually around 5-10MB. We'll assume 5MB for the warning threshold.
        const limitMB = 5;
        const percentage = Math.min((totalMB / limitMB) * 100, 100).toFixed(0);
        return { totalMB, percentage, isCritical: percentage > 80 };
    };

    // --- FINANCE MANAGEMENT ---
    const addDebt = async (debtData) => {
        const newDebt = {
            ...debtData,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            payments: []
        };
        const newDebts = [...debts, newDebt];
        setDebts(newDebts);
        safeStorageSet('seitu_debts', JSON.stringify(newDebts));

        if (supabase) {
            const { error } = await supabase.from('debts').upsert(formatDebtForCloud(newDebt));
            if (error) console.error("Error syncing debt:", error);
        }

        addAuditEntry('DEBT_CREATED', `Deuda nueva: ${debtData.provider} (${debtData.details || 'Sin detalle'}) ($${debtData.total})`);
    };

    const addDebtPayment = async (debtId, paymentData) => {
        let updatedDebt = null;
        const updatedDebts = debts.map(d => {
            if (d.id === debtId) {
                const newPayment = {
                    id: Date.now().toString(),
                    date: new Date().toISOString(),
                    cashier: activeSession?.cashier || 'S/N',
                    sessionId: activeSession?.id || 'S/N',
                    ...paymentData
                };
                updatedDebt = { ...d, payments: [...d.payments, newPayment] };
                return updatedDebt;
            }
            return d;
        });

        if (!updatedDebt) return;

        setDebts(updatedDebts);
        safeStorageSet('seitu_debts', JSON.stringify(updatedDebts));

        // Sync to Supabase
        if (supabase && updatedDebt) {
            const { error } = await supabase.from('debts').upsert(formatDebtForCloud(updatedDebt));
            if (error) console.error("Error syncing payment update:", error);
        }

        if (paymentData.fromRegister) {
            addExpense({
                amount: Number(paymentData.amount),
                description: `Pago Prov: ${updatedDebt.provider} (${updatedDebt.invoice || 'S/N'})`,
                method: paymentData.method || 'efectivo'
            });
        }

        addAuditEntry('PAYMENT_ADDED', `Pago de $${paymentData.amount} a ${updatedDebt.provider} (Método: ${paymentData.method})`);

        // If paid from envelopes, deduct from the specific envelope
        if (paymentData.paymentSource === 'sobres' && paymentData.envelopeId) {
            useEnvelopeBalance(
                paymentData.envelopeId,
                paymentData.amount,
                `Pago Prov: ${debts.find(d => d.id === debtId)?.provider || 'S/N'}`
            );
        }
    };

    // --- ENVELOPE MANAGEMENT ---
    const addToEnvelope = async (name, amount, cashier) => {
        const amountNum = Number(amount);
        if (amountNum <= 0) return;

        let updatedEnvelope = null;
        const updatedEnvelopes = [...envelopes];
        const existingIdx = updatedEnvelopes.findIndex(e => e.name.toLowerCase() === name.toLowerCase() && e.status !== 'deposited');

        const historyEntry = {
            id: `${Date.now()}-${Math.random().toString().slice(2)}`,
            date: new Date().toISOString(),
            amount: amountNum,
            type: 'entry',
            description: 'Depósito desde caja',
            user: cashier || activeSession?.cashier || 'Sistema'
        };

        if (existingIdx !== -1) {
            updatedEnvelope = {
                ...updatedEnvelopes[existingIdx],
                balance: updatedEnvelopes[existingIdx].balance + amountNum,
                history: [...updatedEnvelopes[existingIdx].history, historyEntry]
            };
            updatedEnvelopes[existingIdx] = updatedEnvelope;
        } else {
            updatedEnvelope = {
                id: Date.now().toString(),
                name: name,
                balance: amountNum,
                status: 'active',
                history: [historyEntry]
            };
            updatedEnvelopes.push(updatedEnvelope);
        }

        setEnvelopes(updatedEnvelopes);
        safeStorageSet('seitu_envelopes', JSON.stringify(updatedEnvelopes));

        if (supabase && updatedEnvelope) {
            await supabase.from('envelopes').upsert(formatEnvelopeForCloud(updatedEnvelope));
        }

        addAuditEntry('ENVELOPE_ENTRY', `Ingreso de $${amountNum} a sobre: ${name}`);
    };

    const useEnvelopeBalance = async (id, amount, description, user) => {
        const amountNum = Number(amount);
        let updatedEnvelope = null;
        const updatedEnvelopes = envelopes.map(e => {
            if (e.id === id) {
                const historyEntry = {
                    id: `${Date.now()}-${Math.random().toString().slice(2)}`,
                    date: new Date().toISOString(),
                    amount: amountNum,
                    type: 'exit',
                    description: description,
                    user: user || activeSession?.cashier || 'Sistema'
                };
                updatedEnvelope = {
                    ...e,
                    balance: e.balance - amountNum,
                    history: [...e.history, historyEntry]
                };
                return updatedEnvelope;
            }
            return e;
        });

        if (!updatedEnvelope) return;

        setEnvelopes(updatedEnvelopes);
        safeStorageSet('seitu_envelopes', JSON.stringify(updatedEnvelopes));

        if (supabase) {
            await supabase.from('envelopes').upsert(formatEnvelopeForCloud(updatedEnvelope));
        }

        addAuditEntry('ENVELOPE_EXIT', `Retiro de $${amountNum} de sobre: ${updatedEnvelope.name} (${description})`);
    };

    const markEnvelopesAsDeposited = async (ids, user) => {
        const updatedEnvelopes = envelopes.map(e => {
            if (ids.includes(e.id)) {
                return { ...e, status: 'deposited' };
            }
            return e;
        });
        setEnvelopes(updatedEnvelopes);
        safeStorageSet('seitu_envelopes', JSON.stringify(updatedEnvelopes));

        if (supabase) {
            const depositedEnvelopes = updatedEnvelopes.filter(e => ids.includes(e.id));
            const { error } = await supabase.from('envelopes').upsert(depositedEnvelopes.map(formatEnvelopeForCloud));
            if (error) console.error("Error syncing deposited envelopes:", error);
        }

        addAuditEntry('ENVELOPE_DEPOSITED', `Se marcaron como depositados ${ids.length} sobres`, user);
    };

    const deleteDebt = async (id) => {
        const debt = debts.find(d => d.id === id);
        const newDebts = debts.filter(d => d.id !== id);
        setDebts(newDebts);
        safeStorageSet('seitu_debts', JSON.stringify(newDebts));

        if (supabase) {
            const { error } = await supabase.from('debts').delete().eq('id', id);
            if (error) console.error("Error deleting debt from cloud:", error);
        }

        if (debt) {
            addAuditEntry('DEBT_DELETED', `Eliminación de deuda: ${debt.provider} ($${debt.total})`);
        }
    };

    const addEmployee = (name) => {
        const newEmployee = {
            id: Date.now().toString(),
            name,
            active: true,
            records: []
        };
        const newEmployees = [...employees, newEmployee];
        setEmployees(newEmployees);
        safeStorageSet('seitu_employees', JSON.stringify(newEmployees));
    };

    const addEmployeeRecord = async (employeeId, recordData) => {
        let updatedEmployee = null;
        setEmployees(prevEmployees => {
            const updatedEmployees = prevEmployees.map(e => {
                if (e.id === employeeId) {
                    const newRecord = {
                        id: Date.now().toString(),
                        date: new Date().toISOString(),
                        ...recordData,
                        cashier: activeSession?.cashier || 'Sistema'
                    };

                    if (newRecord.fromRegister && (newRecord.type === 'adelanto' || newRecord.type === 'sueldo')) {
                        if (newRecord.paymentSource === 'sobres' && newRecord.envelopeId) {
                            useEnvelopeBalance(newRecord.envelopeId, newRecord.amount, `Pago Personal: ${e.name} (${newRecord.type})`);
                        } else {
                            addExpense({
                                amount: Number(newRecord.amount),
                                description: `Personal: ${e.name} (${newRecord.type})`,
                                method: 'efectivo'
                            });
                        }
                    }

                    addAuditEntry('EMPLOYEE_RECORD', `Movimiento personal (${newRecord.type}): ${e.name} ($${newRecord.amount})`);
                    updatedEmployee = { ...e, records: [...e.records, newRecord] };
                    return updatedEmployee;
                }
                return e;
            });
            safeStorageSet('seitu_employees', JSON.stringify(updatedEmployees));

            if (supabase && updatedEmployee) {
                supabase.from('employees').upsert({
                    id: updatedEmployee.id,
                    name: updatedEmployee.name,
                    active: updatedEmployee.active,
                    records: updatedEmployee.records
                }).then(({ error }) => {
                    if (error) console.error("Error syncing employee record:", error);
                });
            }

            return updatedEmployees;
        });
    };

    const resetEmployeeLedger = (id, cashier) => {
        setEmployees(prev => {
            const emp = prev.find(e => e.id === id);
            if (!emp) return prev;

            const balance = emp.records.reduce((sum, r) => {
                if (r.type === 'adelanto' || r.type === 'retiro') return sum + Number(r.amount);
                if (r.type === 'sueldo') return sum - Number(r.amount);
                return sum;
            }, 0);

            const updated = prev.map(e => (e.id === id ? { ...e, records: [] } : e));
            safeStorageSet('seitu_employees', JSON.stringify(updated));
            addAuditEntry('EMPLOYEE_RESET', `Reseteo mensual de ${emp.name}. Saldo final borrado: $${balance}`, cashier);
            return updated;
        });
        return true;
    };

    const deleteEmployee = (id) => {
        const newEmployees = employees.filter(e => e.id !== id);
        setEmployees(newEmployees);
        safeStorageSet('seitu_employees', JSON.stringify(newEmployees));
        if (supabase) {
            supabase.from('employees').delete().eq('id', id).then(({ error }) => {
                if (error) console.error("Error deleting employee from cloud:", error);
            });
        }
    };

    const updateEmployee = async (id, updates) => {
        let updatedEmployee = null;
        setEmployees(prev => {
            const updatedEmployees = prev.map(e => {
                if (e.id === id) {
                    updatedEmployee = { ...e, ...updates };
                    return updatedEmployee;
                }
                return e;
            });
            safeStorageSet('seitu_employees', JSON.stringify(updatedEmployees));

            if (supabase && updatedEmployee) {
                supabase.from('employees').upsert({
                    id: updatedEmployee.id,
                    name: updatedEmployee.name,
                    active: updatedEmployee.active,
                    records: updatedEmployee.records,
                    profile: updatedEmployee.profile || {}
                }).then(({ error }) => {
                    if (error) console.error("Error syncing employee update:", error);
                });
            }
            return updatedEmployees;
        });
    };

    const addRecurringExpense = (expenseData) => {
        const newEx = {
            ...expenseData,
            id: Date.now().toString()
        };
        const newExpenses = [...recurringExpenses, newEx];
        setRecurringExpenses(newExpenses);
        safeStorageSet('seitu_recurring_expenses', JSON.stringify(newExpenses));
    };

    const deleteRecurringExpense = (id) => {
        const newExpenses = recurringExpenses.filter(e => e.id !== id);
        setRecurringExpenses(newExpenses);
        safeStorageSet('seitu_recurring_expenses', JSON.stringify(newExpenses));
    };

    // --- SESSION MANAGEMENT ---
    const deleteSession = async (sessionId) => {
        try {
            // 1. Local Delete
            const newSessions = sessions.filter(s => s.id !== sessionId);
            setSessions(newSessions);
            safeStorageSet('seitu_sessions', JSON.stringify(newSessions));

            // 2. Cloud Delete (Supabase)
            const { error } = await supabase
                .from('sessions')
                .delete()
                .eq('id', sessionId);

            if (error) {
                console.error("[Sync] Error deleting session from cloud:", error);
                // We keep local delete anyway, or should we warn?
                // For "Super User" cleanup, local delete is priority.
            } else {
                console.log("[Sync] Session deleted from cloud:", sessionId);
            }

            // 3. Audit
            addAuditEntry('SESSION_DELETE', `Turno eliminado: ${sessionId}`);
            return { success: true };

        } catch (e) {
            console.error("Delete Session Error:", e);
            return { success: false, error: e.message };
        }
    };

    // --- SALES MANAGEMENT ---
    const updateSalePaymentMethod = (saleId, newPaymentMethod, reason, user, overrides = null) => {
        const saleIndex = sales.findIndex(s => s.id === saleId);
        if (saleIndex === -1) {
            console.error('Sale not found:', saleId);
            return { success: false, error: 'Venta no encontrada' };
        }

        const sale = sales[saleIndex];
        const oldPaymentMethod = sale.paymentMethod;

        // No cambiar si es el mismo método
        if (oldPaymentMethod === newPaymentMethod) {
            return { success: false, error: 'El método de pago es el mismo' };
        }

        // Crear copia actualizada de la venta
        const updatedSale = {
            ...sale,
            paymentMethod: newPaymentMethod,
            ...(overrides || {})
        };

        // Si NO hay overrides y el cambio es entre métodos simples, actualizar montos automáticamente
        if (!overrides && oldPaymentMethod !== 'mixto' && newPaymentMethod !== 'mixto') {
            const totalAmount = sale.totalAmount || 0;

            // Resetear todos los montos
            updatedSale.cashReceived = 0;
            updatedSale.cardReceived = 0;
            updatedSale.transferReceived = 0;

            // Asignar el total al nuevo método
            if (newPaymentMethod === 'efectivo') {
                updatedSale.cashReceived = totalAmount;
            } else if (newPaymentMethod === 'tarjeta') {
                updatedSale.cardReceived = totalAmount;
            } else if (newPaymentMethod === 'transferencia') {
                updatedSale.transferReceived = totalAmount;
            }
        }

        // Actualizar el array de ventas
        const updatedSales = [...sales];
        updatedSales[saleIndex] = updatedSale;
        setSales(updatedSales);
        safeStorageSet(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

        // Sincronizar actualización a la nube
        if (supabase) {
            supabase.from('sales').upsert(formatSaleForCloud(updatedSale)).then(({ error }) => {
                if (error) console.error('Error syncing sale update:', error);
            });
        }

        // Registrar en auditoría con detalle de montos
        const amountDetail = `($${updatedSale.cashReceived || 0} Ef, $${updatedSale.cardReceived || 0} Tar, $${updatedSale.transferReceived || 0} Tra)`;
        addAuditEntry(
            'PAYMENT_METHOD_CHANGED',
            `Venta #${sale.orderNumber || saleId.slice(-4)}: ${oldPaymentMethod} → ${newPaymentMethod} ${amountDetail}. Motivo: ${reason}. Total: $${sale.totalAmount}`,
            user || activeSession?.cashier || 'Sistema'
        );

        return { success: true };
    };

    const toggleSaleVerified = (saleId) => {
        const saleIndex = sales.findIndex(s => s.id === saleId);
        if (saleIndex === -1) return { success: false, error: 'Venta no encontrada' };

        const updatedSales = [...sales];
        const updatedSale = {
            ...updatedSales[saleIndex],
            verified: !updatedSales[saleIndex].verified
        };
        updatedSales[saleIndex] = updatedSale;

        setSales(updatedSales);
        safeStorageSet(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

        // Sincronizar verificación a la nube
        if (supabase) {
            supabase.from('sales').upsert(formatSaleForCloud(updatedSale)).then(({ error }) => {
                if (error) console.error('Error syncing verification:', error);
            });
        }
        return { success: true };
    };

    const updateSaleFiscalData = (saleId, fiscalData) => {
        const saleIndex = sales.findIndex(s => s.id === saleId);
        if (saleIndex === -1) return;

        const updatedSales = [...sales];
        const updatedSale = {
            ...updatedSales[saleIndex],
            fiscalData,
            isFiscal: true,
            fiscalDate: new Date().toISOString()
        };
        updatedSales[saleIndex] = updatedSale;

        setSales(updatedSales);
        safeStorageSet(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));

        if (supabase) {
            supabase.from('sales').upsert(formatSaleForCloud(updatedSale)).then(({ error }) => {
                if (error) console.error('Error syncing fiscal data:', error);
            });
        }
    };

    const bulkUpdatePointsRatio = async (ids, ratio) => {
        if (!supabase) return;
        setLoading(true);
        try {
            console.log(`Updating ratio to ${ratio} for ${ids.length} items...`);

            // 1. Bulk Update in Supabase
            const { error } = await supabase
                .from('catalog')
                .update({ points_earned_ratio: ratio })
                .in('id', ids);

            if (error) throw error;

            console.log("Supabase update success. Reloading data...");

            // 2. Reload Data
            if (typeof loadData === 'function') {
                await loadData();
            } else {
                console.warn('loadData not found, forcing reload');
                window.location.reload();
                return;
            }
            alert(`✅ Se actualizaron ${ids.length} productos a Ratio x${ratio}.`);
        } catch (err) {
            console.error("Error updating points:", err);
            alert("Error al actualizar puntos: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file) => {
        if (!file) return null;
        try {
            // Create unique filename: timestamp_random.ext
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
                .from('posts')
                .upload(filePath, file);

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error al subir imagen: ' + error.message);
            return null;
        }
    };

    const addStaffUser = async (name, password) => {
        const newUser = { id: crypto.randomUUID(), name, password };
        setStaffUsers(prev => {
            const up = [...prev, newUser];
            safeStorageSet('seitu_staff_users', JSON.stringify(up));
            return up;
        });
        if (supabase) {
            const { error } = await supabase.from('staff_users').insert(newUser);
            if (error) console.error('Error adding staff:', error);
        }
    };

    const deleteStaffUser = async (id) => {
        setStaffUsers(prev => {
            const up = prev.filter(u => u.id !== id);
            safeStorageSet('seitu_staff_users', JSON.stringify(up));
            return up;
        });
        if (supabase) {
            const { error } = await supabase.from('staff_users').delete().eq('id', id);
            if (error) console.error('Error deleting staff:', error);
        }
    };

    return {
        purchases,
        sales,
        catalog,
        categories,
        addCategory,
        removeCategory,
        cashCuts,
        sessions,
        activeSession,
        updateActiveSession,
        expenses,
        clearHistory, // Export new function
        stockLogs,
        addToCatalog,
        updateCatalogItem,
        updateWholeCatalog,
        clearAllImages,
        removeFromCatalog,
        addPurchase,
        addSale,
        addCashCut,
        openSession,
        closeSession,
        addExpense,
        updateExpense,
        restoreDefaultCatalog,
        getCurrentSessionSales,
        getCurrentSessionExpenses,
        updateProductSettings,
        updateGlobalSettings,
        settings, // Export settings to read global config
        inventory: getInventory(),
        adjustStock,
        bulkAdjustStock,
        loading,
        exportData,
        importData,
        purgeOldData,
        debts,
        addDebt,
        addDebtPayment,
        deleteDebt,
        employees,
        addEmployee,
        addEmployeeRecord,
        deleteEmployee,
        updateEmployee,
        resetEmployeeLedger,
        recurringExpenses,
        addRecurringExpense,
        deleteRecurringExpense,
        auditLog,
        addAuditEntry,
        deleteSession,
        updateSalePaymentMethod,
        toggleSaleVerified,
        updateSaleFiscalData,
        envelopes,
        addToEnvelope,
        useEnvelopeBalance,
        markEnvelopesAsDeposited,
        getStorageUsage,
        checkSessionStatus,
        updateSessionCash: updateActiveSession,
        // --- CUSTOMERS ---
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addPointsToCustomer,
        // --- REWARDS ---
        rewards,
        addReward,
        updateReward,
        deleteReward,
        uploadImage,
        bulkUpdatePointsRatio,
        loadData,
        factoryReset,

        deleteExpense,
        deleteSale,

        theme,

        toggleTheme,
        isSyncing,
        syncFromCloud,
        iceCreamStock,
        iceCreamLogs,
        updateIceCreamStock,
        bulkUpdateIceCreamStock,
        staffUsers,
        addStaffUser,
        deleteStaffUser,
        deleteStockSession,
        applyStockSession,
        socialLinks,
        landingPosts,
        updateSocialLinks,
        updateLandingPosts,
        promoBanner,
        updatePromoBanner,
        eventPostsPaloma,
        addEventPostPaloma,
        updateEventPostPaloma,
        deleteEventPostPaloma,
        autoApprovePaloma,
        setPalomaAutoApprove,
        clearEventPalomaData,
        eventPostsMartina,
        addEventPostMartina,
        updateEventPostMartina,
        deleteEventPostMartina,
        autoApproveMartina,
        setMartinaAutoApprove,
        clearEventMartinaData,
        fixCatalogNames,
        forceSyncSessions,
    };
}

export function StoreProvider({ children }) {
    const store = useStoreSource();
    return (
        <StoreContext.Provider value={{
            ...store,
            theme: store.theme,
            toggleTheme: store.toggleTheme
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error("useStore must be used within a StoreProvider");
    }
    return context;
}
