import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Wrench, Check, AlertTriangle, RefreshCw } from 'lucide-react';

export default function CatalogFixer() {
    const { fixCatalogNames } = useStore();
    const [fixing, setFixing] = useState(false);

    const handleFix = async () => {
        setFixing(true);
        try {
            await fixCatalogNames();
        } catch (e) {
            console.error(e);
        } finally {
            setFixing(false);
        }
    };

    return (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <Wrench size={20} /> Reparación de Catálogo y Precios
            </h3>
            <p className="text-sm text-indigo-700 mb-4">
                Esta herramienta hace dos cosas:
                <br />1. <strong>Fusión de Duplicados</strong>: Une productos repetidos (ej: "Palito Uva" y "PALITO UVA") sumando su stock.
                <br />2. <strong>Recuperación de Precios</strong>: Si un producto tiene precio $0, intenta restaurar su precio oficial desde la base de datos original.
            </p>

            <button
                onClick={handleFix}
                disabled={fixing}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center"
            >
                {fixing ? <RefreshCw className="animate-spin" size={18} /> : <Wrench size={18} />}
                {fixing ? 'Reparando Catálogo...' : 'REPARAR TODO (Duplicados y Precios $0)'}
            </button>
            <p className="text-[10px] text-indigo-400 mt-2">
                Esta acción es segura. Solo afecta el catálogo, no borra ventas ni historial.
            </p>
        </div>
    );
}
