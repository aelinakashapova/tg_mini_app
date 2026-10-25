import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const NEW_LOGO_URL = 'https://fb7f89f5-ad23-41fe-a653-bda6e9ca3160.selstorage.ru/users/0438cc10-c92e-4fab-a3f4-60acfa265707/bots/78bc4f37-e735-4eb7-adfc-0cc094bbc8d0/b1ac1793-a430-4386-8d7a-7f81cf13b717.JPG';

const Home = ({ cartCount = 0 }) => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="brand-header">
                <div className="logo-wrapper">
                    <img src={NEW_LOGO_URL} alt="Leo market" className="main-logo" />
                </div>
                <h1 className="brand-heading">Leo market</h1>
                <p className="brand-slogan">— охотимся за вещицами!</p>
            </div>

            <div className="menu-list">
                <button className="menu-entry" onClick={() => navigate('/catalog')}>
                    <div className="entry-info">
                        <span className="entry-title">Каталог товаров</span>
                        <span className="entry-desc">Наличие в РФ и Ресейл лоты</span>
                    </div>
                    <span className="entry-arrow"></span>
                </button>

                <button className="menu-entry" onClick={() => navigate('/cart')}>
                    <div className="entry-info">
                        <span className="entry-title">Корзина</span>
                        <span className="entry-desc">Выбранные товары к оформлению</span>
                    </div>
                    <div className="entry-meta">
                        {cartCount > 0 && <span className="cart-chip">{cartCount}</span>}
                        <span className="entry-arrow"></span>
                    </div>
                </button>

                <button className="menu-entry" onClick={() => navigate('/profile')}>
                    <div className="entry-info">
                        <span className="entry-title">Личный кабинет</span>
                        <span className="entry-desc">Профиль, СДЭК и статус доставки</span>
                    </div>
                    <span className="entry-arrow"></span>
                </button>

                <button className="menu-entry" onClick={() => navigate('/knowledge')}>
                    <div className="entry-info">
                        <span className="entry-title">Леопарды пишут!</span>
                        <span className="entry-desc">Полезные статьи от леопардовых экспертов</span>
                    </div>
                    <span className="entry-arrow"></span>
                </button>
            </div>
        </div>
    );
};

export default Home;