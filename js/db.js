// Имитация базы данных
let db = {
    users: [
        {
            id: 1,
            username: 'admin',
            password: 'admin',
            role: 'admin',
            fullName: 'Администратор'
        }
    ],
    groups: [],
    children: [],
    teachers: [],
    parents: [],
    activities: [],
    schedule: [],
    notifications: [],
    attendance: [],
    foodPrices: [],
    childrenActivities: []
};

// Инициализация localStorage
function initDB() {
    if (!localStorage.getItem('smilelab_db')) {
        localStorage.setItem('smilelab_db', JSON.stringify(db));
    }
}

// Получение данных из localStorage
function getDB() {
    return JSON.parse(localStorage.getItem('smilelab_db'));
}

// Сохранение данных в localStorage
function saveDB(data) {
    localStorage.setItem('smilelab_db', JSON.stringify(data));
}

// Получение текущего пользователя
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('smilelab_currentUser'));
}

// Установка текущего пользователя
function setCurrentUser(user) {
    localStorage.setItem('smilelab_currentUser', JSON.stringify(user));
}

// Выход пользователя
function logout() {
    localStorage.removeItem('smilelab_currentUser');
    window.location.href = 'index.html';
}

// Получение списка дней в месяце
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// Форматирование даты
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU');
}

// Форматирование времени
function formatTime(time) {
    return time.substring(0, 5);
}

// Получение названия месяца
function getMonthName(month) {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[month];
}

// Получение дня недели
function getDayOfWeek(day) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[day];
}

// Получение короткого названия дня недели
function getShortDayOfWeek(day) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[day];
}

// Генерация ID
function generateId() {
    return Math.floor(Math.random() * 1000000);
}

// Инициализация базы данных при загрузке
initDB();