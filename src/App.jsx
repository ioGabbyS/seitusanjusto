
import React, { useState, useEffect } from 'react';
// Version log moved to main.jsx
import Layout from './components/Layout';
import InvoiceForm from './components/InvoiceForm';
import POS from './components/POS';
import CashControl from './components/CashControl';
import { useStore } from './hooks/useStore.jsx';
import InventoryList from './components/InventoryList';
import Dashboard from './components/Dashboard';
import Catalog from './components/Catalog';
import Metrics from './components/Metrics';
import Settings from './components/Settings';
import Finances from './components/Finances';
import PurchaseDetailModal from './components/PurchaseDetailModal';
import CustomerList from './components/CustomerList';
import PointsCatalog from './components/PointsCatalog';
import CustomerPortal from './components/CustomerPortal';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import ThemeToggle from './components/ThemeToggle';
import AIChatbot from './components/AIChatbot';
import IceCreamStock from './components/IceCreamStock';
import IceCreamUnitControl from './components/IceCreamUnitControl';
import Paloma15 from './components/events/Paloma15';
import Paloma15Show from './components/events/Paloma15Show';
import Paloma15Admin from './components/events/Paloma15Admin';
import Martina15 from './components/events/Martina15';
import Martina15Show from './components/events/Martina15Show';
import Martina15Admin from './components/events/Martina15Admin';
import { supabase } from './utils/supabaseClient';

