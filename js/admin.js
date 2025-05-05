document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // Инициализация вкладок
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Функция активации вкладки
    function activateTab(tab) {
        const tabId = tab.getAttribute('data-tab');
        
        // Снимаем активные классы
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Устанавливаем активные классы
        tab.classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        // Загружаем данные для вкладки
        switch(tabId) {
            case 'groups':
                loadGroups();
                break;
            case 'food':
                loadFoodPrices();
                break;
            case 'activities':
                loadActivities();
                break;
        }
    }

    // Инициализация обработчиков вкладок
    tabs.forEach(tab => {
        tab.addEventListener('click', () => activateTab(tab));
    });

    // Активация начальной вкладки
    const activeTab = document.querySelector('.tab-btn.active') || document.querySelector('[data-tab="groups"]');
    if (activeTab) {
        activateTab(activeTab);
    } else if (tabs.length > 0) {
        activateTab(tabs[0]);
    }

    // ========== ГРУППЫ ==========
    function loadGroups() {
        const db = getDB();
        const groupsList = document.querySelector('.groups-list');
        
        if (!groupsList) return;
        
        groupsList.innerHTML = '';
        
        db.groups.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.className = 'group-item';
            groupElement.innerHTML = `
                <div class="group-header">
                    <h3>Группа №${group.number}</h3>
                    <div class="group-actions">
                        <button class="btn small edit-group" data-id="${group.id}">Редактировать</button>
                        <button class="btn small secondary delete-group" data-id="${group.id}">Удалить</button>
                    </div>
                </div>
                <div class="group-content">
                    <div class="group-section">
                        <h4>Воспитатели</h4>
                        <div class="persons-list teachers-list" data-group="${group.id}">
                            ${db.teachers.filter(t => t.groupId === group.id).map(teacher => `
                                <div class="person-item">
                                    <span>${teacher.fullName} (Логин: ${teacher.login})</span>
                                    <div class="person-actions">
                                        <button class="btn small edit-person" data-id="${teacher.id}" data-type="teacher">Изменить</button>
                                        <button class="btn small delete-person" data-id="${teacher.id}" data-type="teacher">Удалить</button>
                                    </div>
                                </div>
                            `).join('') || '<p>Нет воспитателей</p>'}
                        </div>
                        <button class="btn small add-person" data-group="${group.id}" data-type="teacher">Добавить воспитателя</button>
                    </div>
                    <div class="group-section">
                        <h4>Дети</h4>
                        <div class="persons-list children-list" data-group="${group.id}">
                            ${db.children.filter(c => c.groupId === group.id).map(child => `
                                <div class="person-item">
                                    <span>${child.fullName} (Логин: ${child.login})</span>
                                    <div class="person-actions">
                                        <button class="btn small view-person" data-id="${child.id}" data-type="child">Просмотр</button>
                                        <button class="btn small edit-person" data-id="${child.id}" data-type="child">Изменить</button>
                                        <button class="btn small delete-person" data-id="${child.id}" data-type="child">Удалить</button>
                                    </div>
                                </div>
                            `).join('') || '<p>Нет детей</p>'}
                        </div>
                        <button class="btn small add-person" data-group="${group.id}" data-type="child">Добавить ребенка</button>
                    </div>
                </div>
            `;
            groupsList.appendChild(groupElement);
            
            // Обработчик клика по заголовку группы
            const header = groupElement.querySelector('.group-header');
            const content = groupElement.querySelector('.group-content');
            
            if (header && content) {
                header.addEventListener('click', function(e) {
                    const clickedButton = e.target.closest('button');
                    if (!clickedButton) {
                        content.classList.toggle('active');
                    }
                });
            }
        });
        
        initGroupButtons();
    }

    function initGroupButtons() {
        // Кнопка добавления группы
        const addGroupBtn = document.getElementById('addGroupBtn');
        if (addGroupBtn) {
            addGroupBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showGroupModal();
            });
        }

        document.querySelectorAll('.edit-group').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editGroup(btn.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.delete-group').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteGroup(btn.getAttribute('data-id'));
            });
        });
        
        document.querySelectorAll('.add-person').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showPersonModal(
                    btn.getAttribute('data-group'),
                    btn.getAttribute('data-type')
                );
            });
        });
        
        document.querySelectorAll('.view-person').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                viewPerson(
                    btn.getAttribute('data-id'),
                    btn.getAttribute('data-type')
                );
            });
        });
        
        document.querySelectorAll('.edit-person').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editPerson(
                    btn.getAttribute('data-id'),
                    btn.getAttribute('data-type')
                );
            });
        });
        
        document.querySelectorAll('.delete-person').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deletePerson(
                    btn.getAttribute('data-id'),
                    btn.getAttribute('data-type')
                );
            });
        });
    }

    function showGroupModal(groupId = null) {
        const modalGroupTitle = document.getElementById('modalGroupTitle');
        const groupIdInput = document.getElementById('groupId');
        const groupNumberInput = document.getElementById('groupNumber');
        const groupModal = document.getElementById('groupModal');
        
        if (groupId) {
            const db = getDB();
            const group = db.groups.find(g => g.id == groupId);
            modalGroupTitle.textContent = 'Редактировать группу';
            groupIdInput.value = group.id;
            groupNumberInput.value = group.number;
        } else {
            modalGroupTitle.textContent = 'Добавить группу';
            groupIdInput.value = '';
            groupNumberInput.value = '';
        }
        groupModal.style.display = 'block';
    }

    const groupForm = document.getElementById('groupForm');
    if (groupForm) {
        groupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const db = getDB();
            const groupId = document.getElementById('groupId').value;
            const groupNumber = document.getElementById('groupNumber').value;
            
            if (!groupNumber) {
                alert('Пожалуйста, введите номер группы');
                return;
            }
            
            if (groupId) {
                // Редактирование существующей группы
                const index = db.groups.findIndex(g => g.id == groupId);
                if (index !== -1) {
                    db.groups[index].number = groupNumber;
                }
            } else {
                // Добавление новой группы
                db.groups.push({
                    id: generateId(),
                    number: groupNumber
                });
            }
            
            saveDB(db);
            document.getElementById('groupModal').style.display = 'none';
            loadGroups();
        });
    }

    function editGroup(groupId) {
        showGroupModal(groupId);
    }

    function deleteGroup(groupId) {
        if (confirm('Вы уверены, что хотите удалить эту группу? Все связанные данные (дети, воспитатели) также будут удалены.')) {
            const db = getDB();
            
            // Удаляем группу
            db.groups = db.groups.filter(g => g.id != groupId);
            
            // Удаляем связанных воспитателей
            db.teachers = db.teachers.filter(t => t.groupId != groupId);
            
            // Удаляем связанных детей и родителей
            const childrenToDelete = db.children.filter(c => c.groupId == groupId);
            db.children = db.children.filter(c => c.groupId != groupId);
            childrenToDelete.forEach(child => {
                db.parents = db.parents.filter(p => p.childId != child.id);
            });
            
            saveDB(db);
            loadGroups();
        }
    }

    // ========== ЛЮДИ (ДЕТИ/ВОСПИТАТЕЛИ) ==========
