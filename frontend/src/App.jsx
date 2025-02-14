import React, { useEffect, useState } from 'react';
import Movies from './pages/movies';
import SearchCinemas from './pages/cinema';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SeatBooking from'./pages/seat';

import FoodSelection from "./pages/FoodSelection";


const App = () => {
    
    return (
        <BrowserRouter>
            <Routes>
            <Route path='/' element={<Movies />} />
            <Route path='/cinema' element={<SearchCinemas />} />
            <Route path='/seat' element={<SeatBooking />} />
            <Route path="/food-selection" element={<FoodSelection />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
