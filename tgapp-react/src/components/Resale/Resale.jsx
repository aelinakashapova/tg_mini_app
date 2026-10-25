import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../ProductCard/ProductCard';
import FilterModal from '../FilterModal/FilterModal';
import './Resale.css';

const defaultResaleFilters = {
    brand: 'all',
    model: 'all',
    category: 'all',
    year: ''
};

const Resale = ({ products = [] }) => {
    const navigate = useNavigate();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState(defaultResaleFilters);

    // Авто-сборка брендов, моделей и категорий
    const brands = useMemo(() => [...new Set(products.map(p => p.brand).filter(Boolean))], [products]);
    const models = useMemo(() => [...new Set(products.map(p => p.model).filter(Boolean))], [products]);
    const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))], [products]);

    const filtered = useMemo(() => {
        return products.filter(item => {
            if (filters.brand !== 'all' && item.brand !== filters.brand) return false;
            if (filters.model !== 'all' && item.model !== filters.model) return false;
            if (filters.category !== 'all' && item.category !== filters.category) return false;
            if (filters.year && String(item.year) !== String(filters.year)) return false;
            return true;
        });
    }, [products, filters]);

    return (
        <div className="resale-page">
            <div className="page-top-bar">
                <h2 className="page-heading">Ресейл-референсы</h2>
                <button className="filter-trigger-btn" onClick={() => setIsFilterOpen(true)}>
                    ⚙️ Фильтры
                </button>
            </div>

            <div className="product-grid-two-col">
                {filtered.map(product => (
                    <ProductCard
                        key={product.id}
                        item={product}
                        showPrice={false}
                        onClick={() => navigate(`/resale-product/${product.id}`)}
                    />
                ))}
            </div>

            {filtered.length === 0 && <p className="no-items">По заданным фильтрам ничего не найдено</p>}

            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                onReset={() => setFilters(defaultResaleFilters)}
                type="resale"
                availableBrands={brands}
                availableModels={models}
                availableCategories={categories}
            />
        </div>
    );
};

export default Resale;