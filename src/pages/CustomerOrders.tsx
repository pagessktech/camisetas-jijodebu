import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Package, Calendar, Loader2, ArrowLeft, ShoppingBag, Clock, AlertTriangle } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  size: string;
  color: string;
  price_at_purchase: number;
  custom_print_url?: string;
  products: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  order_items: OrderItem[];
}

interface CustomerOrdersProps {
  onBack: () => void;
}

const CustomerOrders: React.FC<CustomerOrdersProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (
                name,
                image_url
              )
            )
          `)
          .eq('user_id', user.id)
          // Eliminamos el filtro estricto para ver pedidos pendientes mientras probamos el flujo
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
                <button 
                onClick={onBack} 
                className="mr-4 text-gray-500 hover:text-brand-600 transition-colors"
                >
                <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
            </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tenés pedidos registrados</h3>
            <p className="mt-1 text-sm text-gray-500">Tus compras aparecerán aquí una vez generadas.</p>
            <div className="mt-6">
              <button
                onClick={onBack}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
              >
                Ir a la Tienda
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className={`bg-white rounded-lg shadow-sm overflow-hidden border ${order.status === 'pending' ? 'border-yellow-200' : 'border-gray-200'}`}>
                
                {/* Status Banner for Pending */}
                {order.status === 'pending' && (
                    <div className="bg-yellow-50 px-4 py-2 flex items-center text-xs text-yellow-800 border-b border-yellow-100">
                        <Clock className="w-3 h-3 mr-2" />
                        <span>Este pedido está esperando confirmación de pago. Si ya pagaste, se actualizará automáticamente en unos instantes.</span>
                    </div>
                )}

                {/* Order Header */}
                <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="w-full sm:w-auto">
                    <p className="text-xs text-gray-500">ID Pedido</p>
                    <p className="font-mono text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                  </div>
                  <div className="w-1/2 sm:w-auto">
                    <p className="text-xs text-gray-500">Fecha</p>
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="w-1/3 sm:w-auto">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-bold text-gray-900">${order.total_amount.toFixed(2)}</p>
                  </div>
                  <div className="w-full sm:w-auto mt-2 sm:mt-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                       {order.status === 'paid' ? 'Pagado' : 
                       order.status === 'shipped' ? 'Enviado' : 
                       order.status === 'pending' ? 'Pendiente' : order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <ul className="divide-y divide-gray-200">
                  {order.order_items.map((item) => (
                    <li key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center">
                      <div className="flex items-center mb-4 sm:mb-0">
                        <div className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md overflow-hidden relative bg-gray-50">
                            <img
                            src={item.products?.image_url || 'https://via.placeholder.com/150'}
                            alt={item.products?.name || 'Producto eliminado'}
                            className="w-full h-full object-center object-contain"
                            />
                            {item.custom_print_url && (
                                <div className="absolute inset-0 flex items-center justify-center p-2 opacity-90">
                                    <img src={item.custom_print_url} className="w-full h-full object-contain" alt="Custom Print" />
                                </div>
                            )}
                        </div>
                      </div>
                      
                      <div className="sm:ml-6 flex-1 flex flex-col sm:flex-row sm:justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.products?.name || 'Producto Desconocido'}</h4>
                          <p className="mt-1 text-sm text-gray-500">
                            Talle: {item.size} | Color: {item.color}
                          </p>
                        </div>
                        <div className="mt-2 sm:mt-0 flex items-center justify-between sm:flex-col sm:items-end sm:justify-center">
                          <p className="text-sm font-medium text-gray-900">
                             ${item.price_at_purchase.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                             Cant: {item.quantity}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                   <p className="text-xs text-gray-500 break-all w-3/4">Envío a: {order.shipping_address}</p>
                   {order.status === 'pending' && (
                       <div className="flex items-center text-xs text-red-500 font-medium">
                           <AlertTriangle className="w-3 h-3 mr-1" /> No pagado
                       </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;