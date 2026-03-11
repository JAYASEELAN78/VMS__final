import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    ArrowRight,
    LayoutDashboard,
    Receipt,
    Package,
    FileText,
    Users,
    Truck,
    BarChart3,
    Check,
    Sparkles,
    ShoppingCart
} from 'lucide-react';
import logoImage from '../assets/logo.jpg';
import './HomePage.css';

const HomePage = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);

    const features = [
        {
            icon: Receipt,
            title: 'Professional Billing',
            text: 'Generate clean, A4-ready invoices with your branding. PDF export & email support.',
            colorClass: 'home-feature-icon-billing'
        },
        {
            icon: Package,
            title: 'V.M.S Inventory',
            text: 'Real-time stock tracking with low-stock alerts. Never run out of popular items.',
            colorClass: 'home-feature-icon-inventory'
        },
        {
            icon: FileText,
            title: 'Reports',
            text: 'Purchase, sales, and stock reports formatted for A4 printing and audit.',
            colorClass: 'home-feature-icon-reports'
        },
        {
            icon: Users,
            title: 'Customer Records',
            text: 'Manage customer profiles, billing history, and payment tracking.',
            colorClass: 'home-feature-icon-customers'
        },
        {
            icon: Truck,
            title: 'Supplier Records',
            text: 'Track suppliers, purchase entries, and outstanding payments.',
            colorClass: 'home-feature-icon-suppliers'
        },
        {
            icon: BarChart3,
            title: 'Business Dashboard',
            text: 'Revenue charts, order trends, and at-a-glance business health metrics.',
            colorClass: 'home-feature-icon-dashboard'
        }
    ];

    return (
        <div className="home-root">
            {/* ===== NAVBAR ===== */}
            <nav className="home-navbar">
                <div className="home-navbar-brand">
                    <img src={logoImage} alt="V.M.S GARMENTS" className="home-navbar-logo" />
                    <span className="home-navbar-name">V.M.S GARMENTS</span>
                </div>

            </nav>

            {/* ===== HERO ===== */}
            <section className="home-hero">
                <div className="home-hero-inner">
                    <div className="home-hero-badge">
                        <span className="home-hero-badge-dot"></span>
                        Retail Management Suite
                    </div>

                    <h1 className="home-hero-title">
                        V.M.S GARMENTS
                    </h1>

                    <p className="home-hero-subtitle">
                        Professional billing, real-time inventory, and audit-ready A4 reports —
                        everything you need to run your retail store efficiently.
                    </p>

                    <div className="home-hero-actions">
                        <Link to="/shop" className="home-hero-btn home-hero-btn-primary">
                            <ShoppingCart size={18} />
                            Shop Our Products
                            <ArrowRight size={18} />
                        </Link>
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="home-hero-btn home-hero-btn-secondary">
                                <LayoutDashboard size={18} />
                                Seller Dashboard
                            </Link>
                        ) : (
                            <Link to="/login" className="home-hero-btn home-hero-btn-secondary">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ===== FEATURES ===== */}
            <section className="home-features">
                <div className="home-features-inner">
                    <p className="home-section-label">Why V.M.S GARMENTS</p>
                    <h2 className="home-section-title">Everything Your Store Needs</h2>

                    <div className="home-features-grid">
                        {features.map((feat, i) => (
                            <div key={i} className="home-feature-card">
                                <div className={`home-feature-icon-wrap ${feat.colorClass}`}>
                                    <feat.icon size={24} />
                                </div>
                                <p className="home-feature-title">{feat.title}</p>
                                <p className="home-feature-text">{feat.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== STATS ===== */}
            <section className="home-stats">
                <div className="home-stats-inner">
                    <div className="home-stat-item">
                        <p className="home-stat-number">A4</p>
                        <p className="home-stat-label">Ready Reports</p>
                    </div>
                    <div className="home-stat-item">
                        <p className="home-stat-number">PDF</p>
                        <p className="home-stat-label">Bill Export</p>
                    </div>
                    <div className="home-stat-item">
                        <p className="home-stat-number">24/7</p>
                        <p className="home-stat-label">Access</p>
                    </div>
                    <div className="home-stat-item">
                        <p className="home-stat-number">
                            <Sparkles size={28} style={{ display: 'inline' }} />
                        </p>
                        <p className="home-stat-label">Premium Design</p>
                    </div>
                </div>
            </section>


            {/* ===== FOOTER ===== */}
            <footer className="home-footer">
                <p>
                    © {new Date().getFullYear()} <span className="home-footer-brand">V.M.S GARMENTS</span>.
                    All rights reserved. Designed for daily billing and audit-ready records.
                </p>
            </footer>
        </div>
    );
};

export default HomePage;
