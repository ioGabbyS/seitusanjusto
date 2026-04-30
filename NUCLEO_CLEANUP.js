
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qoxmjecahsauiccpmksa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFveG1qZWNhaHNhdWljY3Bta3NhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTkwMDQzNiwiZXhwIjoyMDg1NDc2NDM2fQ.mBUAkrNAeOX3dV-7frOryN7EZI7GjM0wygsvNwXUofw';
const supabase = createClient(supabaseUrl, supabaseKey);

const OFFICIAL_CATEGORIES = [
    "IMPULSIVOS", "BALDES Y POTES", "LINEA HOGAREÑA", "TORTAS", "LIBRES DE GLUTEN", "ESTUCHADOS",
    "CAFETERÍA", "PIZZA Y BEBIDAS", "POSTRES", "PROMOS CAFETERÍA", "PERSONALIZADOS",
    "INSUMOS (BOLSAS, VASOS, CUCHARAS)", "LACTEOS"
];

async function hyperScrub() {
    console.log("🚀 INICIANDO SUPER LIMPIEZA...");

    const { data: catalog, error } = await supabase.from('catalog').select('*');
    if (error) {
        console.error("Error al leer catalogo:", error);
        return;
    }

    // 1. Borrar CUALQUIER producto cuya categoría no sea oficial
    const rogueCategoryItems = catalog.filter(item => !OFFICIAL_CATEGORIES.includes(item.category)).map(p => p.id);

    // 2. Borrar duplicados por ID (los que empiezan con init- y son helados)
    const initIceCreamItems = catalog.filter(item => {
        const idStr = item.id?.toString() || '';
        const name = item.name.toUpperCase();
        const isInitId = idStr.startsWith('init-');
        const isHelado = ["IMPULSIVOS", "BALDES Y POTES", "TORTAS", "LINEA HOGAREÑA", "LIBRES DE GLUTEN"].includes(item.category) ||
            name.includes('CONO') || name.includes('PALITO') || name.includes('BALDE');
        return isInitId && isHelado;
    }).map(p => p.id);

    const idsToDelete = [...new Set([...rogueCategoryItems, ...initIceCreamItems])];

    console.log(`🧹 Borrando ${idsToDelete.length} productos (Categorias viejas + Duplicados init-).`);

    if (idsToDelete.length > 0) {
        for (let i = 0; i < idsToDelete.length; i += 50) {
            const chunk = idsToDelete.slice(i, i + 50);
            await supabase.from('catalog').delete().in('id', chunk);
        }
    }

    // 3. Resetear TODO el stock a 0 para corregir inflaciones
    const { data: final } = await supabase.from('catalog').select('id');
    if (final && final.length > 0) {
        console.log(`♻️ Reseteando stock de ${final.length} productos...`);
        const reset = final.map(i => ({ id: i.id, quantity: 0 }));
        await supabase.from('catalog').upsert(reset);
    }

    console.log("✅ SISTEMA PURIFICADO.");
}

hyperScrub();
