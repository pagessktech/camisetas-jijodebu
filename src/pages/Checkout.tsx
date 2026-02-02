import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle, Loader2, Tag, AlertCircle } from 'lucide-react';
import { Coupon } from '../types';

interface CheckoutProps {
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ onBack }) => {
  const { items, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    zip: '',
  });

  // Calculate final total with discount
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discount_type === 'percentage' 
        ? (cartTotal * appliedCoupon.discount_value / 100) 
        : appliedCoupon.discount_value)
    : 0;
  
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  // Check for success params from Mercado Pago redirect
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const status = query.get('status');
    const collectionStatus = query.get('collection_status');
    
    // Si la redirección dice aprobado, mostramos éxito en UI inmediatamente
    // El backend (Webhook) se encargará de la confirmación segura en la BD en segundo plano
    const handleSuccess = async () => {
      if (status === 'approved' || collectionStatus === 'approved') {
        setIsProcessing(true);
        const pendingOrderId = localStorage.getItem('pendingOrderId');
        
        // Opcional: Intento optimista de actualización desde el cliente por si el webhook demora
        if (pendingOrderId) {
          try {
            await supabase.from('orders').update({ status: 'paid' }).eq('id', pendingOrderId);
            localStorage.removeItem('pendingOrderId');
          } catch (err) {
            console.error('Error post-payment client-side:', err);
          }
        }

        setIsSuccess(true);
        setIsProcessing(false);
        clearCart();
        // Limpiamos la URL para que no se vuelva a ejecutar al refrescar
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleSuccess();
  }, [clearCart]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    setAppliedCoupon(null);

    try {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', couponCode.toUpperCase())
            .eq('active', true)
            .single();

        if (error || !data) {
            setCouponError('Cupón inválido o inexistente.');
        } else {
            // Check usage limit
            if (data.usage_limit && data.used_count >= data.usage_limit) {
                setCouponError('Este cupón ya alcanzó su límite de uso.');
            } else {
                setAppliedCoupon(data);
            }
        }
    } catch (err) {
        setCouponError('Error al validar el cupón.');
    } finally {
        setIsValidatingCoupon(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!user) {
      alert("Por favor, inicia sesión para completar tu compra y guardar tu pedido.");
      setIsProcessing(false);
      return;
    }

    try {
      // 1. SAVE ORDER TO SUPABASE
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: finalTotal, // Use discounted total
          status: 'pending',
          shipping_address: `${formData.address}, ${formData.city}, ${formData.zip}`
        })
        .select()
        .single();

      if (orderError) throw new Error(`Error BD Orden: ${orderError.message}`);

      // 2. SAVE ORDER ITEMS
      const orderItemsData = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        size: item.selectedSize,
        color: item.selectedColor,
        custom_print_url: item.customDesignUrl || null,
        price_at_purchase: item.product.base_price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
      if (itemsError) throw new Error(`Error BD Items: ${itemsError.message}`);

      // 3. UPDATE COUPON USAGE IF APPLIED
      if (appliedCoupon) {
          await supabase.from('coupons').update({ 
              used_count: appliedCoupon.used_count + 1 
          }).eq('id', appliedCoupon.id);
      }

      localStorage.setItem('pendingOrderId', orderData.id);

      // 4. PROCESS PAYMENT WITH BACKEND
      // Enviamos el ID de la orden para usarlo como external_reference
      const paymentData = {
        titulo: `Camisetas Jijo Pedido #${orderData.id.slice(0,8)}`,
        precio: Number(finalTotal.toFixed(2)), 
        orderId: orderData.id 
      };

      const response = await fetch('https://mp-backend-kappa-blond.vercel.app/api/crear-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      if (data && data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('No se pudo generar el link de pago.');
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      alert(`Error iniciando el pago: ${(error as Error).message}`);
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pedido Confirmado!</h2>
          <p className="text-gray-500 mb-6">
             Recibimos tu pago correctamente. Te hemos enviado un correo con los detalles y ya estamos procesando tu pedido.
          </p>
          <button 
            onClick={onBack}
            className="w-full bg-brand-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Seguir Comprando
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing && !items.length) {
     return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-brand-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Procesando tu compra...</p>
      </div>
     )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-4">
         <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h2>
            <button onClick={onBack} className="mt-4 text-brand-600 font-medium hover:underline">
                Volver a la tienda
            </button>
         </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack} 
          className="mb-8 flex items-center text-gray-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Volver a la Tienda
        </button>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          {/* Order Summary */}
          <div className="order-2 lg:order-2 mt-10 lg:mt-0">
            <h2 className="text-lg font-medium text-gray-900">Resumen del Pedido</h2>
            <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <ul className="divide-y divide-gray-200">
                {items.map((item) => (
                  <li key={item.id} className="flex py-6 px-4 sm:px-6">
                    <div className="flex-shrink-0 relative border border-gray-200 rounded-md overflow-hidden h-20 w-20">
                      <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover object-center" />
                    </div>
                    <div className="ml-4 flex-1 flex flex-col">
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>{item.product.name}</h3>
                        <p>${(item.product.base_price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{item.selectedColor} | Talle {item.selectedSize}</p>
                      <p className="mt-1 text-sm text-gray-500">Cant. {item.quantity}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Coupon Section */}
              <div className="border-t border-gray-200 py-4 px-4 sm:px-6 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código de Descuento</label>
                  <div className="flex space-x-2">
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                        placeholder="Ingresá tu cupón"
                        className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm p-2 border uppercase"
                      />
                      {appliedCoupon ? (
                          <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="bg-red-100 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200">
                              Quitar
                          </button>
                      ) : (
                          <button 
                            onClick={handleApplyCoupon} 
                            disabled={!couponCode || isValidatingCoupon}
                            className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                          >
                              {isValidatingCoupon ? '...' : 'Aplicar'}
                          </button>
                      )}
                  </div>
                  {couponError && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" /> {couponError}</p>}
                  {appliedCoupon && (
                      <p className="mt-2 text-sm text-green-600 flex items-center">
                          <Tag className="w-4 h-4 mr-1" /> Cupón <b>{appliedCoupon.code}</b> aplicado correctamente.
                      </p>
                  )}
              </div>

              <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                <div className="flex items-center justify-between mb-2">
                  <dt className="text-sm text-gray-600">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900">${cartTotal.toFixed(2)}</dd>
                </div>
                {appliedCoupon && (
                    <div className="flex items-center justify-between mb-2 text-green-600">
                        <dt className="text-sm">Descuento ({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `$${appliedCoupon.discount_value}`})</dt>
                        <dd className="text-sm font-bold">-${discountAmount.toFixed(2)}</dd>
                    </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-bold text-gray-900">Total</dt>
                  <dd className="text-base font-bold text-gray-900">${finalTotal.toFixed(2)}</dd>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-1">
            <h2 className="text-lg font-medium text-gray-900">Datos de Envío</h2>
            <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 border" />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 border" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 border" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 border" />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                <input type="text" name="city" required value={formData.city} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 border" />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Código Postal</label>
                <input type="text" name="zip" required value={formData.zip} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 border" />
              </div>

              <div className="sm:col-span-2 mt-6">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex justify-center items-center bg-brand-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Redirigiendo...
                    </>
                  ) : (
                    `Pagar $${finalTotal.toFixed(2)}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;