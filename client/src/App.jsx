import React from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import POSTerminal from './components/POS/POSTerminal';
import Cart from './components/POS/Cart';
import ProductManager from './components/Inventory/ProductManager';
import OrderHistory from './components/Orders/OrderHistory';
import CustomerManager from './components/Customers/CustomerManager';
import CouponManager from './components/Coupons/CouponManager';
import AnalyticsDashboard from './components/Dashboard/AnalyticsDashboard';
import AuthScreen from './components/Auth/AuthScreen';

// Enterprise Vyapar-Grade Views
import DocumentManager from './components/Documents/DocumentManager';
import BatchExpiryManager from './components/Inventory/BatchExpiryManager';
import PurchaseBillManager from './components/Purchases/PurchaseBillManager';
import VendorKhata from './components/Vendors/VendorKhata';
import CustomerStatement from './components/Customers/CustomerStatement';
import GSTDashboard from './components/GST/GSTDashboard';
import FinanceManager from './components/Finance/FinanceManager';
import AuditLogViewer from './components/Audit/AuditLogViewer';

const MainLayout = () => {
  const { activeTab, toast, theme } = usePOS();
  const isLight = theme === 'light';

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans transition-colors duration-300 ${
      isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
    }`}>
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Center View */}
        <main className={`flex-1 flex overflow-hidden transition-colors duration-300 ${
          isLight ? 'bg-[#fbf4dc] text-[#051f14]' : 'bg-[#05170f] text-[#fef3c7]'
        }`}>
          {activeTab === 'pos' && (
            <>
              <POSTerminal />
              <Cart />
            </>
          )}

          {/* Baseline Views */}
          {activeTab === 'inventory' && <ProductManager />}
          {activeTab === 'orders' && <OrderHistory />}
          {activeTab === 'customers' && <CustomerManager />}
          {activeTab === 'coupons' && <CouponManager />}
          {activeTab === 'dashboard' && <AnalyticsDashboard />}

          {/* Enterprise Features */}
          {activeTab === 'documents' && <DocumentManager />}
          {activeTab === 'batchInventory' && <BatchExpiryManager />}
          {activeTab === 'purchases' && <PurchaseBillManager />}
          {activeTab === 'vendorKhata' && <VendorKhata />}
          {activeTab === 'customerStatement' && <CustomerStatement />}
          {activeTab === 'gst' && <GSTDashboard />}
          {activeTab === 'finance' && <FinanceManager />}
          {activeTab === 'audit' && <AuditLogViewer />}
        </main>
      </div>

      {/* Floating Notifications */}
      <Toast toast={toast} />
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated, toast } = usePOS();

  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen />
        <Toast toast={toast} />
      </>
    );
  }

  return <MainLayout />;
};

const App = () => {
  return (
    <POSProvider>
      <AppContent />
    </POSProvider>
  );
};

export default App;
