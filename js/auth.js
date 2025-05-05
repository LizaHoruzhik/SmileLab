document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('loginError');
            
            const db = getDB();
            const user = db.users.find(u => u.username === username && u.password === password);
            const teacher = db.teachers.find(u => u.login === username && u.password === password);
            const child = db.children.find(u => u.login === username && u.password === password);

            if (user && user.role === 'admin'){
                setCurrentUser(user);
                window.location.href = 'admin.html';
            }else if (teacher){
                setCurrentUser(teacher);
                window.location.href = 'teacher.html';
            }else if (child){
                setCurrentUser(child);
                window.location.href = 'parent.html';
            }else{
                errorElement.textContent = 'Неверный логин или пароль';
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }
    
    // Проверка авторизации для защищенных страниц
    const protectedPages = ['admin.html', 'teacher.html', 'parent.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            window.location.href = 'index.html';
        }
    }
});