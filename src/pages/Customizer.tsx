import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface CustomizerProps {
  product: Product;
  onBack: () => void;
}

const Customizer: React.FC<CustomizerProps> = ({ product, onBack }) => {
  const { addToCart } = useCart();
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);

  const handleAddToCart = () => {
    // Pass undefined for the design URL as AI is disabled
    addToCart(product, selectedSize, selectedColor, undefined);
    onBack();
  };

  return (
    <div className="min-h-screen bg-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack} 
          className="mb-8 flex items-center text-gray-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Volver a la Tienda
        </button>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          {/* Product Preview Area */}
          <div className="mt-6 lg:mt-0 relative">
            <div className="aspect-w-1 aspect-h-1 rounded-3xl overflow-hidden bg-gray-100 relative shadow-inner">
               {/* Base T-Shirt */}
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-center object-contain p-8"
              />
            </div>
            
            {/* Color Overlay Hint */}
             <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-gray-500 border border-gray-200">
                Color Seleccionado: {selectedColor}
             </div>
          </div>

          {/* Controls Area */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
            <div className="mt-3">
              <h2 className="sr-only">Información del producto</h2>
              <p className="text-3xl text-gray-900">${product.base_price.toFixed(2)}</p>
            </div>

            <div className="mt-6">
               <h3 className="text-sm font-medium text-gray-900">Descripción</h3>
               <p className="text-gray-500 mt-2">{product.description}</p>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
              
              {/* Color Picker */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900">Color</h3>
                <div className="mt-2 flex items-center space-x-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none ring-gray-400 ${
                        selectedColor === color ? 'ring ring-offset-1' : ''
                      }`}
                      onClick={() => setSelectedColor(color)}
                    >
                      <span className="sr-only">{color}</span>
                      <span
                        aria-hidden="true"
                        className="h-8 w-8 rounded-full border border-black border-opacity-10"
                        style={{ backgroundColor: color === 'heather_grey' ? '#d1d5db' : color === 'navy' ? '#0f172a' : color === 'natural' ? '#f5f5dc' : color }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Picker */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900">Talle</h3>
                <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`group relative flex items-center justify-center rounded-md border py-3 px-2 sm:px-4 text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none ${
                        selectedSize === size
                          ? 'border-transparent bg-brand-600 text-white hover:bg-brand-700'
                          : 'border-gray-200 text-gray-900 bg-white shadow-sm'
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      <span>{size}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                className="mt-8 w-full flex items-center justify-center rounded-md border border-transparent bg-brand-600 px-8 py-4 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                onClick={handleAddToCart}
              >
                Agregar al Carrito - ${(product.base_price).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customizer;