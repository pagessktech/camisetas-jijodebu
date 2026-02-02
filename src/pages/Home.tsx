import React, { useState, useMemo } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Eye, SearchX, Filter, Package, PenTool, Truck, Mail, MapPin, Send, CheckCircle } from 'lucide-react';
import { Product, Category } from '../types';
import { Link } from 'react-router-dom';

interface HomeProps {
  products: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
}

const Home: React.FC<HomeProps> = ({ products, categories, onSelectProduct }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Contact Form State
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success'>('idle');

  const scrollToShop = (e: React.MouseEvent) => {
    e.preventDefault();
    const shopSection = document.getElementById('shop');
    shopSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return products;
    return products.filter(p => p.category_id === selectedCategory);
  }, [products, selectedCategory]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('sending');
    // Simulate backend delay
    setTimeout(() => {
        setContactStatus('success');
        // In a real app, this would POST to Supabase 'notifications' or an Edge Function.
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section - Full width visual */}
      <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-100 group">
        <img 
            src="https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=2000&auto=format&fit=crop" 
            alt="Hero Banner" 
            className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
             <div className="text-center bg-white/90 p-8 md:p-12 backdrop-blur-sm shadow-2xl max-w-[95%] md:max-w-2xl border-2 border-black/5 animate-fade-in-up">
                 <h2 className="text-3xl md:text-6xl font-extrabold text-black uppercase tracking-tighter mb-4 font-sans">
                     NUEVA COLECCIÓN
                 </h2>
                 <p className="text-lg md:text-xl text-gray-700 font-medium mb-8 max-w-lg mx-auto">
                    Calidad premium y diseños que hablan por vos. Descubrí lo nuevo de esta temporada.
                 </p>
                 <button onClick={scrollToShop} className="bg-black text-white px-10 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg text-sm md:text-base">
                     Comprar Ahora
                 </button>
             </div>
        </div>
      </section>

      {/* Categories Filter Bar */}
      <section id="shop" className="py-8 bg-white border-b border-gray-100 sticky top-20 z-40 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                <span className="flex items-center text-sm font-bold text-gray-900 mr-2 flex-shrink-0">
                    <Filter className="w-4 h-4 mr-2" /> Filtros:
                </span>
                <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all transform hover:scale-105 border ${
                        selectedCategory === 'all' 
                        ? 'bg-black text-white border-black shadow-md' 
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-white'
                    }`}
                >
                    Todos
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all transform hover:scale-105 border ${
                            selectedCategory === cat.id 
                            ? 'bg-black text-white border-black shadow-md' 
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-white'
                        }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 bg-white min-h-[600px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight uppercase">
                {selectedCategory === 'all' 
                    ? 'Nuestros Productos' 
                    : categories.find(c => c.id === selectedCategory)?.name || 'Productos'}
            </h2>
            <div className="w-24 h-1.5 bg-black mx-auto"></div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
               <div className="inline-block p-4 rounded-full bg-white mb-4 shadow-sm">
                   <SearchX className="h-10 w-10 text-gray-400" />
               </div>
               <h3 className="text-xl font-bold text-gray-900">No encontramos productos en esta categoría</h3>
               <p className="text-gray-500 mt-2 max-w-md mx-auto">Intenta seleccionar otra categoría o espera a que carguemos más stock de esta colección.</p>
               <button onClick={() => setSelectedCategory('all')} className="mt-6 text-black font-bold border-b-2 border-black pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors">
                   Ver todos los productos
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="group relative bg-white flex flex-col h-full"
                >
                  <div 
                      className="aspect-[1/1.1] w-full overflow-hidden rounded-2xl bg-gray-100 relative cursor-pointer shadow-sm group-hover:shadow-xl transition-all duration-300"
                      onClick={() => onSelectProduct(product)}
                  >
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Overlay Buttons */}
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelectProduct(product); }}
                            className="flex-1 bg-white text-black py-3 rounded-lg font-bold text-sm hover:bg-black hover:text-white shadow-lg transition-colors border border-gray-100"
                        >
                            VER DETALLES
                        </button>
                    </div>
                    {product.stock <= 0 && (
                        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider shadow-sm border border-white/20">
                            Agotado
                        </div>
                    )}
                  </div>
                  
                  <div className="mt-5 flex justify-between items-start flex-1">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 cursor-pointer hover:underline decoration-2 underline-offset-4" onClick={() => onSelectProduct(product)}>
                          {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 font-medium">{product.categories?.name || 'Clásico'}</p>
                    </div>
                    <p className="text-lg font-extrabold text-black font-mono tracking-tight">${product.base_price.toLocaleString('es-AR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- CÓMO FUNCIONA SECTION --- */}
      <section id="how-it-works" className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-xs font-black tracking-widest text-gray-400 uppercase mb-2 block">Experiencia Jijo</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">¿Cómo Funciona?</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-gray-200 z-0"></div>

                <div className="text-center group relative z-10">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:border-black transition-all duration-300">
                        <PenTool className="h-8 w-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">1. Elegí tu Estilo</h3>
                    <p className="text-gray-600 leading-relaxed px-4">Navegá por nuestro catálogo y seleccioná la prenda que más te guste. Elegí color y talle.</p>
                </div>
                <div className="text-center group relative z-10">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:border-black transition-all duration-300">
                        <Package className="h-8 w-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">2. Pagá Seguro</h3>
                    <p className="text-gray-600 leading-relaxed px-4">Procesamos tu pago de forma segura con Mercado Pago. Aceptamos todas las tarjetas.</p>
                </div>
                <div className="text-center group relative z-10">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:border-black transition-all duration-300">
                        <Truck className="h-8 w-8 text-black" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">3. Recibilo Rápido</h3>
                    <p className="text-gray-600 leading-relaxed px-4">Despachamos en 24hs. Recibí tu pedido en la puerta de tu casa con seguimiento online.</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- CONTACTO SECTION --- */}
      <section id="contact" className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                    <span className="text-xs font-black tracking-widest text-gray-400 uppercase">Soporte</span>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mt-2 mb-6">Estamos para ayudarte</h2>
                    <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                        ¿Tenés dudas sobre talles, envíos o querés hacer un pedido mayorista? 
                        Nuestro equipo está disponible de Lunes a Viernes de 9 a 18hs.
                    </p>
                    
                    <div className="space-y-8">
                        <div className="flex items-start group">
                            <div className="bg-gray-50 p-4 rounded-2xl mr-6 group-hover:bg-black group-hover:text-white transition-colors">
                                <Mail className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">Email</h4>
                                <p className="text-gray-500">contacto@camisetasjijo.com</p>
                            </div>
                        </div>
                        <div className="flex items-start group">
                            <div className="bg-gray-50 p-4 rounded-2xl mr-6 group-hover:bg-black group-hover:text-white transition-colors">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg">Showroom</h4>
                                <p className="text-gray-500">Av. Corrientes 1234, CABA</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100">
                    {contactStatus === 'success' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">¡Mensaje Enviado!</h3>
                            <p className="text-gray-600 mt-2 mb-8">Gracias por contactarnos. Te responderemos a la brevedad.</p>
                            <button onClick={() => setContactStatus('idle')} className="text-black font-bold hover:underline">Enviar otro mensaje</button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleContactSubmit}>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Envianos un mensaje</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Nombre</label>
                                    <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow" placeholder="Tu nombre" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Email</label>
                                    <input required type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow" placeholder="tu@email.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Mensaje</label>
                                <textarea required rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow" placeholder="¿En qué podemos ayudarte?"></textarea>
                            </div>
                            <button 
                                type="submit" 
                                disabled={contactStatus === 'sending'}
                                className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center transform hover:-translate-y-1 shadow-lg disabled:opacity-70 disabled:cursor-wait"
                            >
                                {contactStatus === 'sending' ? 'Enviando...' : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" /> Enviar Mensaje
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-black py-16 md:py-24 relative overflow-hidden">
          {/* Decorative Circle */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gray-800 opacity-20 blur-3xl"></div>
          
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
              <p className="text-yellow-500 text-xs font-black tracking-[0.2em] uppercase mb-4">Newsletter</p>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Sumate al Club Jijo</h2>
              <p className="text-gray-400 mb-10 text-lg max-w-xl mx-auto">Recibí las mejores ofertas, lanzamientos exclusivos y descuentos solo para suscriptores.</p>
              
              <form className="max-w-md mx-auto relative flex flex-col sm:flex-row gap-2 sm:gap-0" onSubmit={(e) => e.preventDefault()}>
                  <input 
                    type="email" 
                    placeholder="Tu email aquí" 
                    className="w-full rounded-xl sm:rounded-r-none px-6 py-4 text-gray-900 focus:outline-none text-base border-0 focus:ring-2 focus:ring-yellow-500"
                  />
                  <button type="submit" className="bg-yellow-500 text-black px-8 py-4 rounded-xl sm:rounded-l-none hover:bg-yellow-400 transition-colors font-bold flex items-center justify-center">
                      <span className="sm:hidden">Suscribirse</span>
                      <ArrowRight className="h-5 w-5 hidden sm:block" />
                  </button>
              </form>
          </div>
      </section>
    </div>
  );
};

export default Home;