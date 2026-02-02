import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface LegalProps {
  type: 'terms' | 'privacy' | 'consumer';
}

const Legal: React.FC<LegalProps> = ({ type }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const renderContent = () => {
    switch (type) {
      case 'terms':
        return (
          <>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Términos y Condiciones</h1>
            <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
              <p>Bienvenido a Camisetas Jijo. Al acceder a nuestro sitio web, aceptás los siguientes términos y condiciones.</p>
              <h3 className="text-xl font-bold text-gray-900 mt-6">1. Productos y Precios</h3>
              <p>Todos los precios están expresados en Pesos Argentinos e incluyen IVA. Nos reservamos el derecho de modificar precios sin previo aviso.</p>
              <h3 className="text-xl font-bold text-gray-900 mt-6">2. Envíos</h3>
              <p>Realizamos envíos a todo el país. Los tiempos de entrega son estimados y pueden variar según la logística del correo.</p>
              <h3 className="text-xl font-bold text-gray-900 mt-6">3. Cambios y Devoluciones</h3>
              <p>Tenés 30 días para realizar cambios. La prenda debe estar sin uso y con etiqueta.</p>
            </div>
          </>
        );
      case 'privacy':
        return (
          <>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Política de Privacidad</h1>
            <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
              <p>En Camisetas Jijo nos tomamos muy en serio la privacidad de tus datos.</p>
              <h3 className="text-xl font-bold text-gray-900 mt-6">1. Recolección de Datos</h3>
              <p>Solo recolectamos los datos necesarios para procesar tu pedido (Nombre, Dirección, Email).</p>
              <h3 className="text-xl font-bold text-gray-900 mt-6">2. Uso de la información</h3>
              <p>No compartimos tu información con terceros, excepto con los proveedores logísticos para realizar la entrega.</p>
              <h3 className="text-xl font-bold text-gray-900 mt-6">3. Seguridad</h3>
              <p>Utilizamos SSL para encriptar toda la comunicación en nuestro sitio.</p>
            </div>
          </>
        );
      case 'consumer':
        return (
          <>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Defensa del Consumidor</h1>
            <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
              <p>Para reclamos ingrese aquí: <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" className="text-blue-600 underline">Ventanilla Única Federal</a></p>
              <p className="mt-4 font-bold">Dirección General de Defensa y Protección al Consumidor</p>
              <p>Consultas y/o denuncias: <a href="https://buenosaires.gob.ar" className="text-blue-600 underline">buenosaires.gob.ar</a></p>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white pt-12 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Legal;