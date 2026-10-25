
import React from 'react';
import Button from '../Button/Button';
import './FilterModal.css';

const FilterModal = ({ 
    isOpen, 
    onClose, 
    filters, 
    setFilters, 
    onReset, 
    type = 'stock',
    availableBrands = [],
    availableModels = [],
    availableCategories = []
}) => {
    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="filter-overlay" onClick={onClose}>
            <div className="filter-sheet" onClick={e => e.stopPropagation()}>
                <div className="filter-header">
                    <h3>Фильтры</h3>
                    <button className="filter-close" onClick={onClose}>✕</button>
                </div>

                <div className="filter-body">
                    {/* Выбор из реальных брендов таблицы */}
                    <div className="filter-group">
                        <label>Бренд</label>
                        <select
                            value={filters.brand || 'all'}
                            onChange={e => handleChange('brand', e.target.value)}
                        >
                            <option value="all">Все бренды</option>
                            {availableBrands.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    {/* Выбор из категорий таблицы */}
                    <div className="filter-group">
                        <label>Категория</label>
                        <select
                            value={filters.category || 'all'}
                            onChange={e => handleChange('category', e.target.value)}
                        >
                            <option value="all">Все категории</option>
                            {availableCategories.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {type === 'stock' && (
                        <>
                            <div className="filter-group">
    <label>Пол</label>
    <select
        value={filters.gender || 'all'}
        onChange={e => handleChange('gender', e.target.value)}
    >
        <option value="all">Все</option>
        <option value="Женский">Женский</option>
        <option value="Мужской">Мужской</option>
        <option value="Унисекс">Унисекс</option>
    </select>
</div>

                            <div className="filter-group">
                                <label>Цена, ₽</label>
                                <div className="price-inputs">
                                    <input
                                        type="number"
                                        placeholder="От"
                                        value={filters.minPrice || ''}
                                        onChange={e => handleChange('minPrice', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="До"
                                        value={filters.maxPrice || ''}
                                        onChange={e => handleChange('maxPrice', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Сортировка по цене</label>
                                <select
                                    value={filters.sort || 'default'}
                                    onChange={e => handleChange('sort', e.target.value)}
                                >
                                    <option value="default">По умолчанию</option>
                                    <option value="asc">Сначала дешевле</option>
                                    <option value="desc">Сначала дороже</option>
                                </select>
                            </div>
                        </>
                    )}

                    {type === 'resale' && (
                        <>
                            <div className="filter-group">
                                <label>Модель</label>
                                <select
                                    value={filters.model || 'all'}
                                    onChange={e => handleChange('model', e.target.value)}
                                >
                                    <option value="all">Все модели</option>
                                    {availableModels.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Год выпуска</label>
                                <input
                                    type="number"
                                    placeholder="Например, 2021"
                                    value={filters.year || ''}
                                    onChange={e => handleChange('year', e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="filter-footer">
                    <button className="reset-btn" onClick={onReset}>Сбросить</button>
                    <Button onClick={onClose} className="apply-btn">Применить</Button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;