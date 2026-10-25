import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import Button from '../Button/Button';
import './Profile.css';

const Profile = ({ userProfile, onSaveProfile, orders = [] }) => {
    const { user, tg } = useTelegram();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(userProfile.fullName || '');
    const [phone, setPhone] = useState(userProfile.phone || '');
    const [cdekAddress, setCdekAddress] = useState(userProfile.cdekAddress || '');

    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!isEditing || cdekAddress.trim().length < 3) {
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
    }, [cdekAddress, isEditing]);

    const handleSelectAddress = (addr) => {
        setCdekAddress(addr);
        setSuggestions([]);
    };

    const handleSave = (e) => {
        e.preventDefault();
        onSaveProfile({ fullName, phone, cdekAddress });
        setIsEditing(false);
        setSuggestions([]);
    };

    return (
        <div className="profile-container">
            <h2 className="profile-title">Личный кабинет</h2>

            <div className="user-profile-header">
                <div className="avatar-circle">
                    {user?.photo_url ? (
                        <img src={user.photo_url} alt="Profile" className="user-photo" />
                    ) : (
                        <span className="user-initial">{user?.first_name ? user.first_name[0] : 'U'}</span>
                    )}
                </div>
                <div className="user-details">
                    <span className="user-display-name">{user?.first_name} {user?.last_name || ''}</span>
                    {user?.username && <span className="user-handle">@{user.username}</span>}
                </div>
                <div className="tg-id-box">
                    <span className="tg-id-label">Ваш ID для менеджера</span>
                    <button
                        type="button"
                        className="tg-id-value"
                        onClick={() => {
                            const id = localStorage.getItem('leo_tg_id') || String(user?.id || '');
                            if (navigator.clipboard) navigator.clipboard.writeText(id).catch(() => {});
                            tg.showAlert ? tg.showAlert(`Ваш ID: ${id}\nСкопируйте и отправьте менеджеру`) : alert(`Ваш ID: ${id}`);
                        }}
                    >
                        {localStorage.getItem('leo_tg_id') || user?.id || 'Откройте через Telegram'}
                    </button>
                </div>
            </div>

            <div className="profile-card">
                <div className="card-top-action">
                    <span className="card-caption">Данные для доставки СДЭК</span>
                    {!isEditing && (
                        <button className="text-action-btn" onClick={() => setIsEditing(true)}>
                            Редактировать
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form className="profile-edit-box" onSubmit={handleSave}>
                        <div className="field-block">
                            <label>ФИО</label>
                            <input
                                type="text"
                                placeholder="Иванов Иван Иванович"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="field-block">
                            <label>Телефон</label>
                            <input
                                type="tel"
                                placeholder="+7 (999) 000-00-00"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <div className="field-block address-block">
                            <label>ПВЗ СДЭК</label>
                            <input
                                type="text"
                                placeholder="Город, улица, код ПВЗ"
                                value={cdekAddress}
                                onChange={(e) => setCdekAddress(e.target.value)}
                                required
                            />
                            {isSearching && <span className="address-loader">Поиск вариантов...</span>}

                            {suggestions.length > 0 && (
                                <ul className="suggestions-dropdown">
                                    {suggestions.map((item, index) => (
                                        <li key={index} onClick={() => handleSelectAddress(item)}>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="form-buttons-row">
                            <button
                                type="button"
                                className="secondary-action-btn"
                                onClick={() => {
                                    setIsEditing(false);
                                    setSuggestions([]);
                                }}
                            >
                                Отмена
                            </button>
                            <Button type="submit">Сохранить</Button>
                        </div>
                    </form>
                ) : (
                    <div className="data-preview-list">
                        <div className="data-preview-item">
                            <span className="preview-label">ФИО</span>
                            <span className="preview-val">{userProfile.fullName || 'Не указано'}</span>
                        </div>
                        <div className="data-preview-item">
                            <span className="preview-label">Телефон</span>
                            <span className="preview-val">{userProfile.phone || 'Не указан'}</span>
                        </div>
                        <div className="data-preview-item">
                            <span className="preview-label">ПВЗ СДЭК</span>
                            <span className="preview-val">{userProfile.cdekAddress || 'Не указан'}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="orders-section">
                <h3 className="section-title">История заказов</h3>

                {orders.length === 0 ? (
                    <div className="empty-orders-note">
                        <p>У вас пока нет оформленных заказов</p>
                        <Button onClick={() => navigate('/catalog')}>Перейти в каталог</Button>
                    </div>
                ) : (
                      <div className="orders-grid">
                        {orders.map((order) => {
                            const positionsCount = Array.isArray(order.items) && order.items.length > 0
                                ? order.items.reduce((s, i) => s + (i.quantity || 0), 0)
                                : String(order.itemsDescription || '')
                                      .split(';')
                                      .filter(part => part.trim())
                                      .length;

                            const orderSum = Number(order.totalPrice) || 0;

                            return (
                                <div
                                    key={order.id}
                                    className="order-box-entry"
                                    onClick={() => navigate(`/order/${order.id}`)}
                                >
                                    <div className="order-box-top">
                                        <span className="order-box-id">Заказ #{order.id}</span>
                                        <span className="order-box-status">{order.status}</span>
                                    </div>
                                    <span className="order-box-date">{order.date}</span>
                                    <div className="order-box-bottom">
                                        <span>Позиций: {positionsCount}</span>
                                        <span className="order-box-sum">{orderSum.toLocaleString('ru-RU')}&nbsp;₽</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}



            



            </div>
        </div>
    );
};

export default Profile;