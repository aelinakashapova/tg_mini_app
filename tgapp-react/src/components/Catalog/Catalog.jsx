
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Catalog.css';

const Catalog = () => {
    const navigate = useNavigate();

    return (
        <div className="catalog-container">
            <h2 className="catalog-heading">Каталог товаров</h2>

            <div className="catalog-cards-stack">
                <button 
                    className="catalog-section-card" 
                    onClick={() => navigate('/catalog/in-stock')}
                >
                    <div className="section-card-info">
                        <span className="section-card-title">Наличие</span>
                        <span className="section-card-desc">
                            Товары с быстрой отправкой по всей России
                        </span>
                    </div>
                    <span className="section-arrow"></span>
                </button>

                <button 
                    className="catalog-section-card" 
                    onClick={() => navigate('/catalog/resale')}
                >
                    <div className="section-card-info">
                        <span className="section-card-title">Ресейл</span>
                        <span className="section-card-desc">
                            Выбери модель, а мы подберем для тебя самые выгодные лоты!
                        </span>
                    </div>
                    <span className="section-arrow"></span>
                </button>
            </div>
        </div>
    );
};

export default Catalog;