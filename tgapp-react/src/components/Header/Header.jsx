
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import './Header.css';

const Header = () => {
    const { user } = useTelegram();
    const navigate = useNavigate();
    const location = useLocation();

    const isHome = location.pathname === '/';

    return (
        <header className="header">
            <div className="header-left">
                {!isHome && (
                    <button className="nav-home-btn" onClick={() => navigate('/')}>
                        На главную
                    </button>
                )}
            </div>
            <div className="header-user">
                {user?.photo_url && (
                    <img src={user.photo_url} alt="avatar" className="header-avatar" />
                )}
                <span className="header-username">
                    {user?.username ? `@${user.username}` : (user?.first_name || 'Гость')}
                </span>
            </div>
        </header>
    );
};

export default Header;