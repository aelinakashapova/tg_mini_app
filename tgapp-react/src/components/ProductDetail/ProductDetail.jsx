
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import Button from '../Button/Button';
import './ProductDetail.css';

const ProductDetail = ({ products = [], onAddToCart, onUpdateQuantity, cartItems = [] }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { tg } = useTelegram();

    const product = products.find(item => item.id === id);

    const availableSizes = product?.sizes && product.sizes.length > 0 ? product.sizes : ['One Size'];
    const [selectedSize, setSelectedSize] = useState(availableSizes[0]);

    if (!product) {
        return <div className="detail-error">Товар не найден</div>;
    }

    const currentCartKey = `${product.id}-${selectedSize}`;
    const inCartItem = cartItems.find(i => i.cartKey === currentCartKey);

    const handleAdd = () => {
        onAddToCart(product, selectedSize);
    };

    const handleQuickOrder = () => {
        if (!inCartItem) {
            onAddToCart(product, selectedSize);
        }
        navigate('/checkout');
    };

    const openSizeChart = (e) => {
        e.preventDefault();
        if (tg && tg.openLink) {
            tg.openLink(product.sizeChartUrl);
        } else {
            window.open(product.sizeChartUrl, '_blank');
        }
    };

    return (
        <div className="product-detail-view">
            <div className="product-detail-photo">
                <img src={product.image} alt={product.title} />
            </div>

            <div className="product-detail-body">
                <span className="product-detail-brand">{product.brand}</span>
                <h1 className="product-detail-title">{product.title}</h1>
                <div className="product-detail-price">
                    {product.price.toLocaleString('ru-RU')}&nbsp;₽
                </div>

                <div className="selector-group">
                    <span className="selector-caption">Выберите размер</span>
                    <div className="selector-options">
                        {availableSizes.map(size => (
                            <button
                                key={size}
                                className={`size-chip ${selectedSize === size ? 'active' : ''}`}
                                onClick={() => setSelectedSize(size)}
                            >
                                {size}
                            </button>
                        ))}
                    </div>

                    {product.sizeChartUrl && (
                        <a 
                            href={product.sizeChartUrl} 
                            onClick={openSizeChart}
                            className="size-chart-link"
                        >
                            Размерная сетка
                        </a>
                    )}
                </div>

                <div className="product-detail-desc">
                    <span className="desc-caption">Описание</span>
                    <p>{product.description || 'Описание товара уточняется у менеджеров.'}</p>
                </div>

                <div className="detail-cta-stack">
                    {!inCartItem ? (
                        <Button onClick={handleAdd}>
                            Добавить в корзину
                        </Button>
                    ) : (
                        <div className="quantity-counter-bar">
                            <span className="counter-label">В корзине:</span>
                            <div className="counter-controls">
                                <button 
                                    className="counter-btn" 
                                    onClick={() => onUpdateQuantity(inCartItem.cartKey, -1)}
                                >
                                    -
                                </button>
                                <span className="counter-val">{inCartItem.quantity}</span>
                                <button 
                                    className="counter-btn" 
                                    onClick={() => onUpdateQuantity(inCartItem.cartKey, 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="split-action-buttons">
                        <button className="secondary-cta-btn" onClick={() => navigate('/cart')}>
                            Перейти в корзину
                        </button>
                        <button className="secondary-cta-btn highlight" onClick={handleQuickOrder}>
                            Оформить заказ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;