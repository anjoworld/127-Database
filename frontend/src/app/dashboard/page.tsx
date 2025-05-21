'use client';

import { useEffect, useState } from "react";

const allTypes = ["Canned Goods", "Carbohydrates", "Condiments", "Dairy", "Fruits", "Meat", "Vegetables"];

export default function Dashboard() {
  const [selected, setSelected] = useState<number[]>([]);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [ingredientCards, setIngredientCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewIngredient, setPreviewIngredient] = useState<any | null>(null); // NEW

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:4000/ingredients').then(res => res.json()),
      fetch('http://localhost:4000/ingredients-stocks').then(res => res.json())
    ])
      .then(([ingredients, stocks]) => {
        const stockMap = stocks.reduce((acc: any, stockItem: any) => {
          acc[stockItem.IngredientID] = stockItem;
          return acc;
        }, {});

        const enriched = ingredients.map((item: any) => {
          const stock = stockMap[item.IngredientID] || {};
          return {
            id: item.IngredientID,
            name: item.IngredientName,
            type: item.IngredientType,
            batchId: stock.OrderID || "N/A",
            quantity: stock.Quantity || 0,
            unit: stock.Unit || "N/A",
            purchasedDate: stock.PurchasedDate || "N/A",
            expiryDate: stock.ExpiryDate || "N/A",
            daysLeft: 3 //Placeholder for days left calculation
          };
        });

        setIngredientCards(enriched);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch ingredients or stocks:', err);
        setIsLoading(false);
      });
  }, []);

  const getDayLabel = (days: number) => {
    if (days <= 0) return "Expired";
    return `${days} day${days === 1 ? '' : 's'} left`;
  };

  const getCardColor = (days: number) => {
    if (days <= 0) return "bg-gray-300";
    if (days <= 2) return "bg-red-300";
    if (days <= 4) return "bg-yellow-300";
    if (days > 30) return "[background-color:#69EDE6]";
    return "bg-green-300";
  };

  const filteredIngredients = ingredientCards.filter(ingredient =>
    (filterTypes.length === 0 || filterTypes.includes(ingredient.type)) &&
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleFilterType = (type: string) => {
    setFilterTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading ingredients...</div>;
  }

  return (
    <>
      <div className="flex h-fit bg-gray-200 p-4 space-x-4">
        <div className="w-1/2 bg-white rounded shadow p-4 flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Ingredients</h2>
            <div className="relative w-1/4 mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8 pl-3 py-1 border border-gray-300 rounded shadow-sm text-sm"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div className="relative mb-4 w-full flex items-center space-x-2">
            <div className="relative w-40">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-left shadow text-sm flex justify-between items-center"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                aria-label="Filter ingredient types"
              >
                {filterTypes.length === 0 ? 'Select' : filterTypes.join(', ')}
                <span className="ml-2">&#9662;</span>
              </button>

              {dropdownOpen && (
                <ul
                  role="listbox"
                  tabIndex={-1}
                  className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10 max-h-60 overflow-y-auto"
                >
                  {allTypes.map(type => (
                    <li
                      key={type}
                      className="flex items-center px-3 py-1 hover:bg-gray-100 text-sm cursor-pointer"
                      onClick={() => toggleFilterType(type)}
                      role="option"
                      aria-selected={filterTypes.includes(type)}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleFilterType(type);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={filterTypes.includes(type)}
                        onChange={() => toggleFilterType(type)}
                        tabIndex={-1}
                        aria-label={`Filter by ${type}`}
                      />
                      {type}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-2 max-w-[calc(100%-10rem)]">
              {filterTypes.map(type => (
                <div
                  key={type}
                  className="flex items-center space-x-1 bg-emerald-200 text-emerald-900 px-2 py-1 rounded-full text-sm select-none"
                >
                  <span>{type}</span>
                  <button
                    onClick={() => toggleFilterType(type)}
                    className="text-emerald-900 font-bold hover:text-emerald-700 focus:outline-none"
                    aria-label={`Remove filter ${type}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto pr-2 flex-1">
            {filteredIngredients.map((card) => {
              const color = getCardColor(card.daysLeft);
              const label = getDayLabel(card.daysLeft);
              return (
                <div
                  key={card.id}
                  className={`flex justify-between items-center p-3 rounded cursor-pointer ${color} ${selected.includes(card.id) ? "border-2 border-black" : ""}`}
                  onClick={() => setPreviewIngredient(card)} // ✅ only for preview
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={selected.includes(card.id)}
                      onChange={(e) => {
                        e.stopPropagation(); // prevents parent click
                        toggleSelection(card.id); // ✅ only toggles selection
                      }}
                      aria-label={`Select ingredient ${card.name}`}
                    />
                    <div>
                      <p className="font-bold">{card.name}</p>
                      <p className="text-xs">BatchID: {card.batchId} | Quantity: {card.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Details, Ingredients preview */}
        <div className="flex-1 space-y-4">
          {previewIngredient ? (
            <div
              className="bg-white p-4 rounded shadow"
              role="region"
              aria-label="Selected ingredient details"
            >
            <h3 className="text-xl font-bold mb-2 tracking-wide">{previewIngredient.name}</h3>
            <table className="w-full text-sm text-left border-gray-200">
              <tbody>
                <tr className="">
                  <th className="w-1/3 py-2 px-2 bg-gray-50 font-medium text-gray-700">Quantity</th>
                  <td className="py-1 px-2 text-gray-600">{previewIngredient.quantity}</td>
                </tr>
                <tr className="">
                  <th className="w-1/3 py-2 px-2 bg-gray-50 font-medium text-gray-700">Unit</th>
                  <td className="py-2 px-2 text-gray-600">{previewIngredient.unit}</td>
                </tr>
                <tr className="">
                  <th className="w-1/3 py-2 px-2 bg-gray-50 font-medium text-gray-700">Type</th>
                  <td className="py-2 px-2 text-gray-600">{previewIngredient.type}</td>
                </tr>
                <tr className="">
                  <th className="w-1/3 py-2 px-2 bg-gray-50 font-medium text-gray-700">Purchased Date</th>
                  <td className="py-2 px-2 text-gray-600">{previewIngredient.purchasedDate}</td>
                </tr>
                <tr className="">
                  <th className="w-1/3 py-2 px-2 bg-gray-50 font-medium text-gray-700">Expiry</th>
                  <td className="py-2 px-2 text-gray-600">{previewIngredient.expiryDate}</td>
                </tr>
              </tbody>
            </table>
            </div>
          ) : (
            <p className="bg-white p-4 rounded shadow text-gray-500 italic text-center">
              Select an ingredient to preview
            </p>
          )}
        </div>
      </div>
    </>
  );
}
