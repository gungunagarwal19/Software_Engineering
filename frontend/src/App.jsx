import React, { useEffect, useState } from 'react';
import Movies from './pages/movies';
import SearchCinemas from './pages/cinema';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App = () => {
    
    return (
        <BrowserRouter>
            <Routes>
            <Route path='/' element={<Movies />} />
            <Route path='/cinema' element={<SearchCinemas />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
