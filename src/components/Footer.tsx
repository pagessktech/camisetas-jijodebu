import React from 'react';
import { Facebook, Instagram, Mail, CreditCard, Banknote, MapPin, ChevronRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <footer className="bg-[#0a0a0a] text-gray-400 pt-16 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand */}
          <div className="space-y-6">
              <h3 className="text-white text-xl font-extrabold tracking-tight">CAMISETAS JIJO</h3>
              <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
                  Creamos ropa que cuenta historias. Calidad premium, diseños únicos y una experiencia de compra pensada para vos.
              </p>
              <div className="flex space-x-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="bg-gray-900 hover:bg-white hover:text-black p-2.5 rounded-full transition-all duration-300">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-gray-900 hover:bg-white hover:text-black p-2.5 rounded-full transition-all duration-300">
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
          </div>

          {/* Categorías */}
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-6">Navegación</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors flex items-center"><ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Inicio</Link></li>
              <li><button onClick={() => scrollToSection('shop')} className="hover:text-white transition-colors flex items-center"><ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Productos</button></li>
              <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors flex items-center"><ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Cómo Funciona</button></li>
              <li><Link to="/orders" className="hover:text-white transition-colors flex items-center"><ChevronRight className="h-3 w-3 mr-2 opacity-50" /> Mis Pedidos</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-6">Información</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
              <li><Link to="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
              <li><Link to="/defensa-consumidor" className="hover:text-white transition-colors">Defensa del Consumidor</Link></li>
              <li><button onClick={() => scrollToSection('contact')} className="hover:text-white transition-colors">Preguntas Frecuentes</button></li>
            </ul>
          </div>

          {/* Contactános */}
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-6">Contacto</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-gray-600 flex-shrink-0" />
                <span>Av. Corrientes 1234, CABA<br/>Buenos Aires, Argentina</span>
              </li>
              <li className="flex items-center">
                 <div className="bg-green-600 text-white p-0.5 rounded mr-3 flex-shrink-0">
                  <span className="font-bold text-[9px] px-1">WA</span>
                </div>
                <span>+54 11 5772 1355</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-gray-600 flex-shrink-0" />
                <a href="mailto:contacto@camisetasjijo.com" className="hover:text-white transition-colors">contacto@camisetasjijo.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Medios de pago separator */}
        <div className="border-t border-gray-900 pt-8 pb-12 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2">
               <ShieldCheck className="h-5 w-5 text-gray-600" />
               <span className="text-xs text-gray-500 font-medium">Compra 100% Segura</span>
           </div>
           <div className="flex flex-wrap gap-2 justify-center">
              <div className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-2 border border-gray-700">
                 <CreditCard className="h-3 w-3" /> VISA
              </div>
              <div className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-2 border border-gray-700">
                 <CreditCard className="h-3 w-3" /> MASTER
              </div>
              <div className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-2 border border-gray-700">
                 <CreditCard className="h-3 w-3" /> AMEX
              </div>
              <div className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-2 border border-blue-900/50">
                 Mercado Pago
              </div>
               <div className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-2 border border-gray-700">
                 <Banknote className="h-3 w-3 text-green-500" /> EFECTIVO
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-black py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
          <p>© 2024 Camisetas Jijo. Todos los derechos reservados.</p>
          <p className="mt-2 md:mt-0">Desarrollado con ❤️ en Buenos Aires</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;