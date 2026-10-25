const STOCK_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmClsUL14iiZCwctB4TqWDRh9zAgUGyMWfGPtX7xNWF7-6LJeb-QoXrDMNPk9xOLQ_-TWWvTvRjihW/pub?gid=0&single=true&output=csv';
const RESALE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmClsUL14iiZCwctB4TqWDRh9zAgUGyMWfGPtX7xNWF7-6LJeb-QoXrDMNPk9xOLQ_-TWWvTvRjihW/pub?gid=1981995690&single=true&output=csv';
const ARTICLES_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmClsUL14iiZCwctB4TqWDRh9zAgUGyMWfGPtX7xNWF7-6LJeb-QoXrDMNPk9xOLQ_-TWWvTvRjihW/pub?gid=1871313697&single=true&output=csv';

function normalizeGender(val) {
    if (!val) return 'Унисекс';
    const str = String(val).toLowerCase().trim();
    if (str.startsWith('жен') || str === 'ж' || str === 'female' || str === 'f') return 'Женский';
    if (str.startsWith('муж') || str === 'м' || str === 'male' || str === 'm') return 'Мужской';
    return 'Унисекс';
}

// Корректный CSV-парсер: поддерживает кавычки, запятые и переносы строк внутри ячеек
function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuotes) {
            if (char === '"') {
                if (text[i + 1] === '"') {
                    field += '"'; // экранированная кавычка ""
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char; // перенос строки внутри ячейки сохраняется
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(field);
                field = '';
            } else if (char === '\n') {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
            } else if (char === '\r') {
                // игнорируем, разделитель строк обрабатывается на \n
            } else {
                field += char;
            }
        }
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    if (rows.length === 0) return [];

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const result = [];

    for (let i = 1; i < rows.length; i++) {
        if (rows[i].every(cell => !cell || !cell.trim())) continue;

        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = rows[i][index] !== undefined ? rows[i][index].trim() : '';
        });
        result.push(obj);
    }

    return result;
}

export async function fetchCatalogData() {
    try {
        const [stockRes, resaleRes] = await Promise.all([
            fetch(STOCK_CSV_URL),
            fetch(RESALE_CSV_URL)
        ]);

        if (!stockRes.ok || !resaleRes.ok) {
            throw new Error('Не удалось получить данные с Google Таблиц');
        }

        const stockRaw = parseCSV(await stockRes.text());
        const resaleRaw = parseCSV(await resaleRes.text());

        const stock = stockRaw.map((item, idx) => ({
            id: String(item.id || item.ид || `stock_${idx + 1}`),
            title: item.title || item.наименование || item.название || '',
            brand: item.brand || item.бренд || '',
            category: item.category || item.категория || '',
            gender: normalizeGender(item.gender || item.пол),
            price: Number(String(item.price || item.цена || 0).replace(/\D/g, '')) || 0,
            sizes: (item.sizes || item.размер || item.размеры || 'One Size')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean),
            sizeChartUrl: item.size_chart || item.sizechart || item.размерная_сетка || item.сайт_бренда || '',
            image: item.image || item.фото || item.картинка || '',
            description: item.description || item.описание || ''
        }));

        const resale = resaleRaw.map((item, idx) => ({
            id: String(item.id || item.ид || `resale_${idx + 1}`),
            title: item.title || item.наименование || item.название || '',
            brand: item.brand || item.бренд || '',
            model: item.model || item.модель || '',
            category: item.category || item.категория || '',
            year: Number(item.year || item.год) || '',
            sizes: (item.sizes || item.размер || item.размеры || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean),
            image: item.image || item.фото || item.картинка || '',
            description: item.description || item.описание || ''
        }));

        return { stock, resale };
    } catch (e) {
        console.error('Ошибка загрузки Google Таблиц:', e.message);
        return { stock: [], resale: [] };
    }
}

