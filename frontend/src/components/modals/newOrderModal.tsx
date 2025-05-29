'use client';

import React, { useEffect, useState } from "react";

export default function NewOrderModal({ onClose }: { onClose: () => void }) {
  const [orderId, setOrderId] = useState<number | null>(null);
  const [batchId, setBatchId] = useState<number | null>(123); // Placeholder batch ID
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
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



  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 0,
    unit: "",
    id: "",
    type: "",
    spoilageMin: 0,
    spoilageMax: 0,
  });

  const [orderItems, setOrderItems] = useState<any[]>([]);

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
        setShowSuggestions(true);
      } catch (err) {
        console.error("Failed to fetch supplier suggestions", err);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [supplierName]);

  // Fetch ingredient suggestions
  useEffect(() => {
  const fetchIngredientSuggestions = async () => {
    if (!newItem.name) {
      setIngredientSuggestions([]);
      setActiveIngredientIndex(-1);
      // setShowIngredientSuggestions(false); // Also hide if empty
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/ingredients?search=${newItem.name}`);
      const data = await res.json();

      setIngredientSuggestions(data);
      setShowIngredientSuggestions(true);
    } catch (err) {
      console.error("Failed to fetch ingredient suggestions", err);
    }
  };

  const debounce = setTimeout(fetchIngredientSuggestions, 300);
  return () => clearTimeout(debounce);
}, [newItem.name]);


  const handleCreateOrder = async () => {
    try {
      const res = await fetch("http://localhost:4000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ SupplierName: supplierName }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrderId(data.orderId);
        setSupplierPhone(data.phone ?? "09123456789");
        setSupplierEmail(data.email ?? "supplier@example.com");
        setBatchId(data.batchId ?? 123);
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
      setNewItem((prev) => ({
        ...prev,
        name: selected.IngredientName,
        id: selected.IngredientID,
        type: selected.IngredientType,
        unit: selected.Unit,
      }));
      setUnitSuggestions([selected.Unit]); // populate unit suggestions
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


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#f5f6fa] rounded-md w-[1000px] p-8 relative shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-light text-black hover:text-gray-600"
        >
          &times;
        </button>

        <div className="mb-4">
          <div className="flex items-baseline gap-4">
            <h2 className="text-2xl font-bold">New Order</h2>
            <p className="ml-5">
              <span className="font-semibold text-base">Order ID:</span>
              <span className="font-normal text-base ml-2">{orderId ?? ""}</span>
            </p>
          </div>
          <hr className="my-2 border-gray-300" />
        </div>

        {/* Form Row */}
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
            </div>

            <label className="text-gray-500 font-light text-sm">Phone no. :</label>
            <input
              type="text"
              className="border border-gray-400 rounded-sm px-2 py-1 w-48 text-sm"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
            />
            <label className="text-gray-500 font-light text-sm">Email:</label>
            <input
              type="email"
              className="border border-gray-400 rounded-sm px-2 py-1 w-48 text-sm"
              value={supplierEmail}
              onChange={(e) => setSupplierEmail(e.target.value)}
            />
            <button
              onClick={handleCreateOrder}
              className="bg-gray-300 hover:bg-gray-400 text-black font-medium text-sm px-4 py-2 ml-5 rounded-sm"
            >
              Confirm Supplier
            </button>
          </div>
        )}

        {/* After Confirmation */}
        {confirmed && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between">
              <div>
                <p><strong className="mr-2">Batch ID:</strong>{batchId ?? "N/A"}</p>
                <p><strong className="mr-2">Supplier Name:</strong>{supplierName}</p>
              </div>
              <div>
                <p><strong className="mr-2">Contacts:</strong>{supplierPhone} / {supplierEmail}</p>
              </div>
            </div>

            <div className="border border-gray-400">
              <div className="grid grid-cols-7 text-sm bg-gray-100 font-medium sticky top-0 z-10">
                <div className="px-2 py-1">Name</div>
                <div className="px-2 py-1">Quantity</div>
                <div className="px-2 py-1">Unit</div>
                <div className="px-2 py-1">ID</div>
                <div className="px-2 py-1">Type</div>
                <div className="px-2 py-1">Spoilage Min (in days)</div>
                <div className="px-2 py-1">Spoilage Max (in days)</div>
              </div>

              {/* Scrollable container */}
              <div className="max-h-60 overflow-y-auto">
                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 text-sm border-t border-gray-200">
                    <div className="px-2 py-1">{item.name}</div>
                    <div className="px-2 py-1">{item.quantity}</div>
                    <div className="px-2 py-1">{item.unit}</div>
                    <div className="px-2 py-1">{item.id}</div>
                    <div className="px-2 py-1">{item.type}</div>
                    <div className="px-2 py-1">{item.spoilageMin}</div>
                    <div className="px-2 py-1">{item.spoilageMax}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 items-center mt-4">
              <div className="relative">
                <input
                  placeholder="Name"
                  className="border px-2 py-1 text-sm w-full"
                  value={newItem.name}
                  onChange={(e) => {
                    setNewItem({ ...newItem, name: e.target.value });
                    setActiveIngredientIndex(-1);
                  }}
                  onFocus={() => setShowIngredientSuggestions(false)} //
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
                        onMouseDown={() => handleIngredientClick(s.IngredientName)} // pass name, not object
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
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: +e.target.value })}
              />
              <div className="relative">
                <input
                  placeholder="Unit"
                  className="border px-2 py-1 text-sm w-full"
                  value={newItem.unit}
                  onChange={(e) => {
                    setNewItem({ ...newItem, unit: e.target.value });
                    setActiveUnitIndex(-1);
                  }}
                  onFocus={() => setShowUnitSuggestions(true)}
                  onKeyDown={(e) => {
                    if (!showUnitSuggestions || unitSuggestions.length === 0) return;

                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveUnitIndex((prev) => (prev + 1) % unitSuggestions.length);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveUnitIndex((prev) => (prev - 1 + unitSuggestions.length) % unitSuggestions.length);
                    } else if (e.key === "Enter" && activeUnitIndex >= 0) {
                      setNewItem({ ...newItem, unit: unitSuggestions[activeUnitIndex] });
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
                          setNewItem({ ...newItem, unit });
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
                value={newItem.id}
                onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
              />
              <input
                placeholder="Type"
                className="border px-2 py-1 text-sm"
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
              />
              <input
                type="number"
                placeholder="Min"
                className="border px-2 py-1 text-sm"
                value={newItem.spoilageMin}
                onChange={(e) => setNewItem({ ...newItem, spoilageMin: +e.target.value })}
              />
              <input
                type="number"
                placeholder="Max"
                className="border px-2 py-1 text-sm"
                value={newItem.spoilageMax}
                onChange={(e) => setNewItem({ ...newItem, spoilageMax: +e.target.value })}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setOrderItems([...orderItems, newItem]);
                  setNewItem({
                    name: "",
                    quantity: 0,
                    unit: "",
                    id: "",
                    type: "",
                    spoilageMin: 0,
                    spoilageMax: 0,
                  });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-black font-medium text-sm px-4 py-2 mt-2 rounded-sm"
              >
                Add to Order
              </button>
            </div>
         </div>       
        )}
      </div>
    </div>
  );
}
