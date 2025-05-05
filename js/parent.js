document.addEventListener('DOMContentLoaded', function() {
    // 1. Проверка авторизации пользователя
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Загрузка данных из базы
    const db = getDB();
    
    // Ищем ребенка по логину текущего пользователя
    let child = db.children.find(c => c.login === currentUser.login);
    
    // Если не нашли, возможно это родитель (проверяем родителей)
    if (!child) {
        const parent = db.parents.find(p => p.login === currentUser.login);
        if (parent) {
            child = db.children.find(c => c.id === parent.childId);
        }
    }
    
    if (!child) {
        console.error('Child not found for user:', currentUser);
        logout();
        return;
    }

    let group = db.groups.find(g => g.id === child.groupId);
    let parents = db.parents.filter(p => p.childId === child.id);

    // 3. Основные функции

    // Форматирование даты
    function formatDate(dateString) {
        if (!dateString) return 'Не указана';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    // Генерация ID
    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // 4. Работа с вкладками
    function initTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Снимаем активные классы
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Устанавливаем активные классы
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                // Загружаем данные для активной вкладки
                if (tabId === 'notifications') loadNotifications();
                else if (tabId === 'payments') loadPayments();
                else if (tabId === 'activities') loadActivities();
                else if (tabId === 'child') loadChildInfo();
            });
        });

        // По умолчанию загружаем уведомления
        loadNotifications();
    }

    // 5. Загрузка информации о ребенке
    function loadChildInfo() {
        try {
            // Основная информация о ребенке
            document.getElementById('parentChildName').querySelector('span').textContent = child.fullName;
            document.getElementById('childFullName').textContent = child.fullName;
            document.getElementById('childBirthDate').textContent = formatDate(child.birthDate);
            document.getElementById('childGroup').textContent = group ? `Группа №${group.number}` : 'Не указана';
            document.getElementById('childAddress').textContent = child.address || 'Не указан';

            // Информация о родителях
            const parentsInfo = document.getElementById('parentsInfo');
            parentsInfo.innerHTML = '';
            
            parents = db.parents.filter(p => p.childId == child.id);
            
            if (parents && parents.length > 0) {
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
        } catch (error) {
            console.error('Ошибка загрузки информации о ребенке:', error);
        }
    }

    // 6. Загрузка уведомлений и инициализация кнопок посещения
function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = '';
    
    // Получаем уведомления для текущей группы ребенка
    const groupNotifications = db.notifications.filter(n => n.groupId === child.groupId);
    
    if (groupNotifications.length === 0) {
        notificationsList.innerHTML = '<p>Новых уведомлений нет</p>';
    } else {
        // Сортируем уведомления по дате (новые сверху)
        groupNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Создаем элементы уведомлений
        groupNotifications.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = 'notification-item';
            
            const date = new Date(notification.date);
            const formattedDate = date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            notificationElement.innerHTML = `
                <div class="notification-header">
                    <h4>${notification.title || 'Без темы'}</h4>
                    <span class="notification-date">${formattedDate}</span>
                </div>
                <div class="notification-message">
                    <p>${notification.message}</p>
                </div>
            `;
            
            notificationsList.appendChild(notificationElement);
        });
    }
    
    initAttendanceButtons();
}

    // 7. Инициализация кнопок посещения
    function initAttendanceButtons() {
        const today = new Date().toISOString().split('T')[0];
        const attendBtn = document.getElementById('willAttendBtn');
        const notAttendBtn = document.getElementById('willNotAttendBtn');
        
        // Проверяем текущую отметку посещения
        const attendanceRecord = db.attendance.find(a => 
            a.childId == child.id && a.date === today
        );
        
        // Сбрасываем выделение кнопок
        attendBtn.classList.remove('active');
        notAttendBtn.classList.remove('active');
        
        // Устанавливаем выделение активной кнопки
        if (attendanceRecord) {
            if (attendanceRecord.present) {
                attendBtn.classList.add('active');
            } else {
                notAttendBtn.classList.add('active');
            }
        }
        
        // Обработчики кликов
        attendBtn.addEventListener('click', function() {
            markAttendance(today, true);
            this.classList.add('active');
            notAttendBtn.classList.remove('active');
        });
        
        notAttendBtn.addEventListener('click', function() {
            markAttendance(today, false);
            this.classList.add('active');
            attendBtn.classList.remove('active');
        });
    }

    // 8. Функция отметки посещения
    function markAttendance(date, present) {
        const attendanceRecord = db.attendance.find(a => 
            a.childId == child.id && a.date === date
        );
        
        if (attendanceRecord) {
            attendanceRecord.present = present;
        } else {
            db.attendance.push({
                id: generateId(),
                childId: child.id,
                date: date,
                present: present
            });
        }
        
        saveDB(db);
        alert(`Посещение на ${formatDate(date)}: ${present ? 'Придет' : 'Не придет'}`);
    }

    // 9. Загрузка платежей
    function loadPayments() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Установка текущего месяца в заголовке
        
        // Загрузка данных для текущего месяца
        loadMonthPayments(currentMonth, currentYear, 'current');
        
        // Загрузка данных для предыдущего месяца
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        loadMonthPayments(prevMonth, prevYear, 'prev');
        
    }

    function loadMonthPayments(month, year, prefix) {
        // Создаем контейнер для месяца, если его нет
        let container = document.getElementById(`${prefix}MonthContainer`);
        
        if (!container) {
            container = document.createElement('div');
            container.id = `${prefix}MonthContainer`;
            container.className = 'month-payments';
            
            const header = document.createElement('h3');
            header.textContent = `${getMonthName(month)} ${year}`;
            container.appendChild(header);
            
            const table = document.createElement('table');
            table.className = 'payment-calendar';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Пн</th>
                        <th>Вт</th>
                        <th>Ср</th>
                        <th>Чт</th>
                        <th>Пт</th>
                        <th>Сб</th>
                        <th>Вс</th>
                    </tr>
                </thead>
                <tbody id="${prefix}MonthTable"></tbody>
            `;
            container.appendChild(table);
            
            const totals = document.createElement('div');
            totals.className = 'payment-totals';
            totals.id = `${prefix}MonthTotals`;
            container.appendChild(totals);
            
            document.querySelector('#payments .payment-details').insertBefore(
                container, 
                document.querySelector('.payment-total')
            );
        }
        
        // Заполняем календарь
        fillCalendar(month, year, `${prefix}MonthTable`, `${prefix}MonthTotals`);
    }

    function fillCalendar(month, year, tableId, totalsId) {
        const tableBody = document.getElementById(tableId);
        tableBody.innerHTML = '';
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        let startingDay = firstDay.getDay();
        if (startingDay === 0) startingDay = 7;
        
        let date = 1;
        let rowsNeeded = Math.ceil((startingDay - 1 + daysInMonth) / 7);
        
        // Получаем данные
        const monthAttendance = db.attendance.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() === month && d.getFullYear() === year && a.childId == child.id;
        });
        
        const monthFoodPrices = db.foodPrices.filter(f => {
            const d = new Date(f.date);
            return d.getMonth() === month && d.getFullYear() === year;
        });
        
        // Получаем расписание кружков ребенка
        const childActivities = db.childrenActivities
            .filter(ca => ca.childId == child.id)
            .map(ca => {
                const schedule = db.schedule.find(s => s.id == ca.scheduleId);
                const activity = db.activities.find(a => a.id == ca.activityId);
                return { ...ca, schedule, activity };
            })
            .filter(ca => ca.schedule && ca.activity);
    
        // Создаем карту для учета посещений кружков
        const activitiesStats = {};
        childActivities.forEach(ca => {
            if (!activitiesStats[ca.activityId]) {
                activitiesStats[ca.activityId] = {
                    name: ca.activity.name,
                    price: ca.activity.price,
                    count: 0,
                    days: {}
                };
            }
        });
    
        let totalFoodDays = 0;
        let totalFoodAmount = 0;
        
        // Заполняем таблицу календаря
        for (let i = 0; i < rowsNeeded; i++) {
            const row = document.createElement('tr');
            
            for (let j = 1; j <= 7; j++) {
                const cell = document.createElement('td');
                
                if (i === 0 && j < startingDay) {
                    // Пустые ячейки перед первым днем месяца
                    cell.textContent = '';
                    cell.className = 'empty';
                } else if (date > daysInMonth) {
                    // Пустые ячейки после последнего дня месяца
                    cell.textContent = '';
                    cell.className = 'empty';
                } else {
                    const currentDate = new Date(year, month, date);
                    const dateString = formatDateForDB(currentDate);
                    const dayOfWeek = j === 7 ? 0 : j;
                    const isWeekend = j === 6 || j === 7;
                    const dayName = getDayNameByNumber(dayOfWeek);
                    
                    const attendance = monthAttendance.find(a => a.date === dateString);
                    const wasPresent = attendance && (attendance.present || attendance.isPresent);
                    
                    if (isWeekend) {
                        cell.textContent = date;
                        cell.className = 'weekend';
                    } else if (attendance) {
                        cell.textContent = date;
                        cell.className = wasPresent ? 'present' : 'absent';
                        
                        if (wasPresent) {
                            totalFoodDays++;
                            
                            // Стоимость питания
                            const foodPrice = monthFoodPrices.find(f => 
                                new Date(f.date).getDate() === date
                            );
                            totalFoodAmount += foodPrice ? foodPrice.price : 
                                (db.foodPrices.length > 0 ? db.foodPrices[0].price : 0);
                            
                            // Проверяем кружки на этот день
                            childActivities.forEach(ca => {
                                if (ca.schedule.day === dayName) {
                                    activitiesStats[ca.activityId].count++;
                                    if (!activitiesStats[ca.activityId].days[dayName]) {
                                        activitiesStats[ca.activityId].days[dayName] = 0;
                                    }
                                    activitiesStats[ca.activityId].days[dayName]++;
                                }
                            });
                        }
                    } else {
                        cell.textContent = date;
                        cell.className = 'future';
                    }
                    
                    date++;
                }
                
                row.appendChild(cell);
            }
            
            tableBody.appendChild(row);
        }
        
        // Рассчитываем сумму за кружки
        let activitiesHtml = '';
        let totalActivitiesAmount = 0;
        
        for (const activityId in activitiesStats) {
            const activity = activitiesStats[activityId];
            if (activity.count > 0) {
                const activitySum = activity.count * activity.price;
                totalActivitiesAmount += activitySum;
                
                const daysList = Object.entries(activity.days)
                    .map(([day, count]) => `${getDayName(day)}: ${count}`)
                    .join(', ');
                
                activitiesHtml += `
                    <div class="activity-detail">
                        <p><strong>${activity.name}</strong>: 
                        ${activity.count} × ${activity.price} ₽ = ${activitySum} ₽</p>
                        ${daysList ? `<p class="days-info">Дни: ${daysList}</p>` : ''}
                    </div>
                `;
            }
        }
        
        // Отображаем итоги
        const totalsContainer = document.getElementById(totalsId);
        totalsContainer.innerHTML = `
            <div class="total-section">
                <h4>Питание</h4>
                <p>Дней посещения: <strong>${totalFoodDays}</strong></p>
                <p>Сумма: <strong>${totalFoodAmount} ₽</strong></p>
            </div>
            <div class="total-section">
                <h4>Кружки</h4>
                ${activitiesHtml || '<p>Нет посещений кружков</p>'}
                <p><strong>Итого за кружки: ${totalActivitiesAmount} ₽</strong></p>
            </div>
            <div class="total-section grand-total">
                <h4>Общая сумма к оплате</h4>
                <p><strong>${totalFoodAmount + totalActivitiesAmount} ₽</strong></p>
            </div>
        `;
    }
    
    // Вспомогательные функции
    function getDayNameByNumber(dayNumber) {
        const days = {
            1: 'monday',
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday',
            6: 'saturday',
            0: 'sunday'
        };
        return days[dayNumber] || '';
    }
    
    function getDayName(day) {
        const days = {
            'monday': 'Пн',
            'tuesday': 'Вт',
            'wednesday': 'Ср',
            'thursday': 'Чт',
            'friday': 'Пт',
            'saturday': 'Сб',
            'sunday': 'Вс'
        };
        return days[day.toLowerCase()] || day;
    }
    
    function formatDateForDB(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    function getMonthName(monthIndex) {
        const months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return months[monthIndex];
    }

    // Вспомогательные функции для платежей
    function getChildScheduleForMonth(month, year) {
        // Получаем все scheduleId, на которые записан ребенок
        const childActivities = db.childrenActivities.filter(ca => ca.childId == child.id);
        const childScheduleIds = childActivities.map(ca => ca.scheduleId);
        
        // Получаем расписание для этих занятий
        return db.schedule.filter(s => childScheduleIds.includes(s.id));
    }

    function getDayNumber(dayName) {
        const daysMap = {
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
            'sunday': 0
        };
        return daysMap[dayName.toLowerCase()] || 0;
    }

    function formatDateForDB(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getMonthName(monthIndex) {
        const months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return months[monthIndex];
    }

    // 10. Загрузка информации о кружках (исправленная версия)
function loadActivities() {
    loadActivitiesSchedule();
    // Убираем вызов loadSelectedActivities()
    document.getElementById('saveActivitiesBtn').addEventListener('click', saveSelectedActivities);
}

    // 11. Загрузка расписания кружков (исправленная версия)
function loadActivitiesSchedule() {
    const scheduleBody = document.getElementById('activitiesSchedule');
    scheduleBody.innerHTML = '';
    
    // Инициализация если не существует
    if (!db.childrenActivities) db.childrenActivities = [];
    if (!db.schedule || !db.activities) {
        console.error('Отсутствуют данные расписания или кружков');
        return;
    }

    // Создаем строки таблицы
    db.activities.forEach(activity => {
        const row = document.createElement('tr');
        
        // Название кружка
        const nameCell = document.createElement('td');
        nameCell.textContent = activity.name;
        row.appendChild(nameCell);
        
        // Ячейки для дней недели
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
            const dayCell = document.createElement('td');
            
            // Находим занятия на этот день
            const daySchedule = db.schedule.filter(s => 
                s.activityId == activity.id && s.day === day
            );
            
            if (daySchedule.length > 0) {
                daySchedule.forEach(scheduleItem => {
                    const div = document.createElement('div');
                    div.className = 'activity-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `activity_${activity.id}_${day}_${scheduleItem.id}`;
                    checkbox.dataset.scheduleId = scheduleItem.id;
                    
                    // Проверяем выбран ли кружок
                    checkbox.checked = db.childrenActivities.some(
                        ca => ca.childId == child.id && ca.scheduleId == scheduleItem.id
                    );
                    
                    const label = document.createElement('label');
                    label.htmlFor = checkbox.id;
                    label.textContent = scheduleItem.time;
                    
                    div.appendChild(checkbox);
                    div.appendChild(label);
                    dayCell.appendChild(div);
                });
            } else {
                dayCell.textContent = '-';
            }
            
            row.appendChild(dayCell);
        });
        
        scheduleBody.appendChild(row);
    });
}

// 12. Сохранение выбранных кружков (упрощенная версия)
function saveSelectedActivities() {
    if (!db.childrenActivities) db.childrenActivities = [];
    
    // Получаем выбранные чекбоксы
    const checkboxes = document.querySelectorAll('#activitiesSchedule input[type="checkbox"]');
    
    // Удаляем все записи для этого ребенка
    db.childrenActivities = db.childrenActivities.filter(ca => ca.childId != child.id);
    
    // Добавляем новые выбранные
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            db.childrenActivities.push({
                id: generateId(),
                childId: child.id,
                scheduleId: checkbox.dataset.scheduleId,
                enrolledAt: new Date().toISOString()
            });
        }
    });
    
    saveDB(db);
    alert('Изменения сохранены!');
}

// Убираем функцию loadSelectedActivities так как больше не используем отдельный список

// 14. Удаление кружка (обновленная версия)
function removeActivity(scheduleId) {
    db.childrenActivities = db.childrenActivities.filter(
        ca => !(ca.childId == child.id && ca.scheduleId == scheduleId)
    );
    saveDB(db);
    loadActivities();
}

    // 15. Вспомогательная функция для получения названия дня
    function getDayName(day) {
        const days = {
            'monday': 'Понедельник',
            'tuesday': 'Вторник',
            'wednesday': 'Среда',
            'thursday': 'Четверг',
            'friday': 'Пятница'
        };
        return days[day] || day;
    }

    // 16. Инициализация кнопки редактирования
    function initEditButton() {
        const editBtn = document.getElementById('editChildBtn');
        const modal = document.getElementById('editChildModal');
        
        if (!editBtn || !modal) {
            console.error('Не найдены элементы для редактирования');
            return;
        }

        editBtn.addEventListener('click', function() {
            try {
                document.getElementById('editChildId').value = child.id;
                document.getElementById('editChildFullName').value = child.fullName || '';
                document.getElementById('editChildBirthDate').value = child.birthDate || '';
                document.getElementById('editChildAddress').value = child.address || '';
                
                const parent1 = parents[0] || {};
                const parent2 = parents[1] || {};
                
                document.getElementById('editParent1FullName').value = parent1.fullName || '';
                document.getElementById('editParent1BirthDate').value = parent1.birthDate || '';
                document.getElementById('editParent1WorkPlace').value = parent1.workPlace || '';
                document.getElementById('editParent1Phone').value = parent1.phone || '';
                document.getElementById('editParent1Address').value = parent1.address || '';
                
                document.getElementById('editParent2FullName').value = parent2.fullName || '';
                document.getElementById('editParent2BirthDate').value = parent2.birthDate || '';
                document.getElementById('editParent2WorkPlace').value = parent2.workPlace || '';
                document.getElementById('editParent2Phone').value = parent2.phone || '';
                document.getElementById('editParent2Address').value = parent2.address || '';
                
                modal.style.display = 'block';
            } catch (error) {
                console.error('Ошибка при открытии формы редактирования:', error);
            }
        });
    }

    // 17. Обработка формы редактирования
    function initEditForm() {
        const form = document.getElementById('editChildForm');
        const modal = document.getElementById('editChildModal');
        
        if (!form) {
            console.error('Форма редактирования не найдена');
            return;
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            try {
                const childId = document.getElementById('editChildId').value;
                const fullName = document.getElementById('editChildFullName').value;
                const birthDate = document.getElementById('editChildBirthDate').value;
                const address = document.getElementById('editChildAddress').value;
                
                const parent1FullName = document.getElementById('editParent1FullName').value;
                const parent1BirthDate = document.getElementById('editParent1BirthDate').value;
                const parent1WorkPlace = document.getElementById('editParent1WorkPlace').value;
                const parent1Phone = document.getElementById('editParent1Phone').value;
                const parent1Address = document.getElementById('editParent1Address').value;
                
                const parent2FullName = document.getElementById('editParent2FullName').value;
                const parent2BirthDate = document.getElementById('editParent2BirthDate').value;
                const parent2WorkPlace = document.getElementById('editParent2WorkPlace').value;
                const parent2Phone = document.getElementById('editParent2Phone').value;
                const parent2Address = document.getElementById('editParent2Address').value;
                
                const childIndex = db.children.findIndex(c => c.id == childId);
                if (childIndex !== -1) {
                    db.children[childIndex] = {
                        ...db.children[childIndex],
                        fullName: fullName,
                        birthDate: birthDate,
                        address: address
                    };
                    child = db.children[childIndex];
                }
                
                db.parents = db.parents.filter(p => p.childId != childId);
                
                if (parent1FullName) {
                    db.parents.push({
                        id: generateId(),
                        childId: childId,
                        fullName: parent1FullName,
                        birthDate: parent1BirthDate,
                        workPlace: parent1WorkPlace,
                        phone: parent1Phone,
                        address: parent1Address
                    });
                }
                
                if (parent2FullName) {
                    db.parents.push({
                        id: generateId(),
                        childId: childId,
                        fullName: parent2FullName,
                        birthDate: parent2BirthDate,
                        workPlace: parent2WorkPlace,
                        phone: parent2Phone,
                        address: parent2Address
                    });
                }
                
                parents = db.parents.filter(p => p.childId === child.id);
                
                saveDB(db);
                modal.style.display = 'none';
                loadChildInfo();
                
            } catch (error) {
                console.error('Ошибка при сохранении данных:', error);
                alert('Произошла ошибка при сохранении данных');
            }
        });
    }

    // 18. Инициализация модальных окон
    function initModals() {
        document.querySelectorAll('.modal .close').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });
        
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    // 19. Инициализация приложения
    function initApp() {
        initTabs();
        initEditButton();
        initEditForm();
        initModals();
    }

    // Запуск приложения
    initApp();
});