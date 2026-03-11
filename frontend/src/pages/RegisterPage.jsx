import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError } from '../store/slices/authSlice';
import { Mail, Lock, Phone, Eye, EyeOff, ArrowRight, User, CheckCircle, XCircle } from 'lucide-react';

const RegisterPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        }

        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        } else if (!/^[+]?[\d\s-]{10,}$/.test(formData.phone)) {
            errors.phone = 'Phone number is invalid';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return { strength: 0, label: '', color: '' };

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        if (strength <= 2) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
        if (strength <= 3) return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
        if (strength <= 4) return { strength: 3, label: 'Good', color: 'bg-blue-500' };
        return { strength: 4, label: 'Strong', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
        // Clear server error
        if (error) {
            dispatch(clearError());
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const result = await dispatch(register({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
        }));

        if (register.fulfilled.match(result)) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative font-sans">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop")',
                }}
            ></div>

            {/* Dark Overlay */}
            {/* Dark Overlay */}
            <div className="absolute inset-0 z-1 bg-black/60"></div>

            {/* Register Card */}
            <div className="relative z-2 bg-white p-10 w-full max-w-[480px] rounded-2xl shadow-2xl text-center border border-gray-100">
                <h2 className="font-serif text-3xl text-black mb-2 font-bold tracking-tight">V.M.S GARMENTS</h2>
                <p className="text-sm text-gray-700 mb-8 font-bold">Create your account</p>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2 text-left font-medium">
                        <XCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="text-left space-y-4">
                    {/* Name */}
                    <div>
                        <input
                            type="text"
                            name="name"
                            placeholder="Full Name"
                            className={`w-full p-4 bg-white border rounded-lg outline-none focus:border-black transition-colors font-sans text-sm text-black placeholder:text-gray-600 font-medium ${validationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                            value={formData.name}
                            onChange={handleChange}
                        />
                        {validationErrors.name && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            className={`w-full p-4 bg-white border rounded-lg outline-none focus:border-black transition-colors font-sans text-sm text-black placeholder:text-gray-600 font-medium ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {validationErrors.email && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Phone Number"
                            className={`w-full p-4 bg-white border rounded-lg outline-none focus:border-black transition-colors font-sans text-sm text-black placeholder:text-gray-600 font-medium ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                            value={formData.phone}
                            onChange={handleChange}
                        />
                        {validationErrors.phone && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            className={`w-full p-4 bg-white border rounded-lg outline-none focus:border-black transition-colors font-sans text-sm text-black placeholder:text-gray-600 font-medium pr-10 ${validationErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        {validationErrors.password && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            className={`w-full p-4 bg-white border rounded-lg outline-none focus:border-black transition-colors font-sans text-sm text-black placeholder:text-gray-600 font-medium pr-10 ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label="Toggle password visibility"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        {validationErrors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
                        )}
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                        <div>
                            <div className="flex gap-1 mb-1">
                                {[1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        className={`h-1 flex-1 rounded ${level <= passwordStrength.strength
                                            ? passwordStrength.color
                                            : 'bg-gray-200'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-600 font-medium">
                                Password strength: <span className="font-bold">{passwordStrength.label}</span>
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full p-4 bg-black text-white rounded-lg font-bold mt-6 hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Create Account <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-gray-700 text-sm font-medium">
                    Already have an account? <Link to="/login" className="font-bold text-blue-700 hover:text-blue-900 hover:underline ml-1">Sign In</Link>
                </div>
            </div>

            {/* Injected Styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600&family=Playfair+Display:wght@700&display=swap');
                .font-sans { font-family: 'Montserrat', sans-serif; }
                .font-serif { font-family: 'Playfair Display', serif; }
            `}</style>
        </div>
    );
};

export default RegisterPage;
