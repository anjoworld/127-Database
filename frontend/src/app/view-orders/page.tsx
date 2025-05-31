'use client';

import React, { useState, useEffect } from 'react';

type Item = {
  name: string;
  quantity: number;
  unit: string;
  id: number;
  type: string;
  spoilageMin: number;
  spoilageMax: number;
};

type Order = {
  OrderID: number;
  DateReceived: string;
  SupplierName: string;
};

export default function ViewOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<number, Item[]>>({});
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingItemsFor, setLoadingItemsFor] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('http://localhost:4000/orders');
        const data: Order[] = await res.json();
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  const toggleExpand = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    if (!orderItems[orderId]) {
      setLoadingItemsFor(orderId);
      try {
        const res = await fetch(`http://localhost:4000/order-items/${orderId}`);
        if (!res.ok) throw new Error('Failed to fetch order items');
        const rawItems = await res.json();
        const mappedItems: Item[] = rawItems.map((item: any) => ({
          name: item.IngredientName,
          quantity: item.Quantity,
          unit: item.Unit,
          id: item.id,
          type: item.IngredientType,
          spoilageMin: item.spoilageMin,
          spoilageMax: item.spoilageMax,
        }));
        setOrderItems(prev => ({ ...prev, [orderId]: mappedItems }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingItemsFor(null);
      }
    }

    setExpandedOrderId(orderId);
  };

  if (loadingOrders) return <div className="p-4">Loading orders...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 min-h-screen bg-[#EDF0F9]">
      <div className="bg-white rounded-md shadow-md w-full md:w-1/3 p-4">
        <h2 className="text-lg font-semibold mb-4">My Orders</h2>
        {orders.map(order => (
          <div
            key={order.OrderID}
            className="border p-3 rounded-md bg-gray-50 mb-3 cursor-pointer"
            onClick={() => toggleExpand(order.OrderID)}
          >
            <div className="font-semibold">Order ID: {order.OrderID}</div>
            <div className="text-sm text-gray-600">
              Supplier Name: <span className="font-medium">{order.SupplierName}</span>
            </div>
            <div className="text-sm text-gray-600">Date Received: {order.DateReceived}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-md shadow-md w-full md:w-2/3 p-4 overflow-auto">
        <h2 className="text-lg font-semibold mb-4">Order Details</h2>

        {expandedOrderId === null && (
          <div className="text-gray-500">Click an order to see its items.</div>
        )}

        {expandedOrderId !== null && (
        <>
            {loadingItemsFor === expandedOrderId ? (
            <div>Loading items...</div>
            ) : (
            <>
                {/* Display Order Info Header */}
                {(() => {
                const currentOrder = orders.find(order => order.OrderID === expandedOrderId);
                if (!currentOrder) return null;
                return (
                    <div className="mb-4 border-b pb-2">
                    <div className="text-lg font-semibold">Order ID: {currentOrder.OrderID}</div>
                    <div className="text-sm text-gray-700">Date Received: {currentOrder.DateReceived}</div>
                    <div className="text-sm text-gray-700">Supplier Name: {currentOrder.SupplierName}</div>
                    </div>
                );
                })()}

                {/* Display Table or No Items Message */}
                {orderItems[expandedOrderId] && orderItems[expandedOrderId].length > 0 ? (
                <table className="w-full text-sm text-left border-collapse border border-gray-300">
                    <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                        <th className="border border-gray-300 px-2 py-1">Name</th>
                        <th className="border border-gray-300 px-2 py-1">Quantity</th>
                        <th className="border border-gray-300 px-2 py-1">Unit</th>
                        <th className="border border-gray-300 px-2 py-1">ID</th>
                        <th className="border border-gray-300 px-2 py-1">Type</th>
                        <th className="border border-gray-300 px-2 py-1">Spoilage Min (Days)</th>
                        <th className="border border-gray-300 px-2 py-1">Spoilage Max (Days)</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orderItems[expandedOrderId].map((item, i) => (
                        <tr key={i} className="border border-gray-300">
                        <td className="px-2 py-1">{item.name}</td>
                        <td className="px-2 py-1">{item.quantity}</td>
                        <td className="px-2 py-1">{item.unit}</td>
                        <td className="px-2 py-1">{item.id}</td>
                        <td className="px-2 py-1">{item.type}</td>
                        <td className="px-2 py-1 text-center">{item.spoilageMin}</td>
                        <td className="px-2 py-1 text-center">{item.spoilageMax}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                ) : (
                <div>No items found for this order.</div>
                )}
            </>
            )}
        </>
        )}
      </div>
    </div>
  );
}
