import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import './Cart.css';

const Cart = ({ cartItems = [], onUpdateQuantity, onRemove, totalPrice }) => {
    const navigate = useNavigate();

    return (
        <div className="cart-container">
            <h2 className="cart-title">Ваша корзина</h2>

            {cartItems.length === 0 ? (
                <div className="cart-empty">
                    <p>В корзине пока пусто 🛒</p>
                    <Button onClick={() => navigate('/catalog')}>Перейти к покупкам</Button>
                </div>
            ) : (
                <div className="cart-content">
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.cartKey} className="cart-item">
                                <div className="cart-item-thumb">
                                    <img src={item.image} alt={item.title} />
                                </div>

                                <div className="cart-item-info">
                                    <span className="cart-item-title">{item.title}</span>
                                    <span className="cart-item-size">Размер: <b>{item.selectedSize}</b></span>
                                    <span className="cart-item-price">
                                        {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                                    </span>
                                </div>

                                <div className="cart-item-actions">
                                    <button className="remove-btn" onClick={() => onRemove(item.cartKey)}>✕</button>
                                    <div className="cart-controls">
                                        <button className="qty-btn" onClick={() => onUpdateQuantity(item.cartKey, -1)}>-</button>
                                        <span className="qty-val">{item.quantity}</span>
                                        <button className="qty-btn" onClick={() => onUpdateQuantity(item.cartKey, 1)}>+</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary">
                        <span>Итого:</span>
                        <b>{totalPrice.toLocaleString('ru-RU')} ₽</b>
                    </div>

                    <Button className="checkout-btn" onClick={() => navigate('/checkout')}>
                        Оформить заказ
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Cart;