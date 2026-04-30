import React, { useState, useEffect } from 'react';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, Save, ArrowRight, Lock, User, Star, X, Gift, Edit } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { printTicket } from '../utils/ticketPrinter';
import { formatCurrency, parseCurrency, normalize } from '../utils/formatters';
import { afipService } from '../utils/afipService';

export default function POS() {
    const {
        inventory,
        addSale,
        activeSession,
        customers,
        rewards,
        employees,
        addEmployeeRecord,
        updateSaleFiscalData,
        loading,
        loadData
    } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCatalogTab, setActiveCatalogTab] = useState('products'); // 'products' or 'rewards'
    const [cart, setCart] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    // Amount given by customer or mixed cash part (Stored as string with dots)
    const [cashAmount, setCashAmount] = useState('');
    const [cardAmount, setCardAmount] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [observations, setObservations] = useState('');

    // Customer State
    const [customerMode, setCustomerMode] = useState('club'); // 'club' or 'guest'
    const [guestName, setGuestName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerResults, setShowCustomerResults] = useState(false);
    const [pointsToRedeem, setPointsToRedeem] = useState(0);

    const [shouldInvoiceFiscal, setShouldInvoiceFiscal] = useState(false);
    const [isInvoicing, setIsInvoicing] = useState(false);

    // Helper to format input with dots
    const handleAmountChange = (value, setter) => {
        setter(formatCurrency(value));
    };

    // Helper to parse formatted string to number for math
    const parseAmount = (str) => {
        return parseCurrency(str);
    };


    // Filter products
    const filteredProducts = inventory.filter(p => {
        const isExact = searchTerm.startsWith('"') && searchTerm.endsWith('"') && searchTerm.length > 2;
        const cleanSearch = isExact ? searchTerm.slice(1, -1) : searchTerm;
        const normalizedSearch = normalize(cleanSearch);

        if (isExact) {
            return normalize(p.name) === normalizedSearch || (p.barcode && normalize(p.barcode) === normalizedSearch);
        }

        return normalize(p.name).includes(normalizedSearch) ||
            (p.barcode && normalize(p.barcode).includes(normalizedSearch));
    });

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            // Check for exact barcode match
            const exactMatch = inventory.find(p => p.barcode && normalize(p.barcode) === normalize(searchTerm));
            if (exactMatch) {
                e.preventDefault();
                addToCart(exactMatch);
                setSearchTerm('');
            }
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.name === product.name && item.category === product.category && !item.isReward && !item.isRedemption);
            if (existing) {
                return prev.map(item =>
                    (item.name === product.name && item.category === product.category && !item.isReward && !item.isRedemption)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1, obs: '', price: product.price, originalPrice: product.price }];
        });
    };

    const addRewardToCart = (reward) => {
        if (!selectedCustomer) {
            alert('Debes seleccionar un cliente para canjear premios.');
            return;
        }

        // Check if customer has enough points
        const pointsInCart = cart.filter(i => i.isReward).reduce((sum, i) => sum + (i.pointCost * i.quantity), 0);
        if (selectedCustomer.points < (pointsInCart + reward.pointCost)) {
            alert('El cliente no tiene puntos suficientes.');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === reward.id && item.isReward);
            if (existing) {
                return prev.map(item =>
                    (item.id === reward.id && item.isReward)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                ...reward,
                quantity: 1,
                obs: 'CANJE DE PUNTOS',
                price: 0,
                isReward: true
            }];
        });
    };

    const updateQuantity = (index, delta) => {
        setCart(prev => {
            const newItem = { ...prev[index] };
            newItem.quantity = Math.max(1, newItem.quantity + delta);
            const newCart = [...prev];
            newCart[index] = newItem;
            return newCart;
        });
    };

    const updateItemObs = (index, text) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index] = { ...newCart[index], obs: text };
            return newCart;
        });
    };

    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const toggleRedemption = (index) => {
        if (!selectedCustomer) {
            alert('Selecciona un cliente para realizar canjes.'); // Prompt user to select customer
            // Can't return simple alert if we want them to effectively do it. 
            // But blocking is fine.
            return;
        }

        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[index];

            if (item.isReward) return prev; // Don't toggle actual Rewards (from catalog)

            if (item.isRedemption) {
                // Revert to normal
                newCart[index] = {
                    ...item,
                    isRedemption: false,
                    price: item.originalPrice || 0,
                    obs: ''
                };
            } else {
                // Determine point cost: use product's pointCost
                // If pointCost is 0, warn? Or just allow "Gift".
                // User requirement: "canje... no tenga monto".
                // If pointCost is 0, it's free. 

                // Check points (Customer needs enough points for this item * quantity)
                // Actually we check at checkout or here? Better here to give feedback.
                // But quantity changes... checking here is tricky.
                // We will relax check here, or check only unit cost.

                newCart[index] = {
                    ...item,
                    isRedemption: true,
                    price: 0,
                    obs: 'CANJE STOCK'
                };
            }
            return newCart;
        });
    };



    const addExpenseItem = () => {
        setCart(prev => [...prev, {
            name: 'Descuento',
            category: 'Caja',
            price: 0,
            quantity: 1,
            obs: '',
            isExpense: true
        }]);
    };

    const updateExpensePrice = (index, value) => {
        const amount = parseCurrency(value);
        setCart(prev => {
            const newCart = [...prev];
            newCart[index] = { ...newCart[index], price: -amount };
            return newCart;
        });
    };

    const assignEmployeeToExpense = (index, empId) => {
        setCart(prev => {
            const newCart = [...prev];
            newCart[index] = { ...newCart[index], employeeId: empId };
            return newCart;
        });
    };

    // Calculate Total
    const subtotal = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    const pointsDiscount = pointsToRedeem; // Each point = $1 discount
    const total = Math.max(0, subtotal - pointsDiscount);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.dni && c.dni.includes(customerSearch))
    ).slice(0, 5);

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.name);
        setShowCustomerResults(false);
        setPointsToRedeem(0); // Reset redemption on new customer
    };

    const handleToggleRedemption = () => {
        if (!selectedCustomer) return;
        if (pointsToRedeem > 0) {
            setPointsToRedeem(0);
        } else {
            // Can't redeem more points than subtotal or more than customer has
            // Deduct points already used for reward items in cart
            const pointsUsedInCart = cart.filter(i => i.isReward).reduce((sum, i) => sum + (i.pointCost * i.quantity), 0);
            const availablePoints = (selectedCustomer.points || 0) - pointsUsedInCart;

            const maxPoints = Math.min(availablePoints, subtotal);
            setPointsToRedeem(maxPoints > 0 ? maxPoints : 0);
        }
    };

    const handleCheckout = async () => {
        window.alert("DEBUG: Checkout Started - Si ves esto, el botón funciona.");
        console.log("handleCheckout START");

        try {
            if (cart.length === 0) {
                alert("El carrito está vacío.");
                return;
            }

            const realCash = parseAmount(cashAmount);
            const realCard = parseAmount(cardAmount);
            const realTransfer = parseAmount(transferAmount);

            console.log("Starting checkout process...", { paymentMethod, realCash, realCard, realTransfer, total });

            if (paymentMethod === 'mixto' && (realCash + realCard + realTransfer < total)) {
                alert('El monto ingresado ($' + (realCash + realCard + realTransfer).toLocaleString('es-AR') + ') no cubre el total de $' + total.toLocaleString('es-AR'));
                return;
            }
            if (paymentMethod === 'personal' && !selectedEmployeeId) {
                alert('Por favor selecciona un empleado para cargar el consumo.');
                return;
            }

            if (shouldInvoiceFiscal) {
                console.log("Fiscal invoicing enabled");
                setIsInvoicing(true);
            }

            console.log("Creating saleData object...");

            // PROTECTED DATE CREATION
            let saleDate;
            try {
                saleDate = new Date().toLocaleDateString();
            } catch (e) {
                console.error("Date error:", e);
                saleDate = "Unknown Date";
            }

            const saleData = {
                date: saleDate,
                items: cart.map(i => ({
                    name: i.name,
                    category: i.category,
                    quantity: i.quantity,
                    price: i.price || 0,
                    obs: i.obs,
                    isReward: i.isReward,
                    isRedemption: i.isRedemption,
                    pointCost: i.pointCost
                })),
                totalAmount: total,
                subtotal: subtotal,
                pointsRedeemed: pointsToRedeem,
                paymentMethod,
                cashReceived: (paymentMethod === 'efectivo' ? total : (paymentMethod === 'mixto') ? realCash : 0),
                cardReceived: (paymentMethod === 'tarjeta' ? total : (paymentMethod === 'mixto') ? realCard : 0),
                transferReceived: (paymentMethod === 'transferencia' ? total : (paymentMethod === 'mixto') ? realTransfer : 0),
                observations,
                customerName: selectedCustomer ? selectedCustomer.name : (guestName || ''),
                customerId: selectedCustomer ? selectedCustomer.id : null
            };

            console.log("Sale Data Prepared:", saleData);

            // COMMENTED OUT TRANSACTION LOGIC FOR DEBUGGING
            /*
            // Calculate Change (Vuelto)
            const totalPaid = realCash + (paymentMethod === 'mixto' ? (realCard + realTransfer) : 0);
            let change = 0;
            if (paymentMethod === 'efectivo' || paymentMethod === 'mixto') {
                change = totalPaid - total;
            }
            if (change < 0) change = 0;

            console.log("Calculated Change:", change);

            // Save (and get generated Order Number)
            const savedSale = addSale(saleData);
            console.log("Sale Saved Successfully:", savedSale);

            // Notify Points Earned
            if (savedSale.pointsEarned > 0) {
                alert(`🎊 ¡PUNTOS SUMADOS!\n\nEl cliente sumó ${savedSale.pointsEarned} puntos con esta compra.`);
            }
            
            // ... (Fiscal and Print logic commented out) ...
            */

            window.alert("SIMULACION EXITOSA: Los datos estan listos. Si ves esto, el crash ocurría al GUARDAR o IMPRIMIR.");
            console.log("SIMULATION SUCCESS. SaleData:", saleData);

            /*
            // Reset
            setCart([]);
            // ...
            */

            console.log("handleCheckout COMPLETED successfully");
        } catch (error) {
            console.error("CRITICAL ERROR IN HANDLECHECKOUT:", error);
            window.alert("Error crítico atrapado: " + error.message);
            setIsInvoicing(false);
        }
    };




    return (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-100px)] gap-4 transition-colors duration-500">

            {/* LEFT: Product Catalog */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-120px)] sticky top-4">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3 rounded-t-2xl">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveCatalogTab('products')}
                            className={`flex-1 py-1.5 rounded-lg font-bold text-sm transition-all ${activeCatalogTab === 'products' ? 'bg-white dark:bg-slate-800 shadow-sm text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            Productos
                        </button>
                        <button
                            onClick={() => setActiveCatalogTab('rewards')}
                            className={`flex-1 py-1.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeCatalogTab === 'rewards' ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            <Gift size={16} />
                            Premios
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all outline-none"
                                placeholder={activeCatalogTab === 'products' ? "Buscar producto o escanear..." : "Buscar premios..."}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={() => loadData()}
                            disabled={loading}
                            title="Actualizar Datos (Sincronizar)"
                            className="w-10 h-10 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-500 hover:border-brand-500 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0"
                        >
                            <History size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={addExpenseItem}
                            className="w-10 h-10 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors flex items-center justify-center shrink-0"
                            title="Agregar Gasto / Retiro"
                        >
                            <Minus size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex flex-col gap-2">
                        {activeCatalogTab === 'products' ? (
                            filteredProducts.map((product, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => addToCart(product)}
                                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/10 dark:hover:bg-brand-500/5 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                        {/* Thumbnail */}
                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0 border border-slate-100 dark:border-slate-600 flex items-center justify-center">
                                            {product.image ? (
                                                <img src={product.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-300 dark:text-slate-500 select-none">
                                                    {product.name.substring(0, 2).toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 whitespace-normal leading-tight text-sm line-clamp-2">
                                                {product.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500">{product.category}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        {product.quantity > 0
                                            ? <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap">Stock: {product.quantity}</span>
                                            : <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">Sin Stock</span>
                                        }
                                        <span className="font-bold text-slate-900 dark:text-white w-20 text-right">${Number(product.price).toLocaleString('es-AR')}</span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            rewards.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map((reward, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => addRewardToCart(reward)}
                                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/10 dark:hover:bg-amber-500/5 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-amber-50 dark:bg-amber-900/20 flex-shrink-0 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center">
                                            <Gift className="text-amber-500 dark:text-amber-400" size={20} />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 whitespace-normal leading-tight text-sm line-clamp-2">
                                                {reward.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500">{reward.category}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <div className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                            <Star size={10} fill="currentColor" />
                                            {reward.pointCost} pts
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white w-20 text-right">$0</span>
                                    </div>
                                </button>
                            ))
                        )}
                        {activeCatalogTab === 'rewards' && rewards.length === 0 && (
                            <div className="text-center py-10 text-slate-400 dark:text-slate-600 italic text-sm">
                                No hay premios configurados en la Tienda de Puntos.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT: Current Order */}
            <div className="w-full md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
                <div className="p-4 bg-slate-900 dark:bg-black text-white rounded-t-2xl flex justify-between items-center">
                    <h2 className="font-bold text-lg">Pedido Actual</h2>
                    <span className="bg-brand-500 px-2 py-1 rounded text-xs font-bold">{cart.length} Items</span>
                </div>

                <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
                    {cart.length === 0 && (
                        <div className="text-center text-slate-400 dark:text-slate-600 mt-10">
                            <p>Carrito vacío</p>
                            <p className="text-sm">Selecciona productos a la izquierda</p>
                        </div>
                    )}
                    {cart.map((item, idx) => (
                        <div key={idx} className={`p-4 mb-2 rounded-xl border relative group flex justify-between items-center shadow-sm transition-all ${item.isExpense ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500'}`}>
                            <div className="flex-1 pr-2">
                                <div className="flex justify-between items-start">
                                    <span className={`font-bold leading-tight line-clamp-2 ${item.isExpense ? 'text-red-700 dark:text-red-400 text-xl' : 'text-slate-700 dark:text-slate-300 text-xs font-medium'}`}>{item.name}</span>
                                    {item.isExpense ? (
                                        <input
                                            type="text"
                                            placeholder="Monto"
                                            className="w-32 text-right font-black text-red-700 dark:text-red-400 bg-white dark:bg-slate-800 border-2 border-red-400 dark:border-red-900/50 rounded-lg px-2 py-1 text-2xl shadow-inner focus:ring-2 focus:ring-red-500 outline-none"
                                            value={formatCurrency(Math.abs(item.price))}
                                            onChange={(e) => updateExpensePrice(idx, e.target.value)}
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className={`font-bold text-xs ml-2 ${item.isRedemption ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                                ${(item.price * item.quantity).toLocaleString('es-AR')}
                                            </span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                ${item.price}/u
                                            </span>
                                            {item.isRedemption && item.pointCost > 0 && (
                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                                    -{item.pointCost * item.quantity} pts
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{item.category}</div>
                                {item.isExpense && <input
                                    type="text"
                                    placeholder="Detalle del descuento..."
                                    className="w-full mt-2 text-base font-bold bg-transparent border-b-2 border-red-200 dark:border-red-900/50 outline-none text-red-600 dark:text-red-400 placeholder-red-300 dark:placeholder-red-900"
                                    value={item.obs}
                                    onChange={(e) => updateItemObs(idx, e.target.value)}
                                />
                                }
                                {item.isExpense && (
                                    <select
                                        className="w-full mt-1 text-[10px] font-bold bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded p-1 text-red-700 dark:text-red-400 outline-none"
                                        value={item.employeeId || ''}
                                        onChange={(e) => assignEmployeeToExpense(idx, e.target.value)}
                                    >
                                        <option value="">-- Asignar a Personal --</option>
                                        {employees.map(e => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                {!item.isExpense && (
                                    <>
                                        {/* Redemption Toggle */}
                                        {!item.isReward && (
                                            <button
                                                onClick={() => toggleRedemption(idx)}
                                                className={`mr-1 p-1 rounded transition-colors ${item.isRedemption ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'text-slate-200 dark:text-slate-700 hover:text-amber-500 dark:hover:text-amber-500'}`}
                                                title={item.isRedemption ? "Cancelar Canje" : "Canjear con Puntos"}
                                            >
                                                <Gift size={14} fill={item.isRedemption ? "currentColor" : "none"} />
                                            </button>
                                        )}

                                        <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-600"><Minus size={12} className="dark:text-white" /></button>
                                        <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-600"><Plus size={12} className="dark:text-white" /></button>
                                    </>
                                )}
                                <button
                                    onClick={() => removeFromCart(idx)}
                                    className="ml-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    {/* Payment Types */}
                    <div className="flex gap-1 p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setPaymentMethod('efectivo')}
                            className={`flex-1 py-1 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentMethod === 'efectivo' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                            Efectivo
                        </button>
                        <button
                            onClick={() => setPaymentMethod('tarjeta')}
                            className={`flex-1 py-1 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentMethod === 'tarjeta' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                            Tarjeta
                        </button>
                        <button
                            onClick={() => setPaymentMethod('transferencia')}
                            className={`flex-1 py-1 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentMethod === 'transferencia' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                            Transfer
                        </button>
                        <button
                            onClick={() => setPaymentMethod('mixto')}
                            className={`flex-1 py-1 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentMethod === 'mixto' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                            Mixto
                        </button>
                        <button
                            onClick={() => setPaymentMethod('personal')}
                            className={`flex-1 py-1 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentMethod === 'personal' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                            Personal
                        </button>
                    </div>

                    {/* Monetary Inputs */}
                    {paymentMethod === 'efectivo' && (
                        <div className="flex items-center gap-2">
                            <Banknote size={16} className="text-green-600 dark:text-green-500" />
                            <input
                                type="text"
                                className="flex-1 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                                placeholder="Paga con..."
                                value={cashAmount}
                                onChange={e => handleAmountChange(e.target.value, setCashAmount)} // Use formatter
                            />
                        </div>
                    )}
                    {paymentMethod === 'mixto' && (
                        <div className="space-y-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                            {/* Cash Part */}
                            <div className="flex items-center gap-2">
                                <Banknote size={18} className="text-green-600 dark:text-green-500" />
                                <div className="flex-1">
                                    <label className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Efectivo</label>
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                                        placeholder="$0"
                                        value={cashAmount}
                                        onChange={e => handleAmountChange(e.target.value, setCashAmount)}
                                    />
                                </div>
                            </div>

                            {/* Card Part */}
                            <div className="flex items-center gap-2">
                                <CreditCard size={18} className="text-blue-600 dark:text-blue-500" />
                                <div className="flex-1">
                                    <label className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Tarjeta</label>
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                                        placeholder="$0"
                                        value={cardAmount}
                                        onChange={e => handleAmountChange(e.target.value, setCardAmount)}
                                    />
                                </div>
                            </div>

                            {/* Transfer Part */}
                            <div className="flex items-center gap-2">
                                <ArrowRight size={18} className="text-purple-600 dark:text-purple-500" />
                                <div className="flex-1">
                                    <label className="block text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Transferencia</label>
                                    <input
                                        type="text"
                                        className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                                        placeholder="$0"
                                        value={transferAmount}
                                        onChange={e => handleAmountChange(e.target.value, setTransferAmount)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentMethod === 'personal' && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-900/30 space-y-2">
                            <label className="block text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase">Seleccionar Personal</label>
                            <select
                                className="w-full px-3 py-2 rounded-lg border-2 border-orange-200 dark:border-orange-900/30 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-orange-500"
                                value={selectedEmployeeId}
                                onChange={e => setSelectedEmployeeId(e.target.value)}
                            >
                                <option value="">-- Elige un empleado --</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                            <p className="text-[9px] text-orange-600 dark:text-orange-500 italic">Se sumará a su deuda personal automáticamente.</p>
                        </div>
                    )}

                    <textarea
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none"
                        rows="3"
                        placeholder="Observaciones generales (puedes usar Enter para varios renglones)..."
                        value={observations}
                        onChange={e => setObservations(e.target.value)}
                    />

                    <div className="flex gap-4 items-end pt-2">
                        <div className="flex-1 relative">
                            <div className="flex justify-between items-center mb-1">
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Cliente</div>
                                <div className="flex bg-slate-100 dark:bg-slate-800 rounded p-0.5">
                                    <button
                                        onClick={() => setCustomerMode('club')}
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${customerMode === 'club' ? 'bg-white dark:bg-slate-700 shadow text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
                                    >
                                        CLUB
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCustomerMode('guest');
                                            setSelectedCustomer(null);
                                            setCustomerSearch('');
                                        }}
                                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${customerMode === 'guest' ? 'bg-white dark:bg-slate-700 shadow text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}
                                    >
                                        NOMBRE
                                    </button>
                                </div>
                            </div>

                            {customerMode === 'club' ? (
                                <div className="relative">
                                    <div className="absolute left-2 top-2 text-slate-400">
                                        <User size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-8 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="Buscar socio..."
                                        value={customerSearch}
                                        onChange={e => {
                                            setCustomerSearch(e.target.value);
                                            setShowCustomerResults(true);
                                            if (selectedCustomer) setSelectedCustomer(null);
                                        }}
                                        onFocus={() => setShowCustomerResults(true)}
                                    />
                                    {selectedCustomer && (
                                        <button
                                            onClick={() => {
                                                setSelectedCustomer(null);
                                                setCustomerSearch('');
                                                setPointsToRedeem(0);
                                            }}
                                            className="absolute right-2 top-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-2 top-2 text-slate-400">
                                        <Edit size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-8 pr-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                        placeholder="Nombre del cliente (Opcional)"
                                        value={guestName}
                                        onChange={e => setGuestName(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Club Actions (Redeem) */}
                            {selectedCustomer && (
                                <div className="mt-1 flex justify-end">
                                    <button
                                        onClick={handleToggleRedemption}
                                        disabled={selectedCustomer.points === 0}
                                        className={`px-2 py-1 rounded flex items-center gap-1.5 transition-all ${pointsToRedeem > 0 ? 'bg-amber-500 text-white' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60'} disabled:opacity-50`}
                                        title={selectedCustomer.points === 0 ? 'Sin puntos' : `Canjear puntos (Disponible: ${selectedCustomer.points})`}
                                    >
                                        <Star size={12} fill={pointsToRedeem > 0 ? 'white' : 'currentColor'} />
                                        <span className="text-[10px] font-black">{selectedCustomer.points} pts</span>
                                    </button>
                                </div>
                            )}

                            {/* Search Dropdown */}
                            {customerMode === 'club' && showCustomerResults && customerSearch.length > 0 && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                    {filteredCustomers.length === 0 ? (
                                        <div className="p-3 text-xs text-slate-400 dark:text-slate-500 text-center">No se encontraron clientes</div>
                                    ) : (
                                        filteredCustomers.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => handleSelectCustomer(c)}
                                                className="w-full p-2 text-left hover:bg-brand-50 dark:hover:bg-brand-900/20 border-b border-slate-50 dark:border-slate-700 last:border-0 flex justify-between items-center"
                                            >
                                                <div>
                                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.name}</div>
                                                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{c.dni || 'Sin DNI'}</div>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                                    <Star size={10} fill="currentColor" /> {c.points || 0}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="text-right min-w-[120px]">
                            {pointsToRedeem > 0 && (
                                <div className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase strike">- ${pointsToRedeem.toLocaleString('es-AR')}</div>
                            )}
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Total a Pagar</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">${total.toLocaleString('es-AR')}</div>
                        </div>
                    </div>
                    {/* Vuelto Logic: Works for Efectivo and Mixto */}
                    {(() => {
                        const cashIn = parseAmount(cashAmount);
                        const cardIn = parseAmount(cardAmount);
                        const transIn = parseAmount(transferAmount);
                        const totalPaid = cashIn + (paymentMethod === 'mixto' ? (cardIn + transIn) : 0);
                        if ((paymentMethod === 'efectivo' || paymentMethod === 'mixto') && totalPaid > total) {
                            return (
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Vuelto</div>
                                    <div className="text-lg font-bold text-green-600 dark:text-green-400">${(totalPaid - total).toLocaleString('es-AR')}</div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>

                {/* AFIP Fiscal Invoice Toggle */}
                {activeSession && (
                    <div className={`p-3 rounded-xl border-2 transition-all mb-4 ${shouldInvoiceFiscal ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30'}`}>
                        <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${shouldInvoiceFiscal ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                    <Save size={16} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200">Factura Fiscal AFIP</div>
                                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Emitir factura legal (Modo Testing)</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                                checked={shouldInvoiceFiscal}
                                onChange={(e) => setShouldInvoiceFiscal(e.target.checked)}
                            />
                        </label>
                    </div>
                )}

                <button onClick={() => alert("RAW BUTTON CLICK")}>
                    RAW TEST BUTTON
                </button>

                {!activeSession && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-3 flex flex-col items-center text-center animate-pulse mt-4">
                        <Lock className="text-amber-600 dark:text-amber-500 mb-1" size={20} />
                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase leading-tight">
                            Debes abrir la caja para vender
                        </p>
                        <button
                            onClick={() => window.location.hash = '/cash-control'}
                            className="mt-2 text-[10px] font-black text-amber-700 dark:text-amber-400 underline"
                        >
                            IR A CONTROL DE CAJA
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
