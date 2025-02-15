import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const FoodSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const seatPrice = location.state?.totalSeatPrice || 0;
  const [selectedFood, setSelectedFood] = useState([]);
  const [totalPrice, setTotalPrice] = useState(seatPrice);

  const foodItems = [
    { id: 1, name: "Popcorn", price: 100 },
    { id: 2, name: "Nachos", price: 150 },
    { id: 3, name: "Burger", price: 200 },
    { id: 4, name: "Soft Drink", price: 80 },
  ];

  useEffect(() => {
    const foodTotal = selectedFood.reduce((sum, id) => {
      const food = foodItems.find((item) => item.id === id);
      return sum + (food ? food.price : 0);
    }, 0);
    setTotalPrice(seatPrice + foodTotal);
  }, [selectedFood, seatPrice]);

  const toggleFoodSelection = (id) => {
    setSelectedFood((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCheckout = () => {
    navigate("/payment", { state: { totalPrice } });
  };

  return (
    <div className="bg-[url('food1.jpg')] bg-cover bg-center h-screen w-full">
    <div className="flex flex-col items-center p-5  min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Food Selection</h1>

      {/* Food Options */}
      <div className="grid grid-cols-2 gap-4">
        {foodItems.map((food) => (
          <div
            key={food.id}
            className={`p-4 rounded-lg text-center cursor-pointer transition-transform duration-200
              ${selectedFood.includes(food.id) ? "bg-green-500" : "bg-gray-700"}`}
            onClick={() => toggleFoodSelection(food.id)}
          >
            {food.name} - ₹{food.price}
          </div>
        ))}
      </div>

      {/* Total Price Display */}
      <div className="mt-5 text-lg font-bold">Total Price: ₹{totalPrice}</div>

      {/* Checkout Button */}
      <button
        className="px-6 py-3 bg-yellow-500 text-black font-bold mt-6 rounded-lg hover:bg-yellow-600"
        onClick={handleCheckout}
      >
        Confirm Booking
      </button>
    </div>
    </div>
  );
};

export default FoodSelection;
