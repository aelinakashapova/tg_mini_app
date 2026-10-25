import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchArticles } from '../../services/productsApi';
import './Knowledge.css';

const Knowledge = () => {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [activeCategory, setActiveCategory] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchArticles().then(data => {
            setArticles(data);
            if (data.length > 0) {
                setActiveCategory(data[0].category);
            }
            setIsLoading(false);
        });
    }, []);

    const categories = useMemo(() => {
        return [...new Set(articles.map(a => a.category))];
    }, [articles]);

    const visibleArticles = useMemo(() => {
        return articles.filter(a => a.category === activeCategory);
    }, [articles, activeCategory]);

    if (isLoading) {
        return <div className="knowledge-loading">Загружаем материалы...</div>;
    }

    if (articles.length === 0) {
        return (
            <div className="knowledge-loading">
                Статьи скоро появятся — заполняйте лист articles в таблице
            </div>
        );
    }

    return (
        <div className="knowledge-page">
            <h2 className="knowledge-title">Леопарды пишут!</h2>
            <p className="knowledge-subtitle">полезные статьи от леопардовых экспертов</p>

            <div className="knowledge-navbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`knowledge-tab ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="articles-preview-stack">
                {visibleArticles.map(article => (
                    <div
                        key={article.id}
                        className="article-preview-card"
                        onClick={() => navigate(`/knowledge/article/${article.id}`)}
                    >
                        <div className="article-preview-photo">
                            {article.image ? (
                                <img src={article.image} alt={article.title} loading="lazy" />
                            ) : (
                                <div className="article-preview-placeholder">Leo market</div>
                            )}
                        </div>
                        <div className="article-preview-body">
                            <h3 className="article-preview-title">{article.title}</h3>
                            <span className="article-preview-arrow"></span>
                        </div>
                    </div>
                ))}
            </div>

            {visibleArticles.length === 0 && (
                <div className="knowledge-loading">В этом разделе пока нет статей</div>
            )}
        </div>
    );
};

export default Knowledge;