
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../Button/Button';
import './Payment.css';

// Страница оплаты только отображает реквизиты и QR-код.
// Факт оплаты подтверждает менеджер в таблице заказов (статус «Оплачен»)
const Payment = ({ orders = [] }) => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const order = orders.find(o => o.id === orderId);

    if (!order) {
        return (
            <div className="payment-missing">
                <h3>Заказ не найден</h3>
                <Button onClick={() => navigate('/catalog')}>В каталог</Button>
            </div>
        );
    }

    const qrData = encodeURIComponent(`LEO_MARKET_ORDER_${order.id}_SUM_${order.totalPrice}`);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}`;

    return (
        <div className="payment-page">
            <h2 className="payment-title">Оплата заказа</h2>

            <div className="payment-summary-card">
                <div className="payment-row">
                    <span className="payment-row-label">Номер заказа</span>
                    <span className="payment-row-val">#{order.id}</span>
                </div>
                <div className="payment-row">
                    <span className="payment-row-label">Статус</span>
                    <span className="payment-row-val">{order.status}</span>
                </div>
                <div className="payment-row">
                    <span className="payment-row-label">Сумма к оплате</span>
                    <span className="payment-row-val highlight">{order.totalPrice.toLocaleString('ru-RU')}&nbsp;₽</span>
                </div>
                <div className="payment-row">
                    <span className="payment-row-label">Получатель</span>
                    <span className="payment-row-val">{order.recipient?.fullName}</span>
                </div>
                <div className="payment-row">
                    <span className="payment-row-label">Телефон</span>
                    <span className="payment-row-val">{order.recipient?.phone}</span>
                </div>
                <div className="payment-row col">
                    <span className="payment-row-label">ПВЗ СДЭК</span>
                    <span className="payment-row-val">{order.recipient?.cdekAddress}</span>
                </div>
            </div>

            <div className="qr-container">
                <p className="qr-guide">Для оплаты отсканируйте QR-код</p>
                <div className="qr-frame">
                    <img src={qrImageUrl} alt="QR-код" className="qr-code-img" />
                </div>
                <p className="receipt-text">
                    После получения оплаты менеджер подтвердит платеж — статус заказа
                    изменится на «Оплачен», а чек появится в карточке заказа.
                </p>
            </div>

            <div className="payment-actions">
                <Button onClick={() => navigate('/catalog')}>
                    Вернуться в каталог
                </Button>
                <button className="secondary-btn" onClick={() => navigate('/profile')}>
                    Личный кабинет
                </button>
            </div>
        </div>
    );
};

export default Payment;