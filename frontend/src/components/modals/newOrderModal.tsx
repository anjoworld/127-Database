'use client';

import React, { useEffect, useState } from "react";

export default function NewOrderModal({ onClose }: { onClose: () => void }) {
  const [orderId, setOrderId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [dateReceived, setDateReceived] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);


  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [ingredientSuggestions, setIngredientSuggestions] = useState<{ IngredientID: string; IngredientName: string; IngredientType: string; Unit: string }[]>([]);
  const [showIngredientSuggestions, setShowIngredientSuggestions] = useState(false);
  const [activeIngredientIndex, setActiveIngredientIndex] = useState(-1);

  const [unitSuggestions, setUnitSuggestions] = useState<string[]>([]);
  const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);
  const [activeUnitIndex, setActiveUnitIndex] = useState(-1);

  const [ingredientTouched, setIngredientTouched] = useState(false);
  const [isIngredientUnknown, setIsIngredientUnknown] = useState(false);


  const [newOrderItem, setNewOrderItem] = useState({
    name: "",
    quantity: 0,
    unit: "",
    id: "",
    type: "",
    spoilageMin: 0,
    spoilageMax: 0,
  });

  const [newIngredient, setNewIngredient] = useState({
    name: "",
    type: "",
    unit: ""
  });


  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedItem, setEditedItem] = useState<any>(null);

  // Fetch supplier suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!supplierName) {
        setSuggestions([]);
        setActiveIndex(-1);
        return;
      }

      try {
        const res = await fetch(`http://localhost:4000/suppliers?search=${supplierName}`);
        const data = await res.json();
        setSuggestions(data);
        const isExactMatch = data.some(
          (s: string) => s.toLowerCase() === supplierName.trim().toLowerCase()
        );
        setShowSuggestions(!isExactMatch && data.length > 0);
      } catch (err) {
        console.error("Failed to fetch supplier suggestions", err);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [supplierName]);

  useEffect(() => {
    setNewIngredient(prev => ({
      ...prev,
      name: newOrderItem.name
    }));
  }, [newOrderItem.name]);

  useEffect(() => {
    const fetchIngredientSuggestions = async () => {
      if (!newOrderItem.name.trim()) {
        setIngredientSuggestions([]);
        setShowIngredientSuggestions(false);
        setActiveIngredientIndex(-1);
        setIsIngredientUnknown(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:4000/ingredients?search=${newOrderItem.name}`);
        const data = await res.json();

        const filtered = data.filter((i: any) =>
          i.IngredientName.toLowerCase().includes(newOrderItem.name.toLowerCase())
        );

        setIngredientSuggestions(filtered);
        const isExactMatch = filtered.some(
          (i: any) => i.IngredientName.toLowerCase() === newOrderItem.name.trim().toLowerCase()
        );
        setShowIngredientSuggestions(!isExactMatch && filtered.length > 0);
        setIsIngredientUnknown(filtered.length === 0);
      } catch (err) {
        console.error("Failed to fetch ingredient suggestions", err);
      }
    };

    const debounce = setTimeout(fetchIngredientSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [newOrderItem.name]);

  const handleClose = async () => {
    console.log("orderId", orderId);
    if (orderId) {
      try {
        await fetch(`http://localhost:4000/orders/${orderId}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to delete unconfirmed order", err);
      }
    }
    console.log("trying to onclose");
    onClose();
    console.log("onclose successful");
  };

  const handleCreateOrder = async () => {
    if (!supplierName.trim() || !dateReceived.trim()) {
      alert("Supplier name and date received are required.");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ SupplierName: supplierName, DateReceived: dateReceived }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrderId(data.orderId);
        setConfirmed(true);
      } else {
        console.error("Error creating order:", data.error);
      }
    } catch (err) {
      console.error("Request failed:", err);
    }
  };

  const handleSuggestionClick = (name: string) => {
    setSupplierName(name);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleIngredientClick = (name: string) => {
    const selected = ingredientSuggestions.find(i => i.IngredientName === name);
    if (selected) {
      setNewOrderItem((prev) => ({
        ...prev,
        name: selected.IngredientName,
        id: selected.IngredientID,
        type: selected.IngredientType,
        unit: selected.Unit,
        spoilageMin: 1,
        spoilageMax: 1,
        quantity: 1,
      }));
      setUnitSuggestions([selected.Unit]);
      setIsIngredientUnknown(false);
    }
    setIngredientSuggestions([]);
    setShowIngredientSuggestions(false);
    setActiveIngredientIndex(-1);
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      handleSuggestionClick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleIngredientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showIngredientSuggestions || ingredientSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIngredientIndex((prev) => (prev + 1) % ingredientSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIngredientIndex((prev) => (prev - 1 + ingredientSuggestions.length) % ingredientSuggestions.length);
    } else if (e.key === "Enter" && activeIngredientIndex >= 0) {
      handleIngredientClick(ingredientSuggestions[activeIngredientIndex].IngredientName);
    } else if (e.key === "Escape") {
      setShowIngredientSuggestions(false);
    }
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    setEditedItem({ ...orderItems[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editedItem) {
      const updatedItems = [...orderItems];
      updatedItems[editingIndex] = editedItem;
      setOrderItems(updatedItems);
      setEditingIndex(null);
      setEditedItem(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedItem(null);
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditedItem(null);
    }
  };

  const renderOrderItems = () => {
    return orderItems.map((item, index) => (
      <div key={index} className="grid grid-cols-8 text-sm border-t border-gray-200 hover:bg-gray-50">
        {editingIndex === index ? (
          <>
            <div className="px-2 py-1">
              <input
                type="text"
                className="w-full border px-1 py-0.5 text-sm"
                value={editedItem.name}
                onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
              />
            </div>
            <div className="px-2 py-1">
              <input
                type="number"
                className="w-full border px-1 py-0.5 text-sm"
                value={editedItem.quantity}
                onChange={(e) => setEditedItem({ ...editedItem, quantity: +e.target.value })}
              />
            </div>
            <div className="px-2 py-1">
              <input
                type="text"
                className="w-full border px-1 py-0.5 text-sm"
                value={editedItem.unit}
                onChange={(e) => setEditedItem({ ...editedItem, unit: e.target.value })}
              />
            </div>
            <div className="px-2 py-1">
              <input
                type="text"
                className="w-full border px-1 py-0.5 text-sm"
                value={editedItem.id}
                onChange={(e) => setEditedItem({ ...editedItem, id: e.target.value })}
              />
            </div>
            <div className="px-2 py-1">
              <input
                type="text"
                className="w-full border px-1 py-0.5 text-sm"
                value={editedItem.type}
                onChange={(e) => setEditedItem({ ...editedItem, type: e.target.value })}
              />
            </div>
            <div className="px-2 py-1">
              <input
                type="number"
                className="w-full border px-1 py-0.5 text-sm"
                value={editedItem.spoilageMin}
                onChange={(e) => setEditedItem({ ...editedItem, spoilageMin: +e.target.value })}
              />
            </div>
            <div className="px-2 py-1">
              <input
                type="number"
                className="w-full border px-1 py-0.5 text-sm"
                value={editedItem.spoilageMax}
                onChange={(e) => setEditedItem({ ...editedItem, spoilageMax: +e.target.value })}
              />
            </div>
            <div className="px-2 py-1 flex gap-1">
              <button
                onClick={handleSaveEdit}
                className="bg-green-500 text-white px-1 w-10 text-xs rounded hover:bg-green-600"
                title="Save"
              >
                ✓
              </button>
              <button
                onClick={handleCancelEdit}
                className="bg-red-500 text-white px-1 w-10 text-xs rounded hover:bg-red-600"
                title="Cancel"
              >
                ✗
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="px-2 py-1">{item.name}</div>
            <div className="px-2 py-1">{item.quantity}</div>
            <div className="px-2 py-1">{item.unit}</div>
            <div className="px-2 py-1">{item.id}</div>
            <div className="px-2 py-1">{item.type}</div>
            <div className="px-2 py-1">{item.spoilageMin}</div>
            <div className="px-2 py-1">{item.spoilageMax}</div>
            <div className="px-2 py-1 flex gap-2">
              <button
                onClick={() => handleEditItem(index)}
                className="text-blue-500 hover:text-blue-700 text-xs"
                title="Edit"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteItem(index)}
                className="text-red-500 hover:text-red-700 text-xs"
                title="Delete"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

    ));
  };

  const handleConfirmOrder = async () => {
    if (!orderId) {
      alert("OrderID is missing. Please confirm supplier first.");
      return;
    }

    if (orderItems.length === 0) {
      alert("No items to order. Please add items to order.");
      return;
    }
    // Prepare items in the required format
    const itemsToSend = orderItems.map(item => ({
      IngredientName: item.name,
      ItemQuantity: Number(item.quantity) || 0,
      CurrentQuantity: Number(item.quantity) || 0,
      Unit: item.unit,
      id: Number(item.id),
      IngredientType: item.type,
      spoilageMin: item.spoilageMin,
      spoilageMax: item.spoilageMax,
      OrderID: orderId
    }));

    console.log("itemsToSend", itemsToSend);

    try {
      const res = await fetch(`http://localhost:4000/order-items/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToSend }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      alert("Order confirmed and saved!");
      onClose();
      window.location.reload();
    } catch (err) {
      console.error("Failed to confirm set of orders", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#f5f6fa] rounded-md w-[1000px] p-8 relative shadow-lg">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-2xl font-light text-black hover:text-gray-600"
        >
          &times;
        </button>

        <div className="mb-4">
          <div className="flex flex-wrap items-center justify-between mb-2">
            <div className="flex items-baseline gap-4">
              <h2 className="text-2xl font-bold">New Order</h2>
              <p>
                <span className="font-semibold text-base">Order ID:</span>
                <span className="font-normal text-base ml-2">{orderId ?? ""}</span>
              </p>
            </div>

            {orderItems.length > 0 && (
              <button
                onClick={handleConfirmOrder} 
                className="bg-gray-300 hover:bg-gray-400 text-black font-medium text-sm px-4 py-2 mr-5 rounded-sm"
                disabled = {orderItems.length === 0}
                title = {orderItems.length === 0 ? "Add items to order" : ""}
              >
                Confirm Order
              </button>
            )}
          </div>

          <hr className="border-gray-300" />
        </div>

        {!confirmed && (
          <div className="relative flex items-center gap-2">
            <label className="text-gray-500 font-light text-sm">Supplier Name:</label>
            <div className="relative">
              <input
                type="text"
                className="border border-gray-400 rounded-sm px-2 py-1 w-48 text-sm"
                value={supplierName}
                onChange={(e) => {
                  setSupplierName(e.target.value);
                  setActiveIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                //onBlur={() => setShowSuggestions(false)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-300 w-48 mt-1 text-sm shadow-sm max-h-40 overflow-y-auto">
                  {suggestions.map((s, idx) => (
                    <li
                      key={idx}
                      className={`px-2 py-1 cursor-pointer ${
                        idx === activeIndex ? "bg-gray-200" : "hover:bg-gray-100"
                      }`}
                      onMouseDown={() => handleSuggestionClick(s)}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            <label className="text-gray-500 font-light text-sm ml-2">Date Received:</label>
            <input 
              type="date"
              className="border border-gray-400 rounded-sm px-2 py-1 w-40 text-sm"
              value={dateReceived}
              onChange={e => setDateReceived(e.target.value)}
            />
            </div>
            <button
              onClick={handleCreateOrder}
              className="bg-gray-300 hover:bg-gray-400 text-black font-medium text-sm px-4 py-2 ml-5 rounded-sm"
            >
              Confirm Details
            </button>
          </div>
        )}

        {confirmed && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p><strong className="mr-2">Supplier Name:</strong>{supplierName}</p>
              </div>
            </div>

            <div className="border border-gray-400">
              <div className="grid grid-cols-8 text-sm bg-gray-100 font-medium sticky top-0 z-10">
                <div className="px-2 py-1">Name</div>
                <div className="px-2 py-1">Quantity</div>
                <div className="px-2 py-1">Unit</div>
                <div className="px-2 py-1">ID</div>
                <div className="px-2 py-1">Type</div>
                <div className="px-2 py-1 text-center">
                  <div>Spoilage Min</div>
                  <span className="text-xs text-gray-500 block text-center">(in days)</span>
                </div>
                <div className="px-2 py-1 text-center">
                  <div>Spoilage Max</div>
                  <span className="text-xs text-gray-500 block text-center">(in days)</span>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {renderOrderItems()}
              </div>
            </div>

            <div className="grid grid-cols-8 gap-2 items-center mt-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name"
                  className="border px-2 py-1 text-sm w-full"
                  value={newOrderItem.name}
                  onChange={(e) => {
                    setNewOrderItem({ ...newOrderItem, name: e.target.value });
                    setIngredientTouched(true);
                  }}
                  onKeyDown={handleIngredientKeyDown}
                />
                {showIngredientSuggestions && ingredientSuggestions.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 text-sm shadow-sm max-h-40 overflow-y-auto">
                    {ingredientSuggestions.map((s, idx) => (
                      <li
                        key={idx}
                        className={`px-2 py-1 cursor-pointer ${
                          idx === activeIngredientIndex ? "bg-gray-200" : "hover:bg-gray-100"
                        }`}
                        onMouseDown={() => handleIngredientClick(s.IngredientName)}
                        onBlur={() => setShowIngredientSuggestions(false)}
                      > 
                        {s.IngredientName}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input
                type="number"
                placeholder="Quantity"
                className="border px-2 py-1 text-sm"
                value={newOrderItem.quantity}
                onChange={(e) => setNewOrderItem({ ...newOrderItem, quantity: Math.max(1,+e.target.value)})}
              />
              <div className="relative">
                <input
                  placeholder="Unit"
                  className="border px-2 py-1 text-sm w-full"
                  value={newOrderItem.unit}
                  onChange={(e) => {
                    setNewOrderItem({ ...newOrderItem, unit: e.target.value });
                    setActiveUnitIndex(-1);
                  }}
                  onFocus={() => setShowUnitSuggestions(true)}
                  onBlur={() => setShowUnitSuggestions(false)}
                  onKeyDown={(e) => {
                    if (!showUnitSuggestions || unitSuggestions.length === 0) return;

                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveUnitIndex((prev) => (prev + 1) % unitSuggestions.length);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveUnitIndex((prev) => (prev - 1 + unitSuggestions.length) % unitSuggestions.length);
                    } else if (e.key === "Enter" && activeUnitIndex >= 0) {
                      setNewOrderItem({ ...newOrderItem, unit: unitSuggestions[activeUnitIndex] });
                      setShowUnitSuggestions(false);
                    } else if (e.key === "Escape") {
                      setShowUnitSuggestions(false);
                    }
                  }}
                />
                {showUnitSuggestions && unitSuggestions.length > 0 && (
                  <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 text-sm shadow-sm max-h-40 overflow-y-auto">
                    {unitSuggestions.map((unit, idx) => (
                      <li
                        key={idx}
                        className={`px-2 py-1 cursor-pointer ${
                          idx === activeUnitIndex ? "bg-gray-200" : "hover:bg-gray-100"
                        }`}
                        onMouseDown={() => {
                          setNewOrderItem({ ...newOrderItem, unit });
                          setShowUnitSuggestions(false);
                        }}
                      >
                        {unit}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input
                placeholder="ID"
                className="border px-2 py-1 text-sm"
                value={newOrderItem.id}
                readOnly
                // onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
              />
              <input
                placeholder="Type"
                className="border px-2 py-1 text-sm"
                value={newOrderItem.type}
                onChange={(e) => setNewOrderItem({ ...newOrderItem, type: e.target.value })}
              />
              <input
                type="number"
                placeholder="Min"
                className="border px-2 py-1 text-sm"
                value={newOrderItem.spoilageMin}
                min = {1}
                onChange={(e) => {
                  const newMin = Math.max(1,+e.target.value);
                  setNewOrderItem(prev => ({
                    ...prev,
                    spoilageMin: newMin,
                    spoilageMax: Math.max(prev.spoilageMax, newMin)
                  }));
                }}
              />
              <input
                type="number"
                placeholder="Max"
                className="border px-2 py-1 text-sm"
                value={newOrderItem.spoilageMax}
                min = {newOrderItem.spoilageMin}
                onChange={(e) => {
                  const min = newOrderItem.spoilageMin;
                  const value = Math.max(min, +e.target.value);
                  setNewOrderItem(prev => ({
                    ...prev,
                    spoilageMax: value
                  }));
                }}
              />

              <button
                onClick={() => {
                  const alreadyExists = orderItems.some(
                    item => item.name.trim().toLowerCase() === newOrderItem.name.trim().toLowerCase()
                  );
                  if (alreadyExists) {
                    alert("Ingredient already exists in the order.");
                    return;
                  }
                  setOrderItems([...orderItems, newOrderItem]);
                  setNewOrderItem({
                    name: "",
                    quantity: 0,
                    unit: "",
                    id: "",
                    type: "",
                    spoilageMin: 0,
                    spoilageMax: 0,
                  });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-black font-medium text-sm px-2 py-1 rounded-sm"
              >
                Add to Order
              </button>
            </div>

            {/* Add New Ingredient   */}
            <div className="col-span-8 mt-2">
              {/* Display error if ingredient is unknown */}
              {isIngredientUnknown && ingredientTouched && (
                <div className="text-xs text-red-600 mt-1">Ingredient unknown.</div>
              )}
              {isIngredientUnknown && (
                <div className="mb-4 border-t pt-4">
                  <h3 className="mb-2 font-semibold">Add New Ingredient</h3>
                  <div className="grid grid-cols-5 gap-2 text-sm mb-2">
                    <div>
                      <label className="text-gray-500 font-light text-sm">Name:</label>
                      <input
                        type="text"
                        placeholder=""
                        value={newIngredient.name}
                        readOnly
                        className="w-full border px-2 py-1 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 font-light text-sm">Type:</label>
                      <input
                        type="text"
                        placeholder="Type"
                        value={newIngredient.type}
                        onChange={(e) => setNewIngredient({ ...newIngredient, type: e.target.value })}
                        className="w-full border px-2 py-1 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 font-light text-sm">Unit of Measurement:</label>
                      <input
                        type="text"
                        placeholder="Unit"
                        value={newIngredient.unit}
                        onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                        className="w-full border px-2 py-1 rounded"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("http://localhost:4000/ingredients", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              IngredientName: newIngredient.name,
                              IngredientType: newIngredient.type,
                              Unit: newIngredient.unit,
                            }),
                          });

                          if (!res.ok) {
                            const data = await res.json();
                            alert("Failed to add ingredient: " + (data.error || res.statusText));
                            return;
                          }

                          const data = await res.json();

                        setNewOrderItem(
                          {
                            name:newIngredient.name,
                            quantity: 1,
                            unit: newIngredient.unit,
                            id: data.id ? String(data.id) : "",
                            type: newIngredient.type,
                            spoilageMin: 1,
                            spoilageMax: 1,
                          }
                        );
                        setNewIngredient({
                          name: "",
                          unit: "",
                          type: ""
                        });
                        setIsIngredientUnknown(false);
                      } catch (err) {
                        console.error("Failed to add ingredient", err);
                      }
                    }}
                      className="mt-5 bg-gray-300 hover:bg-gray-400 text-black font-medium text-sm px-2 py-1 rounded-sm"
                    >
                      Add New Ingredient
                  </button>
                  </div>
                </div>
              )}
            </div>
          </div>       
        )}
      </div>
    </div>
  );
}