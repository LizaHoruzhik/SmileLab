document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Получаем информацию о воспитателе
    const db = getDB();
    const teacher = db.teachers.find(t => t.login === currentUser.login);
    
    if (!teacher) {
        logout();
        return;
    }
    
    // Получаем информацию о группе
    const group = db.groups.find(g => g.id === teacher.groupId);
    
    // Элементы интерфейса
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const groupNameElement = document.getElementById('teacherGroupName').querySelector('span');
    const attendanceTableBody = document.querySelector('.attendance-table tbody');
    const notificationForm = document.getElementById('notificationForm');
    const notificationsList = document.getElementById('notificationsList');
    
    // Устанавливаем название группы
    if (group) {
        groupNameElement.textContent = group.name;
    }
    
    // Инициализация вкладок
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Загрузка детей в группе
    // Загрузка детей в группе с цветными ячейками посещения
function loadChildren() {
    attendanceTableBody.innerHTML = '';
    
    const children = db.children.filter(c => c.groupId === teacher.groupId);
    const today = new Date().toISOString().split('T')[0];
    
    children.forEach(child => {
        const attendanceRecord = db.attendance.find(a => a.childId === child.id && a.date === today);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${child.fullName}</td>
            <td>
                <div class="attendance-cell" 
                     data-child="${child.id}" 
                     data-present="${attendanceRecord ? attendanceRecord.present : 'null'}">
                </div>
            </td>
            <td>
                <button class="btn small view-child" data-child="${child.id}">Просмотр</button>
            </td>
        `;
        attendanceTableBody.appendChild(row);
    });
    
    // Инициализация ячеек посещения
    document.querySelectorAll('.attendance-cell').forEach(cell => {
        const childId = cell.getAttribute('data-child');
        const present = cell.getAttribute('data-present');
        
        // Устанавливаем начальный цвет
        updateCellColor(cell, present);
        
        // Обработчик клика
        cell.addEventListener('click', function() {
            const currentPresent = this.getAttribute('data-present');
            let newPresent;
            
            // Циклическое переключение: null -> true -> false -> null
            if (currentPresent === 'null') {
                newPresent = 'true';
            } else if (currentPresent === 'true') {
                newPresent = 'false';
            } else {
                newPresent = 'null';
            }
            
            this.setAttribute('data-present', newPresent);
            updateCellColor(this, newPresent);
            saveAttendance(childId, newPresent);
        });
    });
    
    // Обработчики для просмотра информации о ребенке
    document.querySelectorAll('.view-child').forEach(btn => {
        btn.addEventListener('click', function() {
            viewChild(this.getAttribute('data-child'));
        });
    });
}

// Обновление цвета ячейки
function updateCellColor(cell, present) {
    cell.className = 'attendance-cell'; // Сбрасываем классы
    
    if (present === 'true') {
        cell.classList.add('present');
        cell.title = 'Присутствовал';
    } else if (present === 'false') {
        cell.classList.add('absent');
        cell.title = 'Отсутствовал';
    } else {
        cell.classList.add('unknown');
        cell.title = 'Не отмечено';
    }
}

// Сохранение посещения в базу данных
function saveAttendance(childId, present) {
    const today = new Date().toISOString().split('T')[0];
    const db = getDB();
    
    // Ищем существующую запись
    const existingIndex = db.attendance.findIndex(a => 
        a.childId == childId && a.date === today
    );
    
    if (present === 'null') {
        // Удаляем запись, если статус "не отмечено"
        if (existingIndex !== -1) {
            db.attendance.splice(existingIndex, 1);
        }
    } else {
        const attendanceData = {
            childId: parseInt(childId),
            date: today,
            present: present === 'true'
        };
        
        if (existingIndex !== -1) {
            // Обновляем существующую запись
            db.attendance[existingIndex] = {
                ...db.attendance[existingIndex],
                ...attendanceData
            };
        } else {
            // Создаем новую запись
            db.attendance.push({
                id: generateId(),
                ...attendanceData,
                markedBy: 'teacher'
            });
        }
    }
    
    saveDB(db);
}
    
    // Просмотр информации о ребенке
    function viewChild(childId) {
        const db = getDB();
        const child = db.children.find(c => c.id == childId);
        if (!child) return;
        
        const group = db.groups.find(g => g.id == child.groupId);
        const parents = db.parents.filter(p => p.childId == childId);
        
        // Показываем модальное окно
        const modal = document.getElementById('viewChildModal');
        
        // Основная информация о ребенке
        document.getElementById('childFullName').textContent = child.fullName;
        document.getElementById('childBirthDate').textContent = formatDate(child.birthDate);
        document.getElementById('childGroup').textContent = group ? `Группа №${group.number}` : 'Не указана';
        
        // Заполняем информацию о родителях
        const parentsInfo = document.getElementById('parentsInfo');
        parentsInfo.innerHTML = '';
        
        if (parents.length > 0) {
            parents.forEach((parent, index) => {
                const parentDiv = document.createElement('div');
                parentDiv.className = 'parent-info';
                parentDiv.innerHTML = `
                    <h4>Родитель ${index + 1}</h4>
                    <p><strong>ФИО:</strong> ${parent.fullName}</p>
                    <p><strong>Дата рождения:</strong> ${formatDate(parent.birthDate)}</p>
                    <p><strong>Место работы:</strong> ${parent.workPlace || 'Не указано'}</p>
                    <p><strong>Телефон:</strong> ${parent.phone || 'Не указан'}</p>
                    <p><strong>Адрес:</strong> ${parent.address || 'Не указан'}</p>
                `;
                parentsInfo.appendChild(parentDiv);
            });
        } else {
            parentsInfo.innerHTML = '<p>Информация о родителях отсутствует</p>';
        }
        
        // Заполняем посещение (как у администратора)
        const attendanceCalendar = document.querySelector('#viewChildModal .attendance-calendar');
        attendanceCalendar.innerHTML = '';
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Создаем контейнер для месяцев
        const monthsContainer = document.createElement('div');
        monthsContainer.className = 'attendance-months';
        
        // Текущий месяц
        const currentMonthDiv = document.createElement('div');
        currentMonthDiv.className = 'attendance-month';
        currentMonthDiv.innerHTML = `<h4>${getMonthName(currentMonth)} ${currentYear}</h4>`;
        createAttendanceTable(currentMonthDiv, currentYear, currentMonth, child.id, db);
        monthsContainer.appendChild(currentMonthDiv);
        
        // Предыдущий месяц
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
        }
        
        const prevMonthDiv = document.createElement('div');
        prevMonthDiv.className = 'attendance-month';
        prevMonthDiv.innerHTML = `<h4>${getMonthName(prevMonth)} ${prevYear}</h4>`;
        createAttendanceTable(prevMonthDiv, prevYear, prevMonth, child.id, db);
        monthsContainer.appendChild(prevMonthDiv);
        
        attendanceCalendar.appendChild(monthsContainer);
        
        // Заполняем кружки
        const childActivities = document.getElementById('childActivities');
        childActivities.innerHTML = '';
        
        // Получаем все записи ребенка в кружках
        const childActivitiesList = db.childrenActivities
            .filter(ca => ca.childId == child.id)
            .map(ca => {
                const schedule = db.schedule.find(s => s.id == ca.scheduleId);
                const activity = db.activities.find(a => a.id == ca.activityId);
                return { ...ca, schedule, activity };
            })
            .filter(ca => ca.schedule && ca.activity);
        
        if (childActivitiesList.length > 0) {
            // Группируем кружки по дням недели для удобного отображения
            const activitiesByDay = {};
            
            childActivitiesList.forEach(ca => {
                if (!activitiesByDay[ca.schedule.day]) {
                    activitiesByDay[ca.schedule.day] = [];
                }
                activitiesByDay[ca.schedule.day].push(ca);
            });
            
            // Создаем элементы для каждого дня
            Object.entries(activitiesByDay).forEach(([day, activities]) => {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'activity-day';
                
                const dayHeader = document.createElement('h4');
                dayHeader.textContent = getDayName(day);
                dayDiv.appendChild(dayHeader);
                
                activities.forEach(activity => {
                    const activityDiv = document.createElement('div');
                    activityDiv.className = 'activity-item';
                    activityDiv.innerHTML = `
                        <p><strong>${activity.activity.name}</strong></p>
                        <p>Время: ${activity.schedule.time}</p>
                        <p>Цена: ${activity.activity.price} ₽ за занятие</p>
                    `;
                    dayDiv.appendChild(activityDiv);
                });
                
                childActivities.appendChild(dayDiv);
            });
        } else {
            childActivities.innerHTML = '<p>Ребенок не записан ни в один кружок</p>';
        }
        
        modal.style.display = 'block';
    }
    
    // Функция создания таблицы посещений (как у администратора)
    function createAttendanceTable(container, year, month, childId, db) {
        const table = document.createElement('table');
        table.className = 'attendance-table';
        
        // Заголовки дней недели
        const headerRow = document.createElement('tr');
        ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'].forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        
        // Получаем все дни месяца
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let date = 1;
        
        // Создаем строки таблицы (5 строк по 5 дней)
        for (let i = 0; i < 5; i++) {
            const row = document.createElement('tr');
            
            for (let j = 0; j < 5; j++) {
                const cell = document.createElement('td');
                
                if (date <= daysInMonth) {
                    const currentDate = new Date(year, month, date);
                    const dayOfWeek = currentDate.getDay();
                    
                    // Пропускаем выходные
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        date++;
                        j--; // Уменьшаем счетчик, чтобы не пропустить ячейку
                        continue;
                    }
                    
                    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    const attendanceRecord = db.attendance.find(a => a.childId == childId && a.date === dayStr);
                    
                    cell.textContent = date;
                    cell.className = 'day-cell';
                    
                    if (attendanceRecord) {
                        cell.classList.add(attendanceRecord.present ? 'present' : 'absent');
                        cell.title = `${date} ${getMonthName(month)}: ${attendanceRecord.present ? 'Присутствовал' : 'Отсутствовал'}`;
                    } else {
                        cell.classList.add('unknown');
                        cell.title = `${date} ${getMonthName(month)}: Не отмечено`;
                    }
                    
                    date++;
                } else {
                    cell.className = 'empty-cell';
                }
                
                row.appendChild(cell);
            }
            
            table.appendChild(row);
        }
        
        container.appendChild(table);
    }
    
    // Обработчик формы уведомления
    notificationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('notificationTitle').value;
        const message = document.getElementById('notificationMessage').value;
        
        if (!title || !message) {
            alert('Заполните все поля!');
            return;
        }
        
        const db = getDB();
        
        // Получаем всех родителей в группе
        const childrenInGroup = db.children.filter(c => c.groupId === teacher.groupId);
        const parentIds = [];
        
        childrenInGroup.forEach(child => {
            const parents = db.parents.filter(p => p.childId === child.id);
            parents.forEach(parent => {
                const user = db.users.find(u => u.username === child.login);
                if (user && !parentIds.includes(user.id)) {
                    parentIds.push(user.id);
                }
            });
        });
        
        // Создаем уведомление
        const notification = {
            id: generateId(),
            groupId: teacher.groupId,
            title: title,
            message: message,
            date: new Date().toISOString(),
            sentTo: parentIds
        };
        
        db.notifications.push(notification);
        saveDB(db);
        
        // Очищаем форму
        notificationForm.reset();
        
        // Показываем сообщение об успехе
        alert('Уведомление отправлено всем родителям группы!');
        
        // Обновляем список уведомлений
        loadNotifications();
    });
    
    // Загрузка уведомлений
function loadNotifications() {
    notificationsList.innerHTML = '';
    
    const db = getDB();
    const groupNotifications = db.notifications
        .filter(n => n.groupId === teacher.groupId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (groupNotifications.length === 0) {
        notificationsList.innerHTML = '<p>Нет отправленных уведомлений</p>';
        return;
    }
    
    groupNotifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification';
        notificationElement.innerHTML = `
            <h4>${notification.title}</h4>
            <div class="date">${formatDate(notification.date)}</div>
            <p>${notification.message}</p>
        `;
        notificationsList.appendChild(notificationElement);
    });
}
    
    // Закрытие модального окна
    document.querySelector('#viewChildModal .close').addEventListener('click', function() {
        document.getElementById('viewChildModal').style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Инициализация
    loadChildren();
    loadNotifications();
});

// Вспомогательные функции для работы с датами
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function getMonthName(monthIndex) {
    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[monthIndex];
}

function getDayName(day) {
    const days = {
        'monday': 'Понедельник',
        'tuesday': 'Вторник',
        'wednesday': 'Среда',
        'thursday': 'Четверг',
        'friday': 'Пятница'
    };
    return days[day.toLowerCase()] || day;
}

function getShortDayOfWeek(dayIndex) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[dayIndex];
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}