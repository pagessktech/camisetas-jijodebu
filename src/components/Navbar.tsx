import React, { useState } from 'react';
import { ShoppingCart, Menu, X, Search, User, MessageSquareText, LayoutDashboard, Package, LogOut, Shirt } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onSearch: (query: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const { items, setIsCartOpen } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    onSearch(searchTerm);
    setIsMobileMenuOpen(false);
    navigate('/');
    // Small delay to allow navigation before scrolling
    setTimeout(() => {
        const element = document.getElementById('shop');
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleLogout = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const scrollToSection = (id: string) => {
    navigate('/');
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="sticky top-0 z-50">
      {/* Top Bar: Black Background */}
      <nav className="bg-black text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer group">
               <div className="border-2 border-yellow-500 p-1 rounded mr-2 group-hover:bg-yellow-500 transition-colors">
                 <Shirt className="h-6 w-6 text-yellow-500 group-hover:text-black" />
               </div>
               <span className="font-extrabold text-2xl tracking-tight text-white">CAMISETAS JIJO</span>
            </Link>

            {/* Search Bar (Hidden on mobile, centered) */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                  placeholder="Buscar productos..." 
                  className="w-full bg-white text-gray-900 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button 
                  onClick={() => handleSearchSubmit()}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700 text-gray-500"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Right Icons */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('contact')}
                className="flex flex-col items-center group text-gray-300 hover:text-white transition-colors"
              >
                <MessageSquareText className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium">Ayuda</span>
              </button>

              <div className="relative">
                <button 
                  onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : navigate('/auth')}
                  className="flex flex-col items-center group text-gray-300 hover:text-white transition-colors"
                >
                  <User className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">Mi cuenta</span>
                </button>
                 {/* Dropdown for User */}
                 {isUserMenuOpen && user && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl py-2 ring-1 ring-black ring-opacity-5 z-50 text-gray-900 origin-top-right transform transition-all">
                    <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                      <p className="text-xs text-gray-500">Conectado como</p>
                      <p className="font-bold truncate">{user.user_metadata?.full_name || user.email}</p>
                    </div>
                    <Link to="/orders" onClick={() => setIsUserMenuOpen(false)} className="flex items-center w-full px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors">
                       <Package className="h-4 w-4 mr-2 text-gray-500" /> Mis Pedidos
                     </Link>
                    {isAdmin && (
                       <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center w-full px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors">
                       <LayoutDashboard className="h-4 w-4 mr-2 text-gray-500" /> Panel Admin
                     </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100">
                      <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsCartOpen(true)}
                className="flex flex-col items-center relative group text-gray-300 hover:text-white transition-colors"
              >
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                      {items.length}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">Carrito</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
                 <button 
                  onClick={() => setIsCartOpen(true)}
                  className="mr-5 relative text-white"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-gray-300 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sub-Navbar (Navigation Links) */}
      <div className="bg-[#111] border-t border-gray-800 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex space-x-10 h-12 items-center justify-center text-sm font-medium text-gray-400">
              <Link to="/" className="hover:text-white transition-colors uppercase tracking-widest text-xs">Inicio</Link>
              <button onClick={() => scrollToSection('shop')} className="hover:text-white transition-colors uppercase tracking-widest text-xs">Productos</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors uppercase tracking-widest text-xs">Cómo Funciona</button>
              <button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors uppercase tracking-widest text-xs">Contacto</button>
           </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-gray-800 text-white absolute w-full shadow-xl">
          <div className="px-4 pt-4 pb-2">
            <input 
                  type="text" 
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                  placeholder="¿Qué estás buscando?" 
                  className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-lg py-3 px-4 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="px-2 space-y-1 pb-4">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left px-3 py-3 text-sm font-bold tracking-wide hover:bg-gray-800 rounded-lg">INICIO</Link>
            <button onClick={() => scrollToSection('shop')} className="block w-full text-left px-3 py-3 text-sm font-bold tracking-wide hover:bg-gray-800 rounded-lg">PRODUCTOS</button>
            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-3 py-3 text-sm font-bold tracking-wide hover:bg-gray-800 rounded-lg">CÓMO FUNCIONA</button>
            <button onClick={() => scrollToSection('contact')} className="block w-full text-left px-3 py-3 text-sm font-bold tracking-wide hover:bg-gray-800 rounded-lg">CONTACTO</button>
            
            <div className="border-t border-gray-800 my-2 pt-2">
                {user ? (
                <>
                    <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left px-3 py-3 text-sm font-bold text-gray-300 hover:bg-gray-800 rounded-lg flex items-center">
                        <Package className="w-4 h-4 mr-2" /> MIS PEDIDOS
                    </Link>
                    {isAdmin && (
                        <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left px-3 py-3 text-sm font-bold text-gray-300 hover:bg-gray-800 rounded-lg flex items-center">
                            <LayoutDashboard className="w-4 h-4 mr-2" /> ADMIN
                        </Link>
                    )}
                    <button onClick={handleLogout} className="block w-full text-left px-3 py-3 text-sm font-bold text-red-400 hover:bg-gray-800 rounded-lg flex items-center">
                        <LogOut className="w-4 h-4 mr-2" /> CERRAR SESIÓN
                    </button>
                </>
                ) : (
                    <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-left px-3 py-3 text-sm font-bold text-yellow-500 hover:bg-gray-800 rounded-lg">INGRESAR / REGISTRARSE</Link>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;