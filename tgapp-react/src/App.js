import './App.css';
import { useEffect, useState, useMemo, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTelegram } from "./components/hooks/useTelegram";
import { fetchCatalogData, fetchSheetOrders, createOrderInSheet, updateClientDataInSheet } from "./services/productsApi";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Home from "./components/Home/Home";
import Catalog from "./components/Catalog/Catalog";
import ProductList from "./components/ProductList/ProductList";
import Resale from "./components/Resale/Resale";
import ProductDetail from "./components/ProductDetail/ProductDetail";
import ResaleDetail from "./components/ResaleDetail/ResaleDetail";
import Cart from "./components/Cart/Cart";
import Profile from "./components/Profile/Profile";
import Checkout from "./components/Checkout/Checkout";
import Payment from "./components/Payment/Payment";
import OrderDetail from "./components/OrderDetail/OrderDetail";
import Knowledge from "./components/Knowledge/Knowledge";
import ArticleDetail from "./components/Knowledge/ArticleDetail";

// Безопасное чтение localStorage: битый JSON больше не уронит приложение
function safeParse(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        console.warn('Поврежденные данные в localStorage:', key);
        return fallback;
    }
}

function App() {
    const { tg, user } = useTelegram();
    const navigate = useNavigate();
    const location = useLocation();

    const [stockProducts, setStockProducts] = useState([]);
    const [resaleProducts, setResaleProducts] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [sheetOrders, setSheetOrders] = useState([]);

    const [userProfile, setUserProfile] = useState(() =>
        safeParse('leo_user_profile', { fullName: '', phone: '', cdekAddress: '' })
    );

    const [localOrders, setLocalOrders] = useState(() =>
        safeParse('leo_user_orders', [])
    );

    const [reviews, setReviews] = useState(() =>
        safeParse('leo_reviews', {})
    );

    // Стабильный идентификатор клиента: ID из Telegram с запоминанием
    const getTgId = () => user?.id || localStorage.getItem('leo_tg_id') || '';
    const getTgUsername = () => user?.username
        ? `@${user.username}`
        : (localStorage.getItem('leo_tg_username') || '');

    // ВАЖНО: объявление refreshSheetOrders ДО эффектов, которые его используют
    const refreshSheetOrders = useCallback(() => {
        fetchSheetOrders(getTgId(), getTgUsername()).then(setSheetOrders);
    }, [user]);

    // Инициализация Telegram + загрузка каталога
    useEffect(() => {
        tg.ready();
        fetchCatalogData().then(data => {
            setStockProducts(data.stock);
            setResaleProducts(data.resale);
        });
    }, [tg]);

    // Запоминаем ID и username клиента при первом запуске
    useEffect(() => {
        if (user?.id) {
            localStorage.setItem('leo_tg_id', String(user.id));
            if (user.username) {
                localStorage.setItem('leo_tg_username', `@${user.username}`);
            }
        }
    }, [user]);

    // Загрузка заказов: первичная + при каждом переходе по страницам
    useEffect(() => {
        refreshSheetOrders();
    }, [location.pathname, refreshSheetOrders]);

    // Обновление заказов при возврате пользователя в мини апп
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') refreshSheetOrders();
        };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onVisible);
        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onVisible);
        };
    }, [refreshSheetOrders]);

    // Слияние табличных и локальных заказов + сортировка по убыванию номера
    const allOrders = useMemo(() => {
        const merged = [];
        const usedLocal = new Set();

        sheetOrders.forEach(sheetOrder => {
            const localMatch = localOrders.find(l => l.id === sheetOrder.id);

            if (localMatch) {
                usedLocal.add(localMatch.id);
                merged.push({
                    ...localMatch,
                    ...sheetOrder,
                    // Состав с фото берем из локальной копии, статус — из таблицы
                    items: (Array.isArray(localMatch.items) && localMatch.items.length > 0)
                        ? localMatch.items
                        : sheetOrder.items,
                    recipient: {
                        fullName: sheetOrder.recipient?.fullName || localMatch.recipient?.fullName || '',
                        phone: sheetOrder.recipient?.phone || localMatch.recipient?.phone || '',
                        cdekAddress: sheetOrder.recipient?.cdekAddress || localMatch.recipient?.cdekAddress || ''
                    }
                });
            } else {
                merged.push(sheetOrder);
            }
        });

        localOrders.forEach(local => {
            if (!usedLocal.has(local.id)) merged.push(local);
        });

        // Свежие заказы сверху: сортировка по числовой части номера
        const numericId = (id) => {
            const n = parseInt(String(id || '').replace(/\D/g, ''), 10);
            return Number.isNaN(n) ? 0 : n;
        };

        return merged.sort((a, b) => numericId(b.id) - numericId(a.id));
    }, [sheetOrders, localOrders]);

    const saveLocalOrders = (orders) => {
        setLocalOrders(orders);
        localStorage.setItem('leo_user_orders', JSON.stringify(orders));
    };

    // Кнопка «Назад» в Telegram
    useEffect(() => {
        if (location.pathname !== '/') {
            tg.BackButton.show();
            const onBackClick = () => navigate(-1);
            tg.BackButton.onClick(onBackClick);
            return () => tg.BackButton.offClick(onBackClick);
        } else {
            tg.BackButton.hide();
        }
    }, [location.pathname, navigate, tg]);

    const onAddToCart = (product, selectedSize) => {
        const itemKey = `${product.id}-${selectedSize}`;
        setCartItems(prev => {
            const existing = prev.find(item => item.cartKey === itemKey);
            if (existing) {
                return prev.map(item =>
                    item.cartKey === itemKey
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartKey: itemKey, selectedSize, quantity: 1 }];
        });
    };

    const onUpdateQuantity = (cartKey, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.cartKey === cartKey) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const onRemoveItem = (cartKey) => {
        setCartItems(prev => prev.filter(item => item.cartKey !== cartKey));
    };

    const totalCount = useMemo(
        () => cartItems.reduce((s, i) => s + i.quantity, 0),
        [cartItems]
    );

    const totalPrice = useMemo(
        () => cartItems.reduce((s, i) => s + i.price * i.quantity, 0),
        [cartItems]
    );

    // Оформление заказа из магазина: номер присваивает таблица, при сбое — фолбэк.
    // Оплату подтверждает менеджер через таблицу, поэтому стартовый статус — «Ожидает оплаты»
    const onInitOrder = async (newOrder) => {
        const order = {
            ...newOrder,
            id: '',
            status: 'Ожидает оплаты',
            source: 'shop',
            deliveryPeriod: '2-5 дней'
        };

        const sheetId = await createOrderInSheet(order, getTgId(), getTgUsername());
        order.id = sheetId || ('LM-' + Date.now().toString().slice(-6));

        saveLocalOrders([order, ...localOrders]);
        setCartItems([]);

        if (!userProfile.fullName) {
            const updatedProfile = { ...newOrder.recipient };
            setUserProfile(updatedProfile);
            localStorage.setItem('leo_user_profile', JSON.stringify(updatedProfile));
        }

        refreshSheetOrders();
        return order.id;
    };

    // Сохранение профиля: локально + в таблицу для неоплаченных ручных заказов
    const onSaveProfile = (updatedProfile) => {
        setUserProfile(updatedProfile);
        localStorage.setItem('leo_user_profile', JSON.stringify(updatedProfile));
        updateClientDataInSheet(updatedProfile, getTgId(), getTgUsername())
            .then(() => refreshSheetOrders());
    };

    const onAddReview = (orderId, reviewData) => {
        const updated = { ...reviews, [orderId]: reviewData };
        setReviews(updated);
        localStorage.setItem('leo_reviews', JSON.stringify(updated));
    };

    return (
        <div className="App">
            <Header />
            <main className="app-content">
                <Routes>
                    <Route index element={<Home cartCount={totalCount} />} />
                    <Route path="catalog" element={<Catalog />} />
                    <Route
                        path="catalog/in-stock"
                        element={<ProductList products={stockProducts} />}
                    />
                    <Route
                        path="catalog/resale"
                        element={<Resale products={resaleProducts} />}
                    />
                    <Route
                        path="product/:id"
                        element={
                            <ProductDetail
                                products={stockProducts}
                                onAddToCart={onAddToCart}
                                onUpdateQuantity={onUpdateQuantity}
                                cartItems={cartItems}
                            />
                        }
                    />
                    <Route
                        path="resale-product/:id"
                        element={<ResaleDetail products={resaleProducts} />}
                    />
                    <Route
                        path="cart"
                        element={
                            <Cart
                                cartItems={cartItems}
                                onUpdateQuantity={onUpdateQuantity}
                                onRemove={onRemoveItem}
                                totalPrice={totalPrice}
                            />
                        }
                    />
                    <Route
                        path="checkout"
                        element={
                            <Checkout
                                cartItems={cartItems}
                                totalPrice={totalPrice}
                                userProfile={userProfile}
                                onInitOrder={onInitOrder}
                            />
                        }
                    />
                    <Route
                        path="payment/:orderId"
                        element={<Payment orders={allOrders} />}
                    />
                    <Route
                        path="profile"
                        element={
                            <Profile
                                userProfile={userProfile}
                                onSaveProfile={onSaveProfile}
                                orders={allOrders}
                            />
                        }
                    />
                    <Route
                        path="order/:orderId"
                        element={
                            <OrderDetail
                                orders={allOrders}
                                onAddReview={onAddReview}
                                reviews={reviews}
                                userProfile={userProfile}
                                onRefreshOrders={refreshSheetOrders}
                            />
                        }
                    />
                    <Route path="knowledge" element={<Knowledge />} />
                    <Route path="knowledge/article/:id" element={<ArticleDetail />} />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}

export default App;