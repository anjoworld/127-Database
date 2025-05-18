'use client';

import { useEffect, useState, useMemo } from "react";

type Ingredient = {
  id: number;
  name: string;
  type: string;
  unit: string;
  quantity: number;
  status: "Available" | "Out of Stock";
};

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"id" | "name" | "quantity" | "status">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:4000/ingredients").then(res => res.json()),
      fetch("http://localhost:4000/ingredients-stocks").then(res => res.json())
    ])
      .then(([ingredientsData, stocksData]) => {
        const stockMap = Array.isArray(stocksData)
          ? stocksData.reduce((acc: any, stockItem: any) => {
              acc[stockItem.IngredientID] = stockItem;
              return acc;
            }, {})
          : {};

        const merged = ingredientsData.map((item: any) => {
          const stock = stockMap[item.IngredientID] || {};
          return {
            id: item.IngredientID,
            name: item.IngredientName,
            type: item.IngredientType,
            unit: item.Unit,
            quantity: stock.Quantity || 0,
            status: stock.Quantity > 0 ? "Available" : "Out of Stock"
          };
        });

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

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [ingredients, searchTerm, sortBy, sortOrder]);

  if (isLoading) return <p className="text-gray-500 italic">Loading...</p>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Ingredient List</h2>

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
            className="border border-gray-300 rounded-3xl pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

            {/* Sort controls */}
            <div className="flex items-center gap-3 whitespace-nowrap">
                <label htmlFor="sortBy" className="text-gray-700 font-medium">
                Sort by:
                </label>
                <select
                id="sortBy"
                className="border border-gray-300 rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                >
                <option value="id">ID</option>
                <option value="name">Name</option>
                <option value="quantity">Quantity</option>
                <option value="status">Status</option>
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
              {["ID", "Name", "Type", "Unit", "Quantity", "Status"].map((header) => (
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
              filteredSortedIngredients.map((ingredient: any) => (
                <tr key={ingredient.id} className="hover:bg-gray-50 transition duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{ingredient.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800">{ingredient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{ingredient.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{ingredient.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{ingredient.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        ingredient.status === "Available"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {ingredient.status}
                    </span>
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
