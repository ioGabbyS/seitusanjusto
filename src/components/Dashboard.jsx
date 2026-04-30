import { TrendingUp, AlertTriangle, Package, BarChart3 } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';

export default function Dashboard({ inventory, sales }) {
    const { theme } = useStore();
    const isDark = theme === 'dark';

    // 1. Calculate Top Sellers
    const topSellers = Object.values(inventory)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5)
        .filter(item => item.totalSold > 0);

    // 2. Low Stock Alerts (Dynamic)
    const lowStock = Object.values(inventory).filter(item => item.quantity < item.minStock);

    const data = topSellers.map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        sold: item.totalSold
    }));

    return (
        <div className="space-y-6 transition-colors duration-500">
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Productos</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{Object.keys(inventory).length}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Stock Bajo</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{lowStock.length}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ventas Totales</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {sales.reduce((acc, sale) => acc + sale.items.reduce((s, i) => s + Number(i.quantity), 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 h-96">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Más Vendidos</h3>
                        {data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                                        interval={0}
                                        axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                                    />
                                    <YAxis
                                        tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
                                        axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: isDark ? '#0f172a' : '#fff',
                                            borderColor: isDark ? '#1e293b' : '#e2e8f0',
                                            color: isDark ? '#fff' : '#000'
                                        }}
                                        itemStyle={{ color: isDark ? '#fff' : '#000' }}
                                    />
                                    <Bar dataKey="sold" fill="#38bdf8" radius={[4, 4, 0, 0]}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#0ea5e9' : '#38bdf8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                                No hay datos de ventas aún
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-500" />
                        Atención: Stock Bajo
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {lowStock.length > 0 ? (
                            lowStock.map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">{item.name}</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-500">{item.category}</p>
                                    </div>
                                    <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded text-sm">
                                        Queda: {item.quantity}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-slate-400 dark:text-slate-600 text-center py-8">Todo en orden</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
