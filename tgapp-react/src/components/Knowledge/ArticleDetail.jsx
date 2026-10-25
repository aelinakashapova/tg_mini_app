
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchArticles } from '../../services/productsApi';
import Button from '../Button/Button';
import './ArticleDetail.css';

const ArticleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [article, setArticle] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchArticles().then(data => {
            const found = data.find(a => String(a.id) === String(id));
            setArticle(found || null);
            setIsLoading(false);
        });
    }, [id]);

    if (isLoading) {
        return <div className="article-loading">Загружаем статью...</div>;
    }

    if (!article) {
        return (
            <div className="article-loading">
                <p>Статья не найдена</p>
                <Button onClick={() => navigate('/knowledge')}>Ко всем статьям</Button>
            </div>
        );
    }

    return (
        <div className="article-page">
            <button className="back-to-articles" onClick={() => navigate('/knowledge')}>
                Ко всем статьям
            </button>

            <article className="article-full-card">
                {article.image && (
                    <div className="article-full-photo">
                        <img src={article.image} alt={article.title} />
                    </div>
                )}

                <div className="article-full-body">
                    <span className="article-full-category">{article.category}</span>
                    <h1 className="article-full-title">{article.title}</h1>
                    <p className="article-full-text">{article.text}</p>
                </div>
            </article>
        </div>
    );
};

export default ArticleDetail;