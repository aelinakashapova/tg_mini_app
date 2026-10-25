import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import Button from '../Button/Button';
import './OrderDetail.css';
import { submitReviewToSheet } from '../../services/productsApi';

const TRACKER_SHOP = ['Ожидает оплаты', 'Оплачен', 'В пути', 'Готов к выдаче', 'Выдан'];
const TRACKER_MANUAL = ['Создан', 'Оплачен', 'На аутентификации', 'В пути', 'Готов к выдаче', 'Выдан'];

// Статусы, при которых заказ считается неоплаченным
const UNPAID_STATUSES = ['', 'Создан', 'Ожидает оплаты'];

const OrderDetail = ({ orders = [], onAddReview, reviews = {}, userProfile, onRefreshOrders }) => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { tg, user } = useTelegram();

    const order = orders.find(o => o.id === orderId);

    const savedReview = reviews[orderId] || order?.review || null;
    const [rating, setRating] = useState(savedReview?.rating || 5);
    const [reviewText, setReviewText] = useState(savedReview?.text || '');
    const [isSubmitted, setIsSubmitted] = useState(!!savedReview);

    // Обновляем данные, когда вернулись из профиля/оплаты
    useEffect(() => {
        if (onRefreshOrders) onRefreshOrders();
    }, [orderId]);

    if (!order) {
        return (
            <div className="order-missing">
                <h3>Заказ #{orderId} не найден</h3>
                <Button onClick={() => navigate('/profile')}>Вернуться в кабинет</Button>
            </div>
        );
    }

    const isManual = order.source !== 'shop';
    const steps = isManual ? TRACKER_MANUAL : TRACKER_SHOP;
    const activeIndex = Math.max(steps.indexOf(order.status), 0);

    // Заказ оплачен, только если менеджер подтвердил оплату в таблице
    const isPaid = !UNPAID_STATUSES.includes(order.status);

    // Подсказка видна только для ручных заказов со статусом «Создан», пока нет данных доставки
    const hasDeliveryData = (order.recipient?.phone && order.recipient?.cdekAddress) ||
        (userProfile?.phone && userProfile?.cdekAddress);
    const showFillHint = isManual && order.status === 'Создан' && !hasDeliveryData;

    // Вкладка аутентификации: только для ручных заказов, не исчезает
    const authStatusLower = String(order.authStatus || '').toLowerCase();
    const authPassed = authStatusLower.includes('успеш') || authStatusLower.includes('пройдена');
    const authFailed = authStatusLower.includes('не') || authStatusLower.includes('отказ');
    const showAuthCard = isManual && (authPassed || authFailed);

    // Вкладка штрихкода: видна в пути/готов к выдаче, исчезает после «Выдан»
    const showBarcode = ['В пути', 'Готов к выдаче'].includes(order.status);
    const barcodeValue = order.pickupCode || order.id;

    const qrFallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(barcodeValue)}`;

    const handleSubmitReview = (e) => {
        e.preventDefault();

        const reviewData = {
            rating,
            text: reviewText,
            date: new Date().toLocaleDateString('ru-RU')
        };

        onAddReview(orderId, reviewData);
        setIsSubmitted(true);

        const userLabel = user?.username
            ? '@' + user.username
            : (user?.first_name || 'Клиент ' + (localStorage.getItem('leo_tg_id') || ''));

        submitReviewToSheet(
            { orderId, rating, text: reviewText },
            userLabel
        );
    };

    return (
        <div className="order-detail-page">
            <div className="order-header-box">
                <h2>Заказ #{order.id}</h2>
                <span className="order-header-date">Дата оформления: {order.date || '—'}</span>
            </div>

            {/* Статус доставки */}
            <div className="order-card">
                <h3 className="card-heading">Статус доставки</h3>
                <div className="status-tracker compact">
                    {steps.map((step, idx) => {
                        const isDone = idx <= activeIndex;
                        const isCurrent = idx === activeIndex;

                        return (
                            <div key={step} className={`tracker-node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                <div className="tracker-circle">{isDone ? '✓' : idx + 1}</div>
                                <span className="tracker-text">{step}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="delivery-period-note">
                    Расчетный срок прибытия: {order.deliveryPeriod || (isManual ? '16–21 день' : '2–5 дней')}
                </div>
            </div>

            {/* Подсказка для неоплаченного ручного заказа */}
            {showFillHint && (
                <div className="fill-hint-banner">
                    <p>
                        Заполните данные для доставки СДЭК в личном кабинете — и подсказка здесь исчезнет,
                        а мы сможем отправить ваш заказ.
                    </p>
                    <Button onClick={() => navigate('/profile')}>Заполнить данные</Button>
                </div>
            )}

            {/* Кнопка оплаты для неоплаченных заказов (оба типа заказов) */}
            {UNPAID_STATUSES.includes(order.status) && (
                <Button className="pay-now-btn" onClick={() => navigate(`/payment/${order.id}`)}>
                    Оплатить заказ
                </Button>
            )}

            {/* Результат аутентификации (только ручные заказы, не исчезает) */}
            {showAuthCard && (
                <div className={`auth-card ${authPassed ? 'auth-ok' : 'auth-fail'}`}>
                    {authPassed ? (
                        <>
                            <b>Аутентификация пройдена успешно!</b>
                            {order.authReportUrl && (
                                <a href={order.authReportUrl} target="_blank" rel="noreferrer">
                                    Результаты по ссылке
                                </a>
                            )}
                        </>
                    ) : (
                        <b>Аутентификация не пройдена, наши менеджеры уже связались с вами!</b>
                    )}
                </div>
            )}

            {/* Данные доставки */}
            <div className="order-card">
                <h3 className="card-heading">Информация о доставке</h3>
                <div className="detail-info-row">
                    <span>Получатель</span>
                    <b>{order.recipient?.fullName || userProfile?.fullName || 'Не указано'}</b>
                </div>
                <div className="detail-info-row">
                    <span>Телефон</span>
                    <b>{order.recipient?.phone || userProfile?.phone || 'Не указан'}</b>
                </div>
                <div className="detail-info-row col">
                    <span>ПВЗ СДЭК</span>
                    <b>{order.recipient?.cdekAddress || userProfile?.cdekAddress || 'Не указан'}</b>
                </div>
            </div>

            {/* Состав посылки */}
            <div className="order-card">
                <h3 className="card-heading">Состав посылки</h3>

                {Array.isArray(order.items) && order.items.length > 0 ? (
                    <div className="goods-list">
                        {order.items.map((item) => (
                            <div key={item.cartKey} className="good-item-row">
                                <img src={item.image} alt={item.title} className="good-item-img" />
                                <div className="good-item-info">
                                    <span className="good-title">{item.title}</span>
                                    <span className="good-meta">Размер: {item.selectedSize} | {item.quantity} шт.</span>
                                </div>
                                <span className="good-cost">
                                    {(item.price * item.quantity).toLocaleString('ru-RU')}&nbsp;₽
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="manual-items-list">
                        {String(order.itemsDescription || 'Состав уточняется').split(';').map((line, idx) => (
                            <div key={idx} className="manual-item-line">{line.trim()}</div>
                        ))}
                    </div>
                )}

                <div className="order-bottom-total">
                    <span>Итого к оплате:</span>
                    <span className="final-price">{Number(order.totalPrice).toLocaleString('ru-RU')}&nbsp;₽</span>
                </div>
            </div>

            {/* Вкладка штрихкода для получения */}
            {showBarcode && (
                <div className="barcode-card">
                    <h3 className="card-heading">Получение заказа</h3>

                    {order.barcodeUrl ? (
                        <img
                            src={order.barcodeUrl}
                            alt="Штрихкод"
                            className="barcode-img"
                            onError={(e) => { e.currentTarget.src = qrFallbackUrl; }}
                        />
                    ) : (
                        <img src={qrFallbackUrl} alt="Код получения" className="barcode-img" />
                    )}

                    <span className="barcode-caption">Штрихкод для получения заказа в ПВЗ СДЭК</span>
                    <span className="barcode-code">Код: {barcodeValue}</span>
                </div>
            )}

            {/* Обратная связь */}
            <div className="order-card">
                <h3 className="card-heading">Обратная связь по заказу</h3>

                {isSubmitted ? (
                    <div className="feedback-done">
                        <b>Спасибо за ваш отзыв!</b>
                        <p className="feedback-quote">«{savedReview?.text || 'Без текста'}»</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitReview} className="feedback-form">
                        <div className="score-selector">
                            <span>Оценка:</span>
                            <div className="score-pills">
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        type="button"
                                        key={val}
                                        className={`score-pill ${val === rating ? 'active' : ''}`}
                                        onClick={() => setRating(val)}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            placeholder="Напишите комментарий по заказу..."
                            rows="3"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                        />

                        <Button type="submit">
                            Отправить отзыв в Telegram
                        </Button>
                    </form>
                )}
            </div>

            {/* Чек — ссылка из таблицы, только после подтверждения оплаты менеджером */}
            {isPaid && (
                <div className="order-card receipt-link-card">
                    <h3 className="card-heading">Чек по заказу</h3>

                    {order.receiptUrl ? (
                        <a
                            href={order.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="receipt-link"
                        >
                            Открыть чек
                        </a>
                    ) : (
                        <span className="receipt-pending">
                            Чек появится здесь после оплаты — сотрудник прикрепит его к заказу
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrderDetail;