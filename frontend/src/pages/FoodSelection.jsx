import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const FoodSelection = () => {
  const navigate = useNavigate();
  const [selectedFood, setSelectedFood] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");

  const foodItems = [
    { id: 1, name: "Popcorn", price: 100 },
    { id: 2, name: "Nachos", price: 150 },
    { id: 3, name: "Burger", price: 200 },
    { id: 4, name: "Soft Drink", price: 80 },
  ];

  const timeSlots = ["10:00 AM", "1:00 PM", "4:00 PM"];

  const toggleFoodSelection = (id) => {
    setSelectedFood((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCheckout = () => {
   
     alert("Booking Confirmed!");
    navigate("/");
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
            className={`p-4 rounded-lg text-center cursor-pointer ${
              selectedFood.includes(food.id) ? "bg-green-500" : "bg-gray-700"
            }`}
            onClick={() => toggleFoodSelection(food.id)}
          >
            {food.name} - ₹{food.price}
          </div>
        ))}
      </div>

      

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