function showPersonModal(groupId, personType, personId = null) {
    const modal = document.getElementById('personModal');
    const title = document.getElementById('modalPersonTitle');
    const personTypeInput = document.getElementById('personType');
    const groupIdInput = document.getElementById('personGroupId');
    const personIdInput = document.getElementById('personId');
    const parentInfoContainer = document.getElementById('parentInfoContainer');
    
    if (!modal || !title || !personTypeInput || !groupIdInput || !personIdInput) return;
    
    title.textContent = personType === 'child' 
        ? (personId ? 'Редактировать ребенка' : 'Добавить ребенка') 
        : (personId ? 'Редактировать воспитателя' : 'Добавить воспитателя');
    
    personTypeInput.value = personType;
    groupIdInput.value = groupId;
    
    if (parentInfoContainer) {
        parentInfoContainer.style.display = 'none';
    }
    
    // Очищаем форму
    personIdInput.value = personId || '';
    const fullNameInput = document.getElementById('personFullName');
    const loginInput = document.getElementById('personLogin');
    const birthDateInput = document.getElementById('personBirthDate');
    
    if (fullNameInput) fullNameInput.value = '';
    if (loginInput) loginInput.value = '';
    if (birthDateInput) birthDateInput.value = '';
    
    if (personId) {
        const db = getDB();
        
        if (personType === 'child') {
            const child = db.children.find(c => c.id == personId);
            if (child) {
                if (fullNameInput) fullNameInput.value = child.fullName;
                if (loginInput) loginInput.value = child.login;
                if (birthDateInput) birthDateInput.value = child.birthDate;
            }
        } else {
            const teacher = db.teachers.find(t => t.id == personId);
            if (teacher) {
                if (fullNameInput) fullNameInput.value = teacher.fullName;
                if (loginInput) loginInput.value = teacher.login;
            }
        }
    }
    
    modal.style.display = 'block';
}