// Componente principal interno que SÍ usa el Store
function MainApp({ inventory, sales, purchases, activeTab, setActiveTab, isAuthenticated, userRole, handleLogout, onLoginSuccess }) {
  const {
    addPurchase,
    updateProductSettings,
    loading,
    rewards,
    addReward,
    updateReward,
    deleteReward,
    uploadImage
  } = useStore();

  const [selectedPurchase, setSelectedPurchase] = useState(null);

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Cargando...</div>;

  // Render Content Logic (moved from original App)
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard inventory={inventory} sales={sales} />;
      case 'purchases':
        return (
          <div className="space-y-6">
            <InvoiceForm onSave={addPurchase} />
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-slate-700 mb-4">Historial de Cargas</h3>
              <div className="space-y-2">
                {purchases.length === 0 && <p className="text-slate-400">Sin facturas cargadas.</p>}
                {purchases.map(p => (
                  <div key={p.id} onClick={() => setSelectedPurchase(p)} className="p-4 border-b hover:bg-brand-50 transition-colors cursor-pointer group rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-700 group-hover:text-brand-700">{p.date}</span>
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full">{p.invoiceNumber || 'S/N'}</span>
                    </div>
                    <div className="text-sm text-slate-500 line-clamp-1">{p.items.map(i => `${i.name} (${i.quantity})`).join(', ')}</div>
                    <div className="mt-2 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                      <span>{p.items.length} productos en total</span>
                      <span className="text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalle &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'inventory': return <InventoryList inventory={inventory} onUpdateSettings={updateProductSettings} />;
      case 'catalog': return <Catalog />;
      case 'cash': return <CashControl />;
      case 'sales': return <POS />;
      case 'metrics': return <Metrics />;
      case 'settings': return <Settings />;
      case 'finances': return <Finances />;
      case 'ice-cream-stock': return <IceCreamStock />;
      case 'ice-cream-unit-control': return <IceCreamUnitControl />;
      case 'customers': return <CustomerList />;
      case 'points-catalog': return <PointsCatalog rewards={rewards} addReward={addReward} updateReward={updateReward} deleteReward={deleteReward} uploadImage={uploadImage} />;
      default: return <Dashboard inventory={inventory} sales={sales} />;
    }
  };

  // Proteger rutas administrativas
  if (!isAuthenticated) {
    return (
      <>
        <Login onLoginSuccess={onLoginSuccess} />
        <ThemeToggle />
      </>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} userRole={userRole}>
      {renderContent()}
      {selectedPurchase && <PurchaseDetailModal purchase={selectedPurchase} onClose={() => setSelectedPurchase(null)} />}
      <ThemeToggle />
    </Layout>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem('seitu_role') || 'admin');

  // Solo traemos lo que necesitamos para pasar a MainApp, aunque idealmente MainApp usaría useStore directamente
  // Pero para evitar llamar a useStore aquí, necesitamos envolver MainApp
  // PROBLEMA: MainApp necesita access a purchases, inventory, sales que vienen de useStore.
  // SOLUCIÓN: MainApp llama a useStore. App NO llama a useStore.

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        setUserRole('admin');
        localStorage.setItem('seitu_role', 'admin');
      } else {
        const authStatus = localStorage.getItem('seitu_auth');
        const role = localStorage.getItem('seitu_role');
        if (authStatus === 'true' && role === 'stock') {
          setIsAuthenticated(true);
          setUserRole('stock');
          setActiveTab('ice-cream-stock');
        } else if (authStatus === 'true') {
          setIsAuthenticated(false);
        }
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tabId) => {
    // Logic for restricted tabs (copied from original)
    const restrictedTabs = ['settings'];
    if (restrictedTabs.includes(tabId)) {
      // ... (Modal logic same as before)
      const dummyModal = true; // Placeholder for logic reuse if needed inside MainApp or moved here
      // For brevity, I'll pass a wrapped handler or move logic to MainApp
      // Let's implement the logic right here or pass it down.
      // Moving the complex modal logic to MainApp is cleaner if MainApp handles the layout.
      // Actually, Layout is in MainApp now. So setActiveTab is passed to MainApp.
    }
    setActiveTab(tabId); // Simplification for now, the modal logic should be in MainApp
  };

  const handleLoginSuccess = (role = 'admin') => {
    setIsAuthenticated(true);
    setUserRole(role);
    if (role === 'stock') setActiveTab('ice-cream-stock');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('seitu_auth');
    localStorage.removeItem('seitu_role');
    setIsAuthenticated(false);
    window.location.hash = '#/';
  };

  // Rutas públicas que NO necesitan Store
  if (currentHash === '#/portal') return <><CustomerPortal /><ThemeToggle /><AIChatbot /></>;
  if (currentHash === '' || currentHash === '#/') return <><LandingPage /><ThemeToggle /><AIChatbot /></>;

  // Ruta principal app
  return (
    <MainApp
      activeTab={activeTab}
      setActiveTab={handleTabChange}
      isAuthenticated={isAuthenticated}
      userRole={userRole}
      handleLogout={handleLogout}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

// Wrapper for MainApp to handle the Tab Change Logic with Modal
function MainAppWrapper(props) {
  const { inventory, sales, purchases } = useStore(); // Called HERE, inside StoreProvider context

  // Re-implement modal logic here or pass simpler handler
  const handleTabChange = (tabId) => {
    const restrictedTabs = ['settings'];
    if (restrictedTabs.includes(tabId)) {
      // Modal logic
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-center;z-index:9999';
      modal.innerHTML = `
               <div style="background:white;padding:2rem;border-radius:1rem;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);max-width:400px;width:90%">
                 <h3 style="font-size:1.25rem;font-weight:bold;margin-bottom:1rem;color:#1e293b">🔐 Acceso Restringido</h3>
                 <p style="color:#64748b;margin-bottom:1.5rem;font-size:0.875rem">Ingrese la clave administrativa para continuar:</p>
                 <input type="password" id="admin-pass" placeholder="Contraseña" style="width:100%;padding:0.75rem;border:1px solid #e2e8f0;border-radius:0.5rem;margin-bottom:1rem;font-size:1rem" />
                 <div style="display:flex;gap:0.5rem">
                   <button id="cancel-btn" style="flex:1;padding:0.75rem;background:#f1f5f9;border:none;border-radius:0.5rem;font-weight:600;cursor:pointer">Cancelar</button>
                   <button id="submit-btn" style="flex:1;padding:0.75rem;background:#f97316;color:white;border:none;border-radius:0.5rem;font-weight:600;cursor:pointer">Ingresar</button>
                 </div>
               </div>
             `;
      document.body.appendChild(modal);
      const input = document.getElementById('admin-pass');
      input.focus();

      const checkPassword = () => {
        if (input.value === '1145') {
          props.setActiveTab(tabId);
          document.body.removeChild(modal);
        } else {
          input.value = '';
          input.style.borderColor = '#ef4444';
          input.placeholder = '❌ Clave incorrecta';
          setTimeout(() => {
            input.style.borderColor = '#e2e8f0';
            input.placeholder = 'Contraseña';
          }, 2000);
        }
      };

      document.getElementById('submit-btn').onclick = checkPassword;
      document.getElementById('cancel-btn').onclick = () => document.body.removeChild(modal);
      input.onkeypress = (e) => { if (e.key === 'Enter') checkPassword(); };
    } else {
      props.setActiveTab(tabId);
    }
  };

  return <MainApp {...props} setActiveTab={handleTabChange} inventory={inventory} sales={sales} purchases={purchases} />;
}

// Fix App to use Wrapper
function AppFix() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem('seitu_role') || 'admin');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        setUserRole('admin');
        localStorage.setItem('seitu_role', 'admin');
      } else {
        const authStatus = localStorage.getItem('seitu_auth');
        const role = localStorage.getItem('seitu_role');
        if (authStatus === 'true' && role === 'stock') {
          setIsAuthenticated(true);
          setUserRole('stock');
          setActiveTab('ice-cream-stock');
        } else if (authStatus === 'true') {
          setIsAuthenticated(false);
        }
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLoginSuccess = (role = 'admin') => {
    setIsAuthenticated(true);
    setUserRole(role);
    if (role === 'stock') setActiveTab('ice-cream-stock');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('seitu_auth');
    localStorage.removeItem('seitu_role');
    setIsAuthenticated(false);
    window.location.hash = '#/';
  };

  // Rutas públicas: Portal del cliente y Landing con sus secciones (#nosotros, #puntos, etc)
  const isPortal = currentHash === '#/portal';
  const isLanding = !isPortal && (
    currentHash === '' ||
    currentHash === '#/' ||
    (currentHash.startsWith('#') && !currentHash.includes('/'))
  );

  // Normalizar el hash para comparaciones robustas
  const normalizedHash = currentHash.split('?')[0].toLowerCase();

  // Rutas del evento Paloma 15 (Prioridad máxima y Públicas)
  if (normalizedHash === '#/15' || normalizedHash === '#/15/') return <><Paloma15 /><ThemeToggle /></>;
  if (normalizedHash === '#/15-show' || normalizedHash === '#/15-show/') return <><Paloma15Show /></>;
  if (normalizedHash === '#/15-admin' || normalizedHash === '#/15-admin/') return <><Paloma15Admin /><ThemeToggle /></>;

  // Rutas del evento Martina 15 (Públicas)
  if (normalizedHash === '#/martina' || normalizedHash === '#/martina/') return <><Martina15 /><ThemeToggle /></>;
  if (normalizedHash === '#/martina-show' || normalizedHash === '#/martina-show/') return <><Martina15Show /></>;
  if (normalizedHash === '#/martina-admin' || normalizedHash === '#/martina-admin/') return <><Martina15Admin /><ThemeToggle /></>;

  if (isPortal) return <><CustomerPortal /><ThemeToggle /><AIChatbot /></>;
  if (isLanding) return <><LandingPage /><ThemeToggle /><AIChatbot /></>;

  return (
    <MainAppWrapper
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isAuthenticated={isAuthenticated}
      userRole={userRole}
      handleLogout={handleLogout}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

export default AppFix;
