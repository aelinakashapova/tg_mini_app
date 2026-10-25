import React from 'react';
import { useParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import Button from '../Button/Button';
import './ResaleDetail.css';

const ResaleDetail = ({ products = [] }) => {
    const { id } = useParams();
    const { tg } = useTelegram();
    const product = products.find(item => item.id === id);

    if (!product) return <div className="detail-error">Модель не найдена</div>;

    const copyToClipboardFallback = (text) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.warn('Не удалось скопировать:', err);
        }
        document.body.removeChild(textArea);
    };

   const handleSendOrder = () => { 
    const lotUrl = `https://tgapp-react.vercel.app/resale-product/${product.id}`; 
    
    // Сообщение в чат 
    const tgMessage = `Добрый день! 
    Меня заинтересовал данный лот: ${product.title}\n${lotUrl}`; 
    
    // Копируем как резервное средство 
    copyToClipboardFallback(tgMessage); 
    
    // Открыть чат в Telegram с предзаполненным текстом у пользователя @leo_order_ru 
    const chatUsername = 'leo_order_ru'; 
    const chatLink = `https://t.me/${chatUsername}?text=${encodeURIComponent(tgMessage)}`; 
    
    if (tg && tg.openTelegramLink) { 
        tg.openTelegramLink(chatLink); 
    } else { 
        window.location.href = chatLink; 
    } 
}; 

    return (
        <div className="resale-detail-view">
            <div className="resale-detail-photo">
                <img src={product.image} alt={product.title} />
            </div>

            <div className="resale-detail-body">
                <span className="resale-detail-brand">{product.brand}</span>
                <h1 className="resale-detail-title">{product.title}</h1>

                <div className="resale-specs-card">
                    {product.model && (
                        <div className="spec-item">
                            <span>Модель</span>
                            <b>{product.model}</b>
                        </div>
                    )}
                    {product.year && (
                        <div className="spec-item">
                            <span>Год выпуска</span>
                            <b>{product.year}</b>
                        </div>
                    )}
                    <div className="spec-item">
                        <span>Категория</span>
                        <b>{product.category}</b>
                    </div>
                    {product.sizes?.length > 0 && (
                        <div className="spec-item">
                            <span>Параметры</span>
                            <b>{product.sizes.join(', ')}</b>
                        </div>
                    )}
                </div>

                <div className="resale-desc-block">
                    <span className="desc-caption">О лоте</span>
                    <p>{product.description || 'Подбор лота по индивидуальному запросу.'}</p>
                </div>

                <Button onClick={handleSendOrder}>
                    Отправить заявку
                </Button>
            </div>
        </div>
    );
};

export default ResaleDetail;