import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    console.log("Register component rendered");

    const [value, setValue] = useState({
        Name: '',
        Email: '',
        Password: '',
        role: 'User'
    });

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChanges = (e) => {
        setValue({ ...value, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!value.Name || !value.Email || !value.Password) {
            setError("All fields are required.");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post('http://localhost:3000/auth/register', value);
            if (response.status === 201) {
                navigate('/login');
            }
            console.log(response);
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Something went wrong. Try again.");
           
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col justify-center items-center h-screen bg-gradient-to-br from-black to-pink-500'>
            <h1 className="text-white text-2xl font-bold">Welcome to CineVibe</h1>
            <div className='shadow-lg px-8 py-5 border w-96 bg-gradient-to-tr from-gray-100 to-indigo-200 rounded-xl'>
                <h2 className='text-lg font-bold mb-4'>Register</h2>
                {error && <p className="text-red-500">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className='mb-4'>
                        <label className='block text-gray-700'>Username</label>
                        <input 
                            type="text" 
                            placeholder='Enter Your UserName' 
                            className='w-full px-3 py-2 border rounded-md' 
                            name='Name' 
                            value={value.Name} 
                            onChange={handleChanges} 
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-gray-700'>Email</label>
                        <input 
                            type="email" 
                            placeholder='Enter Email' 
                            className='w-full px-3 py-2 border rounded-md' 
                            name='Email' 
                            value={value.Email} 
                            onChange={handleChanges} 
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-gray-700'>Password</label>
                        <input 
                            type="password" 
                            placeholder='Enter Password' 
                            className='w-full px-3 py-2 border rounded-md' 
                            name='Password' 
                            value={value.Password} 
                            onChange={handleChanges} 
                        />
                    </div>
                    <div className='mb-4'>
                        <label className='block text-gray-700'>Register As:</label>
                        <select 
                            name='role' 
                            className='w-full px-3 py-2 border rounded-md' 
                            value={value.role} 
                            onChange={handleChanges}
                        >
                            <option value='User'>User</option>
                            <option value='Cinema Owner'>Cinema Owner</option>
                        </select>
                    </div>
                    <button 
                        className={`w-full text-white py-2 mt-4 rounded-xl ${loading ? 'bg-gray-400' : 'bg-green-600'}`} 
                        disabled={loading}
                    >
                        {loading ? "Registering..." : "Submit"}
                    </button>
                </form>
                <div className='text-center mt-2'>
                    <p>Already have an account?</p>
                    <Link to='/login' className='text-blue-500'>Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;
