import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product, Category, Coupon } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  LogOut, 
  Search, 
  Bell, 
  Plus, 
  Edit, 
  Trash, 
  Loader2,
  X,
  Menu,
  Shirt,
  Tag,
  TicketPercent,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'categories' | 'coupons'>('overview');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Stats
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // --- FORM STATES ---
  
  // Product Form
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [showProductModal, setShowProductModal] = useState(false);

  // Category Form
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Coupon Form
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon>>({});
  const [showCouponModal, setShowCouponModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Si ya hay datos y no estamos cargando por primera vez, activamos estado de refresco visual suave
    if (products.length > 0) setRefreshing(true);
    else setLoading(true);
    
    // 1. Fetch Categories
    const { data: catData } = await supabase.from('categories').select('*').order('name');
    if (catData) setCategories(catData);

    // 2. Fetch Products (with category join)
    const { data: productsData } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });
    if (productsData) setProducts(productsData);

    // 3. Fetch Orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });
    
    if (ordersData) {
      setOrders(ordersData);
      const sales = ordersData
        .filter(o => o.status === 'paid' || o.status === 'shipped')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
      setTotalSales(sales);
      setTotalOrdersCount(ordersData.length);
      setPendingOrdersCount(ordersData.filter(o => o.status === 'pending').length);
    }

    // 4. Fetch Coupons
    const { data: couponData } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (couponData) setCoupons(couponData);

    setLoading(false);
    setRefreshing(false);
  };

  // --- HANDLERS: PRODUCTS ---

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
        const productData = {
            name: currentProduct.name,
            description: currentProduct.description,
            base_price: currentProduct.base_price,
            image_url: currentProduct.image_url,
            stock: currentProduct.stock || 0,
            colors: typeof currentProduct.colors === 'string' ? (currentProduct.colors as string).split(',').map(s => s.trim()) : currentProduct.colors,
            sizes: typeof currentProduct.sizes === 'string' ? (currentProduct.sizes as string).split(',').map(s => s.trim()) : currentProduct.sizes,
            category_id: currentProduct.category_id || null
        };

        let error;
        if (currentProduct.id) {
            const res = await supabase.from('products').update(productData).eq('id', currentProduct.id);
            error = res.error;
        } else {
            const res = await supabase.from('products').insert([productData]);
            error = res.error;
        }

        if (error) throw error;

        setShowProductModal(false);
        setCurrentProduct({});
        await fetchData();
    } catch (err: any) {
        alert(`Error al guardar producto: ${err.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.")) return;
    
    setActionLoading(true);
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        
        if (error) {
            console.error(error);
            alert(`No se pudo eliminar el producto. Puede que tenga pedidos asociados.\nError: ${error.message}`);
        } else {
            // Optimistic update
            setProducts(prev => prev.filter(p => p.id !== id));
        }
    } catch (err: any) {
        alert(`Error inesperado: ${err.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  const openProductModal = (product?: Product) => {
    if (product) {
        setCurrentProduct(product);
    } else {
        setCurrentProduct({
            name: '',
            description: '',
            base_price: 0,
            image_url: '',
            colors: ['white', 'black'],
            sizes: ['S', 'M', 'L', 'XL'],
            stock: 100,
            category_id: ''
        });
    }
    setShowProductModal(true);
  };

  // --- HANDLERS: CATEGORIES ---

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    
    try {
        const slug = currentCategory.slug || currentCategory.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') || '';
        const categoryData = { name: currentCategory.name, slug: slug };

        let error;
        if (currentCategory.id) {
            const res = await supabase.from('categories').update(categoryData).eq('id', currentCategory.id);
            error = res.error;
        } else {
            const res = await supabase.from('categories').insert([categoryData]);
            error = res.error;
        }

        if (error) throw error;

        setShowCategoryModal(false);
        await fetchData();
    } catch (err: any) {
        alert(`Error al guardar categoría: ${err.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("¿Eliminar categoría? Los productos perderán su asociación a esta categoría.")) return;
    
    setActionLoading(true);
    try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
        alert(`No se pudo eliminar la categoría: ${err.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  const openCategoryModal = (category?: Category) => {
    if (category) setCurrentCategory(category);
    else setCurrentCategory({ name: '', slug: '' });
    setShowCategoryModal(true);
  };

  // --- HANDLERS: COUPONS ---

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
        const couponData = {
            code: currentCoupon.code?.toUpperCase(),
            discount_type: currentCoupon.discount_type || 'percentage',
            discount_value: currentCoupon.discount_value || 0,
            active: currentCoupon.active !== undefined ? currentCoupon.active : true,
        };

        let error;
        if (currentCoupon.id) {
            const res = await supabase.from('coupons').update(couponData).eq('id', currentCoupon.id);
            error = res.error;
        } else {
            const res = await supabase.from('coupons').insert([couponData]);
            error = res.error;
        }

        if (error) throw error;

        setShowCouponModal(false);
        await fetchData();
    } catch (err: any) {
        alert(`Error al guardar cupón: ${err.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm("¿Eliminar cupón permanentemente?")) return;
    
    setActionLoading(true);
    try {
        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) throw error;
        setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
        alert(`No se pudo eliminar el cupón: ${err.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  const openCouponModal = (coupon?: Coupon) => {
    if (coupon) setCurrentCoupon(coupon);
    else setCurrentCoupon({ code: '', discount_type: 'percentage', discount_value: 10, active: true });
    setShowCouponModal(true);
  };

  // --- HANDLERS: ORDERS ---

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
      // Optimistic update for UI responsiveness
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      
      try {
        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
        if (error) throw error;
        await fetchData(); // Refresh to ensure data consistency
      } catch (err: any) {
        alert(`Error al actualizar pedido: ${err.message}`);
        await fetchData(); // Revert on error
      }
  };

  // --- COMPONENTS ---

  const SidebarItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button 
      onClick={() => {
        setActiveTab(id);
        setIsSidebarOpen(false); 
      }}
      className={`w-full flex items-center px-6 py-4 text-sm font-medium transition-colors ${
        activeTab === id 
        ? 'text-white border-l-4 border-white bg-gray-800' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden relative">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-[#111] text-white flex flex-col shadow-2xl 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center px-8 border-b border-gray-800 justify-between">
           <div className="flex items-center">
             <div className="bg-white text-black p-1.5 rounded mr-3">
               <Shirt className="h-5 w-5" />
             </div>
             <span className="font-bold text-xl tracking-tight">Admin</span>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400">
             <X className="h-6 w-6" />
           </button>
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          <div className="px-6 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Menú</div>
          <SidebarItem id="overview" icon={LayoutDashboard} label="Resumen" />
          <SidebarItem id="orders" icon={ShoppingBag} label="Pedidos" />
          <SidebarItem id="products" icon={Package} label="Productos" />
          <SidebarItem id="categories" icon={Tag} label="Categorías" />
          <SidebarItem id="coupons" icon={TicketPercent} label="Cupones" />
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
           <button onClick={onExit} className="flex items-center w-full px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
             <ArrowLeft className="w-5 h-5 mr-3" /> Volver a la Tienda
           </button>
           <button onClick={() => { signOut(); onExit(); }} className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors">
             <LogOut className="w-5 h-5 mr-3" /> Cerrar Sesión
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md">
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 capitalize">
                    {activeTab === 'overview' ? 'Resumen' : 
                     activeTab === 'products' ? 'Productos' : 
                     activeTab === 'orders' ? 'Pedidos' : 
                     activeTab === 'categories' ? 'Categorías' : 'Cupones'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3 md:space-x-6">
                <button 
                  onClick={fetchData} 
                  className={`p-2 text-gray-400 hover:text-gray-900 transition-colors bg-gray-100 rounded-full ${refreshing ? 'animate-spin' : ''}`}
                  title="Refrescar Datos"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <div className="relative hidden sm:block">
                  <input type="text" placeholder="Buscar..." className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black/5" />
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
                <button className="relative p-2 text-gray-400 hover:text-gray-600">
                  <Bell className="w-6 h-6" />
                </button>
            </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {loading && !showProductModal && !showCategoryModal && !showCouponModal ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-black" />
            </div>
          ) : (
            <>
              {/* --- OVERVIEW TAB --- */}
              {activeTab === 'overview' && (
                <div className="space-y-6 md:space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-[#111] rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3 bg-gray-800/50 rounded-2xl"><ShoppingBag className="w-6 h-6 text-white" /></div>
                                <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Hoy</span>
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium mb-1">Ventas Totales</h3>
                            <p className="text-3xl md:text-4xl font-bold tracking-tight">${totalSales.toLocaleString('es-AR')}</p>
                          </div>
                      </div>
                      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                           <h3 className="text-gray-500 text-sm font-medium mb-1">Pedidos Pendientes</h3>
                           <p className="text-3xl font-bold text-gray-900">{pendingOrdersCount}</p>
                           <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
                              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(pendingOrdersCount / (totalOrdersCount || 1)) * 100}%` }}></div>
                           </div>
                      </div>
                      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                          <h3 className="text-gray-500 text-sm font-medium mb-1">Productos Activos</h3>
                          <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                      </div>
                   </div>
                </div>
              )}

              {/* --- PRODUCTS TAB --- */}
              {activeTab === 'products' && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                   <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <h2 className="text-lg font-bold text-gray-900">Inventario</h2>
                      <button onClick={() => openProductModal()} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
                      </button>
                   </div>
                   <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="text-xs font-semibold text-gray-500 border-b border-gray-100 bg-gray-50/50">
                          <th className="px-6 py-4">Producto</th>
                          <th className="px-6 py-4">Categoría</th>
                          <th className="px-6 py-4">Precio</th>
                          <th className="px-6 py-4">Stock</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                           <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="flex items-center">
                                      <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 mr-4" />
                                      <div>
                                          <p className="font-medium text-gray-900">{p.name}</p>
                                          <p className="text-xs text-gray-500">{p.colors.length} colores</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {(p.categories as any)?.name || 'Sin Categoría'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">${p.base_price}</td>
                              <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.stock > 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {p.stock}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end space-x-2">
                                    <button onClick={() => openProductModal(p)} disabled={actionLoading} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg disabled:opacity-50"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteProduct(p.id)} disabled={actionLoading} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"><Trash className="w-4 h-4" /></button>
                                  </div>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                   </div>
                </div>
              )}

              {/* --- CATEGORIES TAB --- */}
              {activeTab === 'categories' && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                   <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-gray-900">Categorías</h2>
                      <button onClick={() => openCategoryModal()} className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                          <Plus className="w-4 h-4 mr-2" /> Nueva
                      </button>
                   </div>
                   <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-semibold text-gray-500 border-b border-gray-100 bg-gray-50/50">
                          <th className="px-6 py-4">Nombre</th>
                          <th className="px-6 py-4">Slug</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((c) => (
                           <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                              <td className="px-6 py-4 text-gray-500 font-mono text-xs">{c.slug}</td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end space-x-2">
                                    <button onClick={() => openCategoryModal(c)} disabled={actionLoading} className="p-2 text-gray-400 hover:text-black"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteCategory(c.id)} disabled={actionLoading} className="p-2 text-gray-400 hover:text-red-600"><Trash className="w-4 h-4" /></button>
                                  </div>
                              </td>
                           </tr>
                        ))}
                        {categories.length === 0 && <tr><td colSpan={3} className="text-center py-8 text-gray-500">No hay categorías. Crea una para organizar tus productos.</td></tr>}
                      </tbody>
                   </table>
                </div>
              )}

              {/* --- COUPONS TAB --- */}
              {activeTab === 'coupons' && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                   <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-gray-900">Cupones</h2>
                      <button onClick={() => openCouponModal()} className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center">
                          <Plus className="w-4 h-4 mr-2" /> Nuevo Cupón
                      </button>
                   </div>
                   <table className="w-full text-left">
                      <thead>
                        <tr className="text-xs font-semibold text-gray-500 border-b border-gray-100 bg-gray-50/50">
                          <th className="px-6 py-4">Código</th>
                          <th className="px-6 py-4">Descuento</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map((c) => (
                           <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-bold text-gray-900">{c.code}</td>
                              <td className="px-6 py-4 text-gray-600">
                                {c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {c.active ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end space-x-2">
                                    <button onClick={() => openCouponModal(c)} disabled={actionLoading} className="p-2 text-gray-400 hover:text-black"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteCoupon(c.id)} disabled={actionLoading} className="p-2 text-gray-400 hover:text-red-600"><Trash className="w-4 h-4" /></button>
                                  </div>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              )}

              {/* --- ORDERS TAB --- */}
              {activeTab === 'orders' && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                   <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-gray-900">Historial de Pedidos</h2>
                      <button onClick={fetchData} className="text-sm text-brand-600 hover:underline flex items-center"><RefreshCw className="w-3 h-3 mr-1" /> Actualizar</button>
                   </div>
                   <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="text-xs font-semibold text-gray-500 border-b border-gray-100 bg-gray-50/50">
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Cliente</th>
                          <th className="px-6 py-4">Fecha</th>
                          <th className="px-6 py-4">Total</th>
                          <th className="px-6 py-4">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                           <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-mono text-gray-500">#{o.id.slice(0, 8)}</td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center">
                                      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold mr-3">
                                          {o.profiles?.full_name?.charAt(0) || 'U'}
                                      </div>
                                      <span className="text-sm font-medium text-gray-900">{o.profiles?.full_name || 'Desconocido'}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-sm font-bold text-gray-900">${o.total_amount}</td>
                              <td className="px-6 py-4">
                                  <select 
                                      value={o.status}
                                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                      className={`text-xs font-bold px-3 py-1.5 rounded-full border-none focus:ring-0 cursor-pointer
                                        ${o.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                          o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                          o.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                                  >
                                      <option value="pending">Pendiente</option>
                                      <option value="paid">Pagado</option>
                                      <option value="shipped">Enviado</option>
                                      <option value="cancelled">Cancelado</option>
                                  </select>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                   </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProductModal(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-lg text-gray-900">{currentProduct.id ? 'Editar Producto' : 'Crear Producto'}</h3>
                    <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="overflow-y-auto p-6">
                    <form onSubmit={handleSaveProduct} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Nombre</label>
                            <input required type="text" value={currentProduct.name || ''} onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5" />
                        </div>
                        
                        {/* CATEGORY SELECTOR */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Categoría</label>
                            <select 
                              value={currentProduct.category_id || ''} 
                              onChange={e => setCurrentProduct({...currentProduct, category_id: e.target.value})}
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
                            >
                              <option value="">Seleccionar categoría...</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Descripción</label>
                            <textarea rows={3} value={currentProduct.description || ''} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Precio</label>
                                <input required type="number" step="0.01" value={currentProduct.base_price || ''} onChange={e => setCurrentProduct({...currentProduct, base_price: parseFloat(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Stock</label>
                                <input required type="number" value={currentProduct.stock || ''} onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">URL Imagen</label>
                            <input required type="text" value={currentProduct.image_url || ''} onChange={e => setCurrentProduct({...currentProduct, image_url: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Colores (coma)</label>
                            <input type="text" value={Array.isArray(currentProduct.colors) ? currentProduct.colors.join(', ') : currentProduct.colors || ''} onChange={e => setCurrentProduct({...currentProduct, colors: e.target.value.split(',')})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Talles (coma)</label>
                            <input type="text" value={Array.isArray(currentProduct.sizes) ? currentProduct.sizes.join(', ') : currentProduct.sizes || ''} onChange={e => setCurrentProduct({...currentProduct, sizes: e.target.value.split(',')})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5" />
                        </div>
                        <button type="submit" disabled={actionLoading} className="w-full mt-4 bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex justify-center items-center">
                            {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Guardar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{currentCategory.id ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                    <button onClick={() => setShowCategoryModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                        <input required type="text" value={currentCategory.name || ''} onChange={e => setCurrentCategory({...currentCategory, name: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Slug (opcional)</label>
                        <input type="text" placeholder="auto-generado" value={currentCategory.slug || ''} onChange={e => setCurrentCategory({...currentCategory, slug: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <button type="submit" disabled={actionLoading} className="w-full bg-black text-white py-2 rounded-lg font-bold disabled:opacity-50 flex justify-center items-center">
                         {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Guardar'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCouponModal(false)}></div>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{currentCoupon.id ? 'Editar Cupón' : 'Nuevo Cupón'}</h3>
                    <button onClick={() => setShowCouponModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSaveCoupon} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Código (ej: VERANO2024)</label>
                        <input required type="text" value={currentCoupon.code || ''} onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2 uppercase" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Tipo Descuento</label>
                          <select 
                            value={currentCoupon.discount_type || 'percentage'} 
                            onChange={e => setCurrentCoupon({...currentCoupon, discount_type: e.target.value as any})}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2"
                          >
                            <option value="percentage">Porcentaje (%)</option>
                            <option value="fixed">Monto Fijo ($)</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Valor</label>
                          <input required type="number" value={currentCoupon.discount_value || ''} onChange={e => setCurrentCoupon({...currentCoupon, discount_value: parseFloat(e.target.value)})} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
                      </div>
                    </div>
                    <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="active" 
                          checked={currentCoupon.active !== undefined ? currentCoupon.active : true}
                          onChange={e => setCurrentCoupon({...currentCoupon, active: e.target.checked})}
                          className="mr-2 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <label htmlFor="active" className="text-sm text-gray-700">Activo</label>
                    </div>
                    <button type="submit" disabled={actionLoading} className="w-full bg-black text-white py-2 rounded-lg font-bold disabled:opacity-50 flex justify-center items-center">
                        {actionLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Guardar Cupón'}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;