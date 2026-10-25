import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import './Checkout.css';

const Checkout = ({ cartItems = [], totalPrice = 0, userProfile, onInitOrder }) => {
    const navigate = useNavigate();

    // Предзаполняем поля из сохраненного профиля, если он есть
    const [fullName, setFullName] = useState(userProfile?.fullName || '');
    const [phone, setPhone] = useState(userProfile?.phone || '');
    const [cdekAddress, setCdekAddress] = useState(userProfile?.cdekAddress || '');

    // Автоподбор адресов ПВЗ
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Защита от двойной отправки заказа
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (cdekAddress.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setIsSearching(true);
                const query = encodeURIComponent(`СДЭК ${cdekAddress}`);
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=ru&limit=5&addressdetails=1`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.map(item => item.display_name));
                }
            } catch (err) {
                console.warn('Ошибка геокодера:', err);
            } finally {
                setIsSearching(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [cdekAddress]);

    const handleSelectAddress = (addr) => {
        setCdekAddress(addr);
        setSuggestions([]);
    };

    // Номер заказа присваивает таблица через onInitOrder и возвращается сюда
    const handleProceedToPayment = async (e) => {
        e.preventDefault();

        if (!fullName.trim() || !phone.trim() || !cdekAddress.trim()) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);

        const newOrder = {
            date: new Date().toLocaleDateString('ru-RU'), // "29.09.2026"
            items: [...cartItems],
            totalPrice,
            recipient: { fullName, phone, cdekAddress },
            deliveryPeriod: '2-5 дней',
            review: null
        };
        
        try {
            const orderId = await onInitOrder(newOrder);
            navigate(`/payment/${orderId}`);
        } catch (err) {
            console.error('Ошибка создания заказа:', err);
            alert('Не удалось создать заказ. Проверьте соединение и попробуйте еще раз.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="checkout-empty">
                <h3>Корзина пуста</h3>
                <Button onClick={() => navigate('/catalog')}>Перейти в каталог</Button>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <h2 className="checkout-title">Оформление заказа</h2>

            <form className="checkout-form" onSubmit={handleProceedToPayment}>
                <div className="form-group">
                    <label>ФИО получателя</label>
                    <input
                        type="text"
                        placeholder="Иванов Иван Иванович"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Номер телефона</label>
                    <input
                        type="tel"
                        placeholder="+7 (999) 000-00-00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group address-group">
                    <label>Адрес ближайшего ПВЗ СДЭК</label>
                    <input
                        type="text"
                        placeholder="Город, улица, код ПВЗ"
                        value={cdekAddress}
                        onChange={(e) => setCdekAddress(e.target.value)}
                        required
                    />
                    {isSearching && <span className="address-loader">Поиск вариантов...</span>}

                    {suggestions.length > 0 && (
                        <ul className="address-suggestions">
                            {suggestions.map((item, index) => (
                                <li key={index} onClick={() => handleSelectAddress(item)}>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="order-summary-box">
                    <h3 className="summary-heading">Состав заказа</h3>

                    <div className="summary-list">
                        {cartItems.map((item) => (
                            <div key={item.cartKey} className="summary-row">
                                <div className="summary-col-title">
                                    <span className="prod-name">{item.title}</span>
                                    <span className="prod-meta">
                                        Размер: {item.selectedSize} | {item.quantity} шт.
                                    </span>
                                </div>
                                <div className="summary-col-price">
                                    <span>{(item.price * item.quantity).toLocaleString('ru-RU')}&nbsp;₽</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="summary-total">
                        <span>Итого к оплате:</span>
                        <span className="total-amount">{totalPrice.toLocaleString('ru-RU')}&nbsp;₽</span>
                    </div>
                </div>

                <div className="shipping-badge">
                    <span className="badge-title">Срок доставки: 2–5 дней</span>
                    <span className="badge-desc">Статус трекинга будет доступен в личном кабинете.</span>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Создаём заказ...' : 'Оплатить заказ'}
                </Button>
            </form>
        </div>
    );
};

export default Checkout;