export async function fetchArticles() {
    try {
        const res = await fetch(ARTICLES_CSV_URL);
        if (!res.ok) throw new Error('Не удалось загрузить статьи');

        const raw = parseCSV(await res.text());

        return raw
            .filter(item => item.category && item.title)
            .map((item, idx) => ({
                id: String(item.id || idx + 1),
                category: item.category.trim(),
                title: item.title || item.заголовок || '',
                image: item.image || item.фото || '',
                text: item.text || item.текст || ''
            }));
    } catch (e) {
        console.error('Ошибка загрузки статей:', e.message);
        return [];
    }
}

// URL вашего Apps Script веб-приложения
const ORDERS_API_URL = 'https://script.google.com/macros/s/AKfycbyVZRSD9kEpIAyWojBm8V159mNVbhqkKKdsK9X5JTeoLVTI4xbIyUK2ehkSDvkX-VFpKA/exec';

// Чтение заказов клиента из таблицы
export async function fetchSheetOrders(telegramId, username) {
    try {
        const params = new URLSearchParams();
        if (telegramId) params.append('telegram_id', telegramId);
        if (username) params.append('username', username);

        const res = await fetch(`${ORDERS_API_URL}?${params.toString()}&_=${Date.now()}`);
        if (!res.ok) throw new Error('Ошибка запроса заказов');

        const data = await res.json();
        return (data.orders || []).map(o => ({
            id: o.order_id,
            date: o.created_at || '',
            totalPrice: Number(String(o.total_price).replace(/\D/g, '')) || 0,
            itemsDescription: o.items_description || '',
            status: o.status || 'Создан',
            source: o.source || 'manual',
            deliveryPeriod: o.delivery_period || '16-21 день',
            recipient: {
                fullName: o.client_name || '',
                phone: o.client_phone || '',
                cdekAddress: o.cdek_address || ''
            },
            authStatus: o.auth_status || '',
            authReportUrl: o.auth_report_url || '',
            pickupCode: o.pickup_code || '',
            barcodeUrl: o.barcode_url || '',
            receiptUrl: o.receipt_url || ''
        }));
    } catch (e) {
        console.error('Ошибка чтения заказов из таблицы:', e.message);
        return [];
    }
}

// POST-запрос к Apps Script (Content-Type text/plain, чтобы браузер не слал preflight)
async function postToSheet(payload) {
    try {
        await fetch(ORDERS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        return true;
    } catch (e) {
        console.error('Ошибка записи в таблицу:', e.message);
        return false;
    }
}

export async function createOrderInSheet(order, telegramId, username) {
    try {
        const res = await fetch(ORDERS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'create_order',
                data: {
                    order_id: '', // номер присваивает таблица
                    telegram_id: telegramId || '',
                    username: username || '',
                    client_name: order.recipient.fullName,
                    client_phone: order.recipient.phone,
                    cdek_address: order.recipient.cdekAddress,
                    total_price: order.totalPrice,
                    items_description: order.items
                        .map(i => `${i.title} (${i.selectedSize}) x${i.quantity}`)
                        .join('; '),
                    status: order.status,
                    source: 'shop',
                    delivery_period: order.deliveryPeriod,
                    created_at: order.date
                }
            })
        });
        const data = await res.json().catch(() => ({}));
        return data.order_id || null;
    } catch (e) {
        console.error('Ошибка записи в таблицу:', e.message);
        return null;
    }
}

// Смена статуса заказа сотрудником из приложения
export function updateOrderStatusInSheet(orderId, status) {
    return postToSheet({ action: 'update_status', order_id: orderId, status });
}

// Клиент заполнил данные доставки — пишем в свои неоплаченные заказы
export function updateClientDataInSheet(client, telegramId, username) {
    return postToSheet({
        action: 'update_client_data',
        telegram_id: telegramId || '',
        username: username || '',
        client_name: client.fullName || '',
        client_phone: client.phone || '',
        cdek_address: client.cdekAddress || ''
    });
}

// Отзыв уходит менеджеру напрямую через бота
export function submitReviewToSheet(review, clientLabel) {
    return postToSheet({
        action: 'submit_review',
        order_id: review.orderId || '',
        client_label: clientLabel || '',
        rating: review.rating || 5,
        text: review.text || ''
    });
}