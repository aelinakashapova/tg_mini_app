import React from 'react';
import './ProductCard.css';

const ProductCard = ({ item, onClick, showPrice = true }) => {
    return (
        <div className="product-card" onClick={onClick}>
            <div className="product-card-img-wrap">
                <img src={item.image} alt={item.title} className="product-card-img" />
            </div>
            <div className="product-card-info">
                <span className="product-card-title">{item.title}</span>
                {showPrice && (
                    <span className="product-card-price">{item.price.toLocaleString('ru-RU')} ₽</span>
                )}
            </div>
        </div>
    );
};

export default ProductCard;