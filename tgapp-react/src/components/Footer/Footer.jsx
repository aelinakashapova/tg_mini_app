import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="app-footer">
            <p className="footer-support">
                По любым вопросам обращаться{' '}
                <a 
                    href="https://t.me/leo_order_ru" 
                    target="_blank" 
                    rel="noreferrer"
                    className="footer-link"
                >
                    @leo_order_ru
                </a>
            </p>
            <p className="footer-address">
                📍 г. Новосибирск, Коммунистическая 1
            </p>
        </footer>
    );
};

export default Footer;