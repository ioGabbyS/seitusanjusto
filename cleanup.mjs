
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env.local');

let envConfig = {};
try {
    envConfig = dotenv.parse(fs.readFileSync(envPath));
} catch (e) {
    console.error('❌ No se encontró .env.local');
    process.exit(1);
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan las credenciales de Supabase en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDuplicates() {
    console.log('🧹 Iniciando limpieza inteligente de duplicados (por Nombre y Código)...');

    // 1. Obtener todo el catálogo
    const { data: products, error } = await supabase
        .from('catalog')
        .select('*');

    if (error) {
        console.error('❌ Error al leer catálogo:', error);
        return;
    }

    console.log(`📦 Total productos: ${products.length}`);

    // Agrupar por nombre normalizado (para detectar Palitos duplicados)
    const groups = {};

    products.forEach(p => {
        // Normalizar nombre: quitar acentos, mayúsculas, espacios extra
        // "Palito de Agua Uva" -> "PALITODEAGUAUVA"
        const normName = p.name.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");

        // Clave única
        const key = `NAME:${normName}`; // (Ignoro código de barras porque a veces uno tiene y otro no)

        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
    });

    let deletedCount = 0;
    let mergedCount = 0;

    for (const key in groups) {
        const group = groups[key];
        if (group.length > 1) {
            console.log(`\n🔍 Grupo Duplicado encontrado (${key}): ${group.length} items`);

            // Estrategia de fusión:
            // 1. Priorizar Categoría OFICIAL ("PALITOS DE AGUA", "PALITOS DE CREMA", etc)
            // 2. Si no, el que tiene Stock > 0
            // 3. Si no, el que tiene Precio > 0

            group.sort((a, b) => {
                // Prioridad Categoría Oficial
                const cats = ["PALITOS DE AGUA", "PALITOS DE CREMA", "PALITOS BOMBON", "ALFAJOR HELADO", "BALDES", "POSTRES"];
                const aCat = cats.includes(a.category) ? 1 : 0;
                const bCat = cats.includes(b.category) ? 1 : 0;
                if (aCat !== bCat) return bCat - aCat;

                // Prioridad Stock Mayor
                if (b.quantity !== a.quantity) return b.quantity - a.quantity;

                // Prioridad Precio Mayor
                if (b.price !== a.price) return b.price - a.price;

                return 0;
            });

            const winner = group[0];
            const losers = group.slice(1);

            console.log(`   ✅ Ganador: "${winner.name}" (Cat: ${winner.category}) - Stock: ${winner.quantity} - Precio: $${winner.price}`);

            // Fusionar datos
            let needsUpdate = false;

            for (const loser of losers) {
                console.log(`   ❌ Eliminando: "${loser.name}" (Cat: ${loser.category}) - Stock: ${loser.quantity} - Precio: $${loser.price}`);

                // Si el ganador no tiene precio y el perdedor sí, copiarlo
                if ((!winner.price || winner.price === 0) && loser.price > 0) {
                    winner.price = loser.price;
                    needsUpdate = true;
                    console.log(`      💰 Precio recuperado: $${loser.price}`);
                }

                // Sumar stock si el perdedor tiene stock positivo
                if (loser.quantity > 0) {
                    winner.quantity += loser.quantity;
                    needsUpdate = true;
                    console.log(`      📦 Stock sumado: +${loser.quantity} -> Total: ${winner.quantity}`);
                }

                // Recuperar Código de Barras si falta
                if ((!winner.barcode || winner.barcode.length < 5) && loser.barcode && loser.barcode.length > 5) {
                    winner.barcode = loser.barcode;
                    needsUpdate = true;
                    console.log(`      🔢 Código recuperado: ${loser.barcode}`);
                }

                // Recuperar imagen si falta
                if (!winner.image && loser.image) {
                    winner.image = loser.image;
                    needsUpdate = true;
                }
            }

            // Actualizar Ganador
            if (needsUpdate) {
                const { error: updError } = await supabase.from('catalog').upsert(winner);
                if (updError) console.error('Error update:', updError);
                else {
                    console.log(`   💾 Ganador actualizado.`);
                    mergedCount++;
                }
            }

            // Borrar Perdedores
            const loserIds = losers.map(l => l.id);
            const { error: delError } = await supabase.from('catalog').delete().in('id', loserIds);

            if (delError) console.error('Error delete:', delError);
            else deletedCount += loserIds.length;
        }
    }

    console.log(`\n🎉 Limpieza finalizada.`);
    console.log(`   - Grupos fusionados: ${mergedCount}`);
    console.log(`   - Productos eliminados: ${deletedCount}`);
}

cleanDuplicates();
