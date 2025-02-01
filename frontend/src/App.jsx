import React, { useEffect, useState } from 'react';
import Movies from './pages/movies';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App = () => {
    
    return (
        <BrowserRouter>
            <Routes>
            <Route path='/' element={<Movies />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
