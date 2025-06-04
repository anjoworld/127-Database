'use client';

import { useEffect, useState, useMemo } from "react";

type Ingredient = {
  orderID: number;
  ingredientID: number;
  name: string;
  type: string;
  unit: string;
  quantity: number;
  expiryDate: string;
  minSpoil: number;
  maxSpoil: number;
  expiryDays?: number | null;  // can be null if unknown
};

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"orderID" | "name" | "quantity" | "expiryDays">("orderID");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
      //fetch("http://localhost:4000/ingredients").then(res => res.json()),
      //fetch("http://localhost:4000/ingredients-stocks").then(res => res.json()),
      fetch("http://localhost:4000/ingredients-with-daysleft")
      .then(res => res.json())
      .then((data) => {
        console.log("API response:", data);

        const merged = data.map((item: any) => ({
          orderID: item.OrderID,
          ingredientID: item.IngredientID,
          name: item.IngredientName,
          type: item.IngredientType,
          unit: item.Unit,
          quantity: item.CurrentQuantity,
          expiryDate: item.ExpiryDate,
          minSpoil: item.SpoilageMinDays,
          maxSpoil: item.SpoilageMaxDays,
          expiryDays: item.DaysLeft + 1,
        }));

        setIngredients(merged);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
        setIsLoading(false);
      });
  }, []);

  // Filter and sort ingredients based on searchTerm and sortBy
  const filteredSortedIngredients = useMemo(() => {
    let filtered = ingredients.filter(ing =>
      ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      // For strings, compare case-insensitive
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA == null) return 1; // put nulls last
      if (valB == null) return -1;

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [ingredients, searchTerm, sortBy, sortOrder]);

  if (isLoading) return <p className="text-gray-500 italic">Loading...</p>;

  return (
    <div className="bg-white mt-7 px-4 py-4 rounded-2xl shadow-md mx-auto w-[90%] h-[85vh] overflow-auto">
      <h2 className="text-xl font-bold mb-2 mt-2 text-gray-800">Inventory</h2>

      {/* Search and Sort Controls */}
      <div className="flex justify-end gap-4 mb-6 flex-wrap">
        {/* Search bar with icon */}
        <div className="relative w-full sm:w-auto min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0a7.5 7.5 0 1 0-10.6-10.6 7.5 7.5 0 0 0 10.6 10.6z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name..."
            className="text-sm border border-gray-300 rounded-3xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-3 whitespace-nowrap">
          <label htmlFor="sortBy" className="text-gray-700 text-sm font-medium">
            Sort by:
          </label>
          <select
            id="sortBy"
            className="text-sm border border-gray-300 rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="id">Order ID</option>
            <option value="name">Name</option>
            <option value="quantity">Quantity</option>
            <option value="expiryDays">Expiry</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="border border-gray-300 rounded-3xl px-3 py-2 hover:bg-gray-100 transition"
            aria-label="Toggle sort order"
            title={`Sort order: ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Order ID", "Ingredient ID", "Ingredient Name", "Type", "Quantity", "Unit", "Expiry Date", "Status"].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left font-semibold text-gray-600 tracking-wider uppercase"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredSortedIngredients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 italic">
                  No ingredients found.
                </td>
              </tr>
            ) : (
              filteredSortedIngredients.map((ingredient) => (
                <tr key={`${ingredient.orderID}-${ingredient.ingredientID}`} className="hover:bg-gray-50 transition duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{ingredient.orderID}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{ingredient.ingredientID}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800">{ingredient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{ingredient.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{ingredient.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{ingredient.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{ingredient.expiryDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    { ingredient.expiryDays == null ? (
                      <span className="inline-flex px-3 py-1 border border-gray-500 rounded text-xs font-semibold bg-gray-300">
                        No Expiry Date</span>
                    ) : ingredient.expiryDays < 0 ? (
                      <span //gray
                        className="inline-flex px-3 py-1 border border-gray-500 rounded text-xs font-semibold text-gray-700 bg-gray-300"
                      >
                        Expired
                      </span> ) : ingredient.expiryDays === 0 ? ( //red
                      <span
                        className="inline-flex px-3 py-1 border border-red-500 rounded text-xs font-semibold text-gray-700 bg-red-300"
                      >
                        EXPIRES TODAY
                      </span> ) : ingredient.expiryDays > 0 && ingredient.expiryDays <= (ingredient.maxSpoil - ingredient.minSpoil) ? ( //yellow
                      <span
                      className="inline-flex px-3 py-1 border border-yellow-500 rounded text-xs font-semibold text-gray-700 bg-yellow-300"
                    >
                      {ingredient.expiryDays} Days
                    </span>
                    ) : ingredient.expiryDays > (ingredient.maxSpoil - ingredient.minSpoil) && ingredient.expiryDays < 30 ? ( //green
                      <span
                        className="inline-flex px-3 py-1 border border-green-500 rounded text-xs font-semibold text-gray-700 bg-green-300"
                      >
                        {ingredient.expiryDays} Days
                      </span>
                    ) : (
                      <span //SURGERY HERE
                        className="inline-flex px-3 py-1 border border-[#0CB2A5] rounded text-xs font-semibold text-gray-700 bg-[#69EDE6]"
                      >
                        {ingredient.expiryDays} Days
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
