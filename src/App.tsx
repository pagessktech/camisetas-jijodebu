import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Customizer from './pages/Customizer';
import Checkout from './pages/Checkout';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import CustomerOrders from './pages/CustomerOrders';
import Legal from './pages/Legal';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Product, Category } from './types';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';

// Helper para crear slugs amigables (ej: "Classic Tee" -> "classic-tee")
const createSlug = (text: string) => {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
};

// Componente Wrapper para manejar la lógica de producto individual por URL
const ProductPageWrapper: React.FC<{ products: Product[], loading: boolean }> = ({ products, loading }) => {
  const { slug } = useParams();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  // Buscamos por slug generado o por ID si no encuentra slug
  const product = products.find(p => createSlug(p.name) === slug || p.id === slug);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20">
         <h2 className="text-2xl font-bold">Producto no encontrado</h2>
         <button onClick={() => navigate('/')} className="mt-4 text-blue-600 underline">Volver al inicio</button>
      </div>
    );
  }

  return <Customizer product={product} onBack={() => navigate('/')} />;
};

// Componente Wrapper para proteger ruta de admin
const AdminRoute: React.FC = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  
  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  
  if (!isAdmin) return <Navigate to="/" replace />;
  
  return <AdminDashboard onExit={() => navigate('/')} />;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const AppContent: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        // Fetch Categories
        const { data: catData } = await supabase.from('categories').select('*').order('name');
        if (catData) setCategories(catData);

        // Fetch Products
        const { data: prodData, error } = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .order('name');
        
        if (error) console.error('Error fetching products:', error);
        else if (prodData) setProducts(prodData);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Manejo de scroll para secciones cuando se navega (si viene del Navbar)
  useEffect(() => {
    if (location.state && (location.state as any).scrollTo) {
      const sectionId = (location.state as any).scrollTo;
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

  const handleSelectProduct = (product: Product) => {
    navigate(`/producto/${createSlug(product.name)}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigate('/');
    // Add logic to scroll to products if needed
    setTimeout(() => {
       const el = document.getElementById('shop');
       if(el) el.scrollIntoView({ behavior: 'smooth'});
    }, 100);
  };

  // Filter products based on search query
  const displayedProducts = products.filter(product => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      (product.categories?.name || '').toLowerCase().includes(lowerQuery)
    );
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-black animate-spin" />
      </div>
    );
  }

  // Si estamos en admin, renderizamos sin layout estándar
  if (location.pathname === '/admin') {
     return <AdminRoute />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <ScrollToTop />
      <Navbar onSearch={handleSearch} />
      <CartSidebar onCheckout={() => navigate('/checkout')} />
      
      <main className="flex-1 w-full max-w-full">
        <Routes>
          <Route path="/" element={
            <Home 
              products={displayedProducts} 
              categories={categories}
              onSelectProduct={handleSelectProduct} 
            />
          } />
          
          <Route path="/producto/:slug" element={
            <ProductPageWrapper products={products} loading={loadingData} />
          } />

          <Route path="/checkout" element={<Checkout onBack={() => navigate('/')} />} />
          <Route path="/auth" element={<Auth onSuccess={() => navigate('/')} />} />
          <Route path="/orders" element={<CustomerOrders onBack={() => navigate('/')} />} />
          
          {/* Legal Pages */}
          <Route path="/terminos" element={<Legal type="terms" />} />
          <Route path="/privacidad" element={<Legal type="privacy" />} />
          <Route path="/defensa-consumidor" element={<Legal type="consumer" />} />

          <Route path="/admin" element={<AdminRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      <WhatsAppButton />
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;