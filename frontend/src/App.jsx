import React, { useEffect, useState } from 'react';
import Movies from './pages/movies';
import SearchCinemas from './pages/cinema';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SeatBooking from'./pages/seat';
import TicketPage from './pages/ticket';
import PaymentPage from './pages/payment';

import FoodSelection from "./pages/FoodSelection";


const App = () => {
    
    return (
        <BrowserRouter>
            <Routes>
            <Route path='/' element={<Movies />} />
            <Route path='/cinema' element={<SearchCinemas />} />
            <Route path='/seat' element={<SeatBooking />} />
            <Route path="/food-selection" element={<FoodSelection />} />
            <Route path="/ticket" element={<TicketPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