const personForm = document.getElementById('personForm');
if (personForm) {
    personForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const db = getDB();
        const personId = document.getElementById('personId').value;
        const personType = document.getElementById('personType').value;
        const groupId = document.getElementById('personGroupId').value;
        const fullName = document.getElementById('personFullName').value;
        const login = document.getElementById('personLogin').value;
        const birthDate = document.getElementById('personBirthDate')?.value;
        
        if (!fullName || !login) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        // Получаем номер группы для пароля
        const group = db.groups.find(g => g.id == groupId);
        const password = group ? group.number.toString() : 'default';
        
        if (personType === 'child') {
            if (personId) {
                // Редактирование существующего ребенка (пароль не меняем)
                const index = db.children.findIndex(c => c.id == personId);
                if (index !== -1) {
                    db.children[index].fullName = fullName;
                    db.children[index].login = login;
                    if (birthDate) db.children[index].birthDate = birthDate;
                }
            } else {
                // Добавление нового ребенка
                db.children.push({
                    id: generateId(),
                    groupId: parseInt(groupId),
                    fullName: fullName,
                    login: login,
                    birthDate: birthDate || '',
                    password: password // Сохраняем номер группы как пароль
                });
            }
        } else {
            if (personId) {
                // Редактирование существующего воспитателя (пароль не меняем)
                const index = db.teachers.findIndex(t => t.id == personId);
                if (index !== -1) {
                    db.teachers[index].fullName = fullName;
                    db.teachers[index].login = login;
                }
            } else {
                // Добавление нового воспитателя
                db.teachers.push({
                    id: generateId(),
                    groupId: parseInt(groupId),
                    fullName: fullName,
                    login: login,
                    password: password // Сохраняем номер группы как пароль
                });
            }
        }
        
        saveDB(db);
        document.getElementById('personModal').style.display = 'none';
        loadGroups();
    });
}

    function editPerson(personId, personType) {
        const db = getDB();
        const person = personType === 'child' 
            ? db.children.find(c => c.id == personId)
            : db.teachers.find(t => t.id == personId);
        
        if (person) {
            showPersonModal(person.groupId, personType, personId);
        }
    }

    function viewPerson(personId, personType) {
        if (personType !== 'child') return;
        
        const db = getDB();
        const child = db.children.find(c => c.id == personId);
        if (!child) return;
        
        const group = db.groups.find(g => g.id == child.groupId);
        const parents = db.parents.filter(p => p.childId == personId);
        
        // Показываем модальное окно просмотра ребенка
        const modal = document.getElementById('viewChildModal');
        if (!modal) return;
        
        // Основная информация о ребенке
        const childFullName = document.getElementById('childFullName');
        const childBirthDate = document.getElementById('childBirthDate');
        const childGroup = document.getElementById('childGroup');
        const childLogin = document.getElementById('childLogin');
        
        if (childFullName) childFullName.textContent = child.fullName;
        if (childBirthDate) childBirthDate.textContent = formatDate(child.birthDate);
        if (childGroup) childGroup.textContent = group ? `Группа №${group.number}` : 'Не указана';
        if (childLogin) childLogin.textContent = child.login || 'Не указан';
        
        // Заполняем информацию о родителях
        const parentsInfo = document.getElementById('parentsInfo');
        if (parentsInfo) {
            parentsInfo.innerHTML = '';
            
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
            
            if (parents.length === 0) {
                parentsInfo.innerHTML = '<p>Информация о родителях отсутствует</p>';
            }
        }
        
        // Заполняем посещение
        const currentMonthCalendar = document.querySelector('#viewChildModal .attendance-calendar.current-month');
        const previousMonthCalendar = document.querySelector('#viewChildModal .attendance-calendar.previous-month');
        
        if (currentMonthCalendar) currentMonthCalendar.innerHTML = '';
        if (previousMonthCalendar) previousMonthCalendar.innerHTML = '';
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Добавляем посещение за текущий месяц
        if (currentMonthCalendar) {
            createAttendanceCalendar(currentMonthCalendar, currentYear, currentMonth, child.id, db);
        }
        
        // Добавляем посещение за предыдущий месяц
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
        }
        
        if (previousMonthCalendar) {
            createAttendanceCalendar(previousMonthCalendar, prevYear, prevMonth, child.id, db);
        }
        
        // Заполняем кружки
        const childActivities = document.getElementById('childActivities');
        if (childActivities) {
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
                            <button class="btn small remove-activity" 
                                    data-schedule-id="${activity.schedule.id}">
                                Удалить из кружка
                            </button>
                        `;
                        dayDiv.appendChild(activityDiv);
                    });
                    
                    childActivities.appendChild(dayDiv);
                });
                
                // Инициализируем кнопки удаления из кружков
                document.querySelectorAll('.remove-activity').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const scheduleId = this.getAttribute('data-schedule-id');
                        removeActivityFromChild(child.id, scheduleId);
                    });
                });
            } else {
                childActivities.innerHTML = '<p>Ребенок не записан ни в один кружок</p>';
            }
        }
        
        modal.style.display = 'block';
    }
    
    function removeActivityFromChild(childId, scheduleId) {
        if (confirm('Вы уверены, что хотите удалить ребенка из этого кружка?')) {
            const db = getDB();
            
            // Удаляем запись о посещении кружка
            db.childrenActivities = db.childrenActivities.filter(
                ca => !(ca.childId == childId && ca.scheduleId == scheduleId)
            );
            
            saveDB(db);
            
            // Обновляем информацию о ребенке
            const child = db.children.find(c => c.id == childId);
            if (child) {
                viewPerson(childId, 'child');
            }
        }
    }
    
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

    function createAttendanceCalendar(container, year, month, childId, db) {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        
        // Создаем заголовки для дней недели
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-header';
        ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'].forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.textContent = day;
            dayHeader.className = 'day-header';
            headerRow.appendChild(dayHeader);
        });
        container.appendChild(headerRow);
        
        // Создаем календарь
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        
        // Добавляем пустые ячейки для первого дня недели
        let dayOfWeek = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < dayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'empty-cell';
            calendarGrid.appendChild(emptyCell);
        }
        
        // Добавляем дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            dayOfWeek = date.getDay();
            
            // Пропускаем выходные
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const attendanceRecord = db.attendance.find(a => a.childId == childId && a.date === dayStr);
            
            const dayCell = document.createElement('div');
            dayCell.className = `day-cell ${attendanceRecord ? (attendanceRecord.present ? 'present' : 'absent') : ''}`;
            dayCell.innerHTML = `<div class="day-number">${day}</div>`;
            dayCell.title = dayStr;
            
            // Добавляем возможность изменения посещения
            dayCell.addEventListener('click', () => {
                toggleAttendance(childId, dayStr, dayCell);
            });
            
            calendarGrid.appendChild(dayCell);
        }
        
        container.appendChild(calendarGrid);
    }

    function toggleAttendance(childId, date, element) {
        const db = getDB();
        const attendanceIndex = db.attendance.findIndex(a => a.childId == childId && a.date === date);
        
        if (attendanceIndex >= 0) {
            // Изменяем существующую запись
            db.attendance[attendanceIndex].present = !db.attendance[attendanceIndex].present;
        } else {
            // Добавляем новую запись
            db.attendance.push({
                id: generateId(),
                childId: parseInt(childId),
                date: date,
                present: true
            });
        }
        
        saveDB(db);
        
        // Обновляем отображение
        const newStatus = attendanceIndex >= 0 ? db.attendance[attendanceIndex].present : true;
        element.className = `day-cell ${newStatus ? 'present' : 'absent'}`;
    }

    function deletePerson(personId, personType) {
        if (confirm(`Вы уверены, что хотите удалить этого ${personType === 'child' ? 'ребенка' : 'воспитателя'}?`)) {
            const db = getDB();
            
            if (personType === 'child') {
                // Удаляем ребенка и его родителей
                db.children = db.children.filter(c => c.id != personId);
                db.parents = db.parents.filter(p => p.childId != personId);
                
                // Удаляем ребенка из кружков
                db.activities.forEach(activity => {
                    if (activity.children && activity.children.includes(parseInt(personId))) {
                        activity.children = activity.children.filter(id => id != personId);
                    }
                });
                
                // Удаляем посещения
                db.attendance = db.attendance.filter(a => a.childId != personId);
            } else {
                // Удаляем воспитателя
                db.teachers = db.teachers.filter(t => t.id != personId);
            }
            
            saveDB(db);
            loadGroups();
        }
    }

    // ========== ПИТАНИЕ ==========
    function loadFoodPrices() {
        const db = getDB();
        const currentDate = new Date();
        let currentMonth = currentDate.getMonth();
        let currentYear = currentDate.getFullYear();
        
        // Получаем предыдущий месяц
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
        }
        
        // Устанавливаем заголовки месяцев
        document.getElementById('currentMonthTitle').textContent = 
            `Текущий месяц: ${getMonthName(currentMonth)} ${currentYear}`;
        document.getElementById('previousMonthTitle').textContent = 
            `Предыдущий месяц: ${getMonthName(prevMonth)} ${prevYear}`;
        
        // Создаем календари для обоих месяцев
        createFoodCalendar(
            document.querySelector('.food-calendar.current-month'),
            currentYear, 
            currentMonth, 
            db
        );
        
        createFoodCalendar(
            document.querySelector('.food-calendar.previous-month'),
            prevYear, 
            prevMonth, 
            db
        );
    }

    function createFoodCalendar(container, year, month, db) {
        container.innerHTML = '';
        
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        
        // Создаем заголовки дней недели
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-header';
        ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'].forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.textContent = day;
            dayHeader.className = 'day-header';
            headerRow.appendChild(dayHeader);
        });
        container.appendChild(headerRow);
        
        // Создаем календарь
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        
        // Добавляем пустые ячейки для первого дня недели
        let dayOfWeek = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < dayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'empty-cell';
            calendarGrid.appendChild(emptyCell);
        }
        
        // Добавляем дни месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            dayOfWeek = date.getDay();
            
            // Пропускаем выходные
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;
            
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const foodPrice = db.foodPrices.find(f => f.date === dayStr) || { date: dayStr, price: '' };
            
            const dayCell = document.createElement('div');
            dayCell.className = 'food-day-cell';
            dayCell.innerHTML = `
                <div class="food-day-number">${day}</div>
                <input type="number" class="food-price-input" 
                       value="${foodPrice.price}" 
                       data-date="${dayStr}" 
                       placeholder="Цена"
                       min="0">
            `;
            
            // Обработчик изменения цены
            const input = dayCell.querySelector('.food-price-input');
            input.addEventListener('change', function() {
                const date = this.getAttribute('data-date');
                const price = this.value ? parseInt(this.value) : null;
                
                const db = getDB();
                let foodEntry = db.foodPrices.find(f => f.date === date);
                
                if (price !== null) {
                    if (foodEntry) {
                        foodEntry.price = price;
                    } else {
                        db.foodPrices.push({
                            id: generateId(),
                            date: date,
                            price: price
                        });
                    }
                } else if (foodEntry) {
                    // Удаляем запись если цена не указана
                    db.foodPrices = db.foodPrices.filter(f => f.date !== date);
                }
                
                saveDB(db);
            });
            
            calendarGrid.appendChild(dayCell);
        }
        
        container.appendChild(calendarGrid);
    }

// ========== КРУЖКИ ==========
function loadActivities() {
    const db = getDB();
    
    // Функция обновления таблицы кружков
    function updateActivitiesTable() {
        const activitiesTableBody = document.getElementById('activitiesTableBody');
        activitiesTableBody.innerHTML = '';
        
        if (!db.activities || db.activities.length === 0) {
            activitiesTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="no-data">Нет созданных кружков</td>
                </tr>
            `;
            return;
        }
        
        db.activities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${activity.name}</td>
                <td>${activity.price} ₽</td>
                <td>
                    <button class="btn small edit-activity" data-id="${activity.id}">Изменить</button>
                    <button class="btn small secondary delete-activity" data-id="${activity.id}">Удалить</button>
                </td>
            `;
            activitiesTableBody.appendChild(row);
        });
        
        // Переинициализируем кнопки после обновления таблицы
        initActivityButtons();
    }
    
    // Функция обновления расписания
    function updateScheduleTable() {
        const scheduleTableBody = document.getElementById('scheduleTableBody');
        scheduleTableBody.innerHTML = '';
        
        const timeSlots = ['10:00', '11:00', '15:00', '16:00', '17:00'];
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        
        timeSlots.forEach(time => {
            const row = document.createElement('tr');
            const timeCell = document.createElement('td');
            timeCell.textContent = time;
            row.appendChild(timeCell);
            
            days.forEach(day => {
                const cell = document.createElement('td');
                cell.className = 'schedule-cell';
                
                const scheduleItem = db.schedule.find(s => s.day === day && s.time === time);
                const activity = scheduleItem ? db.activities.find(a => a.id == scheduleItem.activityId) : null;
                
                if (activity) {
                    cell.innerHTML = `
                        <div class="activity-info">
                            <strong>${activity.name}</strong>
                        </div>
                        <div class="activity-actions">
                            <button class="btn small secondary delete-schedule" data-id="${scheduleItem.id}">Удалить</button>
                        </div>
                    `;
                } else {
                    cell.innerHTML = `<button class="add-activity-btn" data-day="${day}" data-time="${time}">Добавить кружок</button>`;
                }
                
                row.appendChild(cell);
            });
            
            scheduleTableBody.appendChild(row);
        });
        
        // Переинициализируем кнопки после обновления расписания
        initScheduleButtons();
    }
    
    // Обработчик формы создания/редактирования кружка
    document.getElementById('activityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const activityId = document.getElementById('activityId').value;
        const name = document.getElementById('activityName').value.trim();
        const price = document.getElementById('activityPrice').value.trim();
        
        if (!name) {
            alert('Пожалуйста, введите название кружка');
            return;
        }
        
        if (!price || isNaN(price) || parseInt(price) <= 0) {
            alert('Пожалуйста, введите корректную цену');
            return;
        }
        
        if (activityId) {
            // Редактирование существующего кружка
            const index = db.activities.findIndex(a => a.id === activityId);
            if (index !== -1) {
                db.activities[index] = {
                    ...db.activities[index],
                    name: name,
                    price: parseInt(price)
                };
            }
        } else {
            // Добавление нового кружка
            db.activities.push({
                id: generateId(),
                name: name,
                price: parseInt(price),
                children: []
            });
        }
        
        saveDB(db);
        document.getElementById('activityModal').style.display = 'none';
        
        // Обновляем обе таблицы после изменения
        updateActivitiesTable();
        updateScheduleTable();
    });
    
    // Обработчик формы расписания
    document.getElementById('scheduleForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const scheduleId = document.getElementById('scheduleItemId').value;
        const day = document.getElementById('scheduleDayHidden').value;
        const time = document.getElementById('scheduleTimeHidden').value;
        const activityId = document.getElementById('scheduleActivity').value;
        
        if (scheduleId) {
            // Редактирование существующей записи
            const index = db.schedule.findIndex(s => s.id == scheduleId);
            if (index !== -1) {
                db.schedule[index] = {
                    id: scheduleId,
                    day: day,
                    time: time,
                    activityId: activityId
                };
            }
        } else {
            // Добавление новой записи
            db.schedule.push({
                id: generateId(),
                day: day,
                time: time,
                activityId: activityId
            });
        }
        
        saveDB(db);
        document.getElementById('scheduleModal').style.display = 'none';
        
        // Обновляем расписание после изменения
        updateScheduleTable();
    });
    
    // Инициализация кнопок
    function initActivityButtons() {
        const addActivityBtn = document.getElementById('addActivityBtn');
        if (!addActivityBtn) {
            console.error('Кнопка "Создать кружок" не найдена');
            return;
        }
        
        addActivityBtn.addEventListener('click', () => {
            console.log('Кнопка "Создать кружок" нажата'); // Для отладки
            document.getElementById('activityForm').reset();
            document.getElementById('activityId').value = '';
            document.getElementById('modalActivityTitle').textContent = 'Создать кружок';
            document.getElementById('activityModal').style.display = 'block';
        });
        
        // Остальной код инициализации кнопок редактирования
    }
    
    function initScheduleButtons() {
        // Кнопки добавления в расписание
        document.querySelectorAll('.add-activity-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const day = this.getAttribute('data-day');
                const time = this.getAttribute('data-time');
                
                document.getElementById('scheduleDay').textContent = 
                    ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'][
                        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(day)
                    ];
                document.getElementById('scheduleTime').textContent = time;
                document.getElementById('scheduleDayHidden').value = day;
                document.getElementById('scheduleTimeHidden').value = time;
                document.getElementById('scheduleItemId').value = '';
                
                // Заполняем список кружков
                const select = document.getElementById('scheduleActivity');
                select.innerHTML = db.activities.map(a => 
                    `<option value="${a.id}">${a.name} (${a.price} ₽)</option>`
                ).join('') || '<option value="" disabled>Нет доступных кружков</option>';
                
                document.getElementById('scheduleModal').style.display = 'block';
            });
        });
    }
    
    // Первоначальная загрузка данных
    updateActivitiesTable();
    updateScheduleTable();
}

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    function formatTime(timeString) {
        if (!timeString) return '';
        return timeString.substring(0, 5);
    }

    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getDayOfWeek(dayIndex) {
        const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
        return days[dayIndex];
    }

    function getShortDayOfWeek(dayIndex) {
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[dayIndex];
    }

    function getMonthName(monthIndex) {
        const months = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        return months[monthIndex];
    }

    // ========== ОБРАБОТЧИКИ ЗАКРЫТИЯ МОДАЛЬНЫХ ОКОН ==========
    // Закрытие при клике на крестик
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Закрытие при нажатии ESC
    window.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });

    // ========== ВЫХОД ИЗ СИСТЕМЫ ==========
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
            window.location.href = 'index.html';
        });
    }
});