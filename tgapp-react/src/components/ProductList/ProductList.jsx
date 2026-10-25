import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../ProductCard/ProductCard';
import FilterModal from '../FilterModal/FilterModal';
import './ProductList.css';

const defaultFilters = {
    brand: 'all',
    category: 'all',
    gender: 'all',
    minPrice: '',
    maxPrice: '',
    sort: 'default'
};

const ProductList = ({ products = [] }) => {
    const navigate = useNavigate();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState(defaultFilters);

    // Авто-сборка списков брендов и категорий из таблицы
    const brands = useMemo(() => [...new Set(products.map(p => p.brand).filter(Boolean))], [products]);
    const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))], [products]);

    const filtered = useMemo(() => {
        return products
            .filter(item => {
                if (filters.brand !== 'all' && item.brand !== filters.brand) return false;
                if (filters.category !== 'all' && item.category !== filters.category) return false;
                if (filters.gender !== 'all' && item.gender !== filters.gender) return false;
                if (filters.minPrice && item.price < Number(filters.minPrice)) return false;
                if (filters.maxPrice && item.price > Number(filters.maxPrice)) return false;
                return true;
            })
            .sort((a, b) => {
                if (filters.sort === 'asc') return a.price - b.price;
                if (filters.sort === 'desc') return b.price - a.price;
                return 0;
            });
    }, [products, filters]);

    return (
        <div className="stock-page">
            <div className="page-top-bar">
                <h2 className="page-heading">Товары в наличии</h2>
                <button className="filter-trigger-btn" onClick={() => setIsFilterOpen(true)}>
                    ⚙️ Фильтры
                </button>
            </div>

            <div className="product-grid-two-col">
                {filtered.map(product => (
                    <ProductCard
                        key={product.id}
                        item={product}
                        onClick={() => navigate(`/product/${product.id}`)}
                    />
                ))}
            </div>

            {filtered.length === 0 && <p className="no-items">По заданным фильтрам ничего не найдено</p>}

            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                onReset={() => setFilters(defaultFilters)}
                type="stock"
                availableBrands={brands}
                availableCategories={categories}
            />
        </div>
    );
};

export default ProductList;