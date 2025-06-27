document.addEventListener('DOMContentLoaded', function() {
  // عناصر DOM
  const panelToggle = document.getElementById('panelToggle');
  const controlPanel = document.querySelector('.control-panel');
  const quickAddBtn = document.getElementById('quickAddBtn');
  const addProjectBtn = document.getElementById('addProjectBtn');
  const taskModal = document.getElementById('taskModal');
  const projectModal = document.getElementById('projectModal');
  const closeModalButtons = document.querySelectorAll('.close-modal');
  const cancelButtons = document.querySelectorAll('.cancel-btn');
  const taskForm = document.getElementById('taskForm');
  const projectForm = document.getElementById('projectForm');
  const tasksList = document.getElementById('tasksList');
  const projectsList = document.getElementById('projectsList');
  const taskProjectSelect = document.getElementById('taskProject');
  const viewOptionButtons = document.querySelectorAll('.view-option');
  const searchInput = document.getElementById('searchInput');
  const welcomeTasksCount = document.getElementById('welcomeTasksCount');
  const completedCount = document.getElementById('completedCount');
  const pendingCount = document.getElementById('pendingCount');
  const overdueCount = document.getElementById('overdueCount');
  const tasksSectionTitle = document.getElementById('tasksSectionTitle');
  const modalTitle = document.getElementById('modalTitle');
  const submitTaskBtnText = document.getElementById('submitTaskBtnText');

  // بيانات التطبيق
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let projects = JSON.parse(localStorage.getItem('projects')) || [
    { id: 'general', name: 'عام', color: 'mint' }
  ];
  let currentView = 'list';
  let currentProjectFilter = null;
  let currentTaskId = null;
  let datepicker = null;

  // تهيئة التطبيق
  function initApp() {
    setupDatepicker();
    renderProjects();
    renderTasks();
    updateStats();
    setupEventListeners();
  }

  // إعداد مستمعي الأحداث
  function setupEventListeners() {
    // تبديل لوحة التحكم
    panelToggle.addEventListener('click', toggleControlPanel);
    
    // فتح النماذج المنبثقة
    quickAddBtn.addEventListener('click', () => openTaskModal());
    addProjectBtn.addEventListener('click', () => openModal(projectModal));
    
    // إغلاق النماذج المنبثقة
    closeModalButtons.forEach(btn => btn.addEventListener('click', closeAllModals));
    cancelButtons.forEach(btn => btn.addEventListener('click', closeAllModals));
    
    // تقديم النماذج
    taskForm.addEventListener('submit', handleTaskSubmit);
    projectForm.addEventListener('submit', handleProjectSubmit);
    
    // تغيير طريقة العرض
    viewOptionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        viewOptionButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        renderTasks();
      });
    });
    
    // التنقل بين القوائم
    document.querySelectorAll('.main-nav li').forEach(item => {
      item.addEventListener('click', function() {
        document.querySelectorAll('.main-nav li').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        const viewType = this.dataset.view;
        filterTasksByView(viewType);
      });
    });

    // البحث عن المهام
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      if (searchTerm.length > 0) {
        const filteredTasks = tasks.filter(task => 
          task.title.toLowerCase().includes(searchTerm) || 
          (task.description && task.description.toLowerCase().includes(searchTerm))
        );
        renderTaskList(filteredTasks);
      } else {
        renderTasks();
      }
    });
  }

  // إعداد Flatpickr
  function setupDatepicker() {
    datepicker = flatpickr('.datepicker', {
      locale: 'ar',
      dateFormat: 'Y-m-d',
      minDate: 'today',
      allowInput: true
    });
  }

  // تبديل لوحة التحكم
  function toggleControlPanel() {
    controlPanel.classList.toggle('collapsed');
  }

  // فتح النموذج المنبثق
  function openModal(modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // فتح نموذج المهمة
  function openTaskModal(taskId = null) {
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskProject').value = task.project;
        document.querySelector(`input[name="priority"][value="${task.priority}"]`).checked = true;
        if (task.dueDate) {
          document.getElementById('taskDueDate').value = task.dueDate;
          datepicker.setDate(task.dueDate);
        }
        modalTitle.textContent = 'تحرير المهمة';
        submitTaskBtnText.textContent = 'تحديث المهمة';
        currentTaskId = taskId;
      }
    } else {
      taskForm.reset();
      modalTitle.textContent = 'مهمة جديدة';
      submitTaskBtnText.textContent = 'حفظ المهمة';
      currentTaskId = null;
    }
    openModal(taskModal);
  }

  // إغلاق جميع النماذج المنبثقة
  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
  }

  // معالجة إضافة مهمة جديدة
  function handleTaskSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const project = document.getElementById('taskProject').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const dueDate = document.getElementById('taskDueDate').value;
    
    if (!title) {
      document.getElementById('titleError').textContent = 'يجب إدخال عنوان للمهمة';
      return;
    }
    
    if (currentTaskId) {
      // تحديث المهمة الموجودة
      tasks = tasks.map(t => {
        if (t.id === currentTaskId) {
          return { ...t, title, description, project, priority, dueDate };
        }
        return t;
      });
    } else {
      // إضافة مهمة جديدة
      const newTask = {
        id: Date.now().toString(),
        title,
        description,
        project,
        priority,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString()
      };
      tasks.push(newTask);
    }
    
    saveTasks();
    renderTasks();
    updateStats();
    taskForm.reset();
    closeAllModals();
  }

  // معالجة إضافة مشروع جديد
  function handleProjectSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('projectName').value;
    const color = document.querySelector('input[name="projectColor"]:checked').value;
    
    if (!name) {
      document.getElementById('projectNameError').textContent = 'يجب إدخال اسم للمساحة';
      return;
    }
    
    const newProject = {
      id: name.toLowerCase().replace(/\s/g, '-'),
      name,
      color
    };
    
    projects.push(newProject);
    saveProjects();
    renderProjects();
    projectForm.reset();
    closeAllModals();
  }

  // حفظ المهام في localStorage
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // حفظ المشاريع في localStorage
  function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(projects));
    updateProjectSelect();
  }

  // تحديث قائمة المشاريع في نموذج المهمة
  function updateProjectSelect() {
    taskProjectSelect.innerHTML = '';
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      taskProjectSelect.appendChild(option);
    });
  }

  // عرض المشاريع في لوحة التحكم
  function renderProjects() {
    projectsList.innerHTML = '';
    
    projects.forEach(project => {
      const projectItem = document.createElement('div');
      projectItem.className = `project-item ${currentProjectFilter === project.id ? 'active' : ''}`;
      projectItem.innerHTML = `
        <div class="project-color ${project.color}"></div>
        <span>${project.name}</span>
      `;
      
      projectItem.addEventListener('click', () => {
        currentProjectFilter = project.id;
        renderTasks();
        document.querySelectorAll('.project-item').forEach(item => {
          item.classList.remove('active');
        });
        projectItem.classList.add('active');
      });
      
      projectsList.appendChild(projectItem);
    });
    
    updateProjectSelect();
  }

  // تصفية المهام حسب نوع العرض
  function filterTasksByView(viewType) {
    const today = new Date().toISOString().split('T')[0];
    
    switch(viewType) {
      case 'today':
        tasksSectionTitle.textContent = 'مهام اليوم';
        renderTasks(null, task => !task.completed && (!task.dueDate || task.dueDate === today));
        break;
      case 'upcoming':
        tasksSectionTitle.textContent = 'المهام القادمة';
        renderTasks(null, task => !task.completed && task.dueDate && task.dueDate > today);
        break;
      case 'focus':
        tasksSectionTitle.textContent = 'المهام المهمة';
        renderTasks(null, task => !task.completed && task.priority === 'high');
        break;
      default:
        tasksSectionTitle.textContent = 'جميع المهام';
        renderTasks();
    }
  }

  // عرض المهام
  function renderTasks(projectId = null, customFilter = null) {
    let filteredTasks = [...tasks];
    
    // التصفية حسب المشروع
    if (projectId) {
      filteredTasks = filteredTasks.filter(task => task.project === projectId);
    }
    
    // التصفية حسب العرض (اليومي، القادم، إلخ)
    if (customFilter) {
      filteredTasks = filteredTasks.filter(customFilter);
    }
    
    // التصفية حسب طريقة العرض (قائمة، شبكة، تقويم)
    if (currentView === 'list') {
      renderTaskList(filteredTasks);
    } else if (currentView === 'grid') {
      renderTaskGrid(filteredTasks);
    } else {
      renderTaskCalendar(filteredTasks);
    }
    
    // تحديث عدد المهام في بطاقة الترحيب
    updateWelcomeTasksCount(filteredTasks.filter(task => !task.completed).length);
  }

  // عرض المهام كقائمة
  function renderTaskList(filteredTasks) {
    tasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
      tasksList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-tasks"></i>
          <p>لا توجد مهام لعرضها</p>
        </div>
      `;
      return;
    }
    
    filteredTasks.forEach(task => {
      const project = projects.find(p => p.id === task.project) || projects[0];
      const dueDateText = task.dueDate ? formatDate(task.dueDate) : 'بدون تاريخ';
      const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
      
      const taskItem = document.createElement('div');
      taskItem.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
      taskItem.innerHTML = `
        <div class="task-checkbox">
          <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
        </div>
        <div class="task-content">
          <div class="task-title ${task.completed ? 'completed' : ''}">
            ${task.title}
            <span class="task-project" style="background-color: var(--${project.color});">
              ${project.name}
            </span>
          </div>
          ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
          <div class="task-meta">
            <div class="task-due-date ${isOverdue ? 'overdue' : ''}">
              <i class="fas fa-calendar-day"></i>
              <span>${dueDateText}</span>
            </div>
            <div class="task-priority ${task.priority}">
              ${getPriorityText(task.priority)}
            </div>
          </div>
        </div>
        <div class="task-actions">
          <button class="edit-task" data-id="${task.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-task" data-id="${task.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      // إضافة مستمعي الأحداث للعناصر الديناميكية
      const checkbox = taskItem.querySelector('.task-checkbox input');
      checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
      
      const editBtn = taskItem.querySelector('.edit-task');
      editBtn.addEventListener('click', () => openTaskModal(task.id));
      
      const deleteBtn = taskItem.querySelector('.delete-task');
      deleteBtn.addEventListener('click', () => deleteTask(task.id));
      
      tasksList.appendChild(taskItem);
    });
  }

  // عرض المهام كشبكة (سيتم تطويرها لاحقًا)
  function renderTaskGrid(tasks) {
    tasksList.innerHTML = '<p style="padding: 20px; text-align: center;">عرض الشبكة قيد التطوير</p>';
  }

  // عرض المهام كتقويم (سيتم تطويرها لاحقًا)
  function renderTaskCalendar(tasks) {
    tasksList.innerHTML = '<p style="padding: 20px; text-align: center;">عرض التقويم قيد التطوير</p>';
  }

  // تبديل حالة إكمال المهمة
  function toggleTaskComplete(taskId) {
    tasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    saveTasks();
    renderTasks();
    updateStats();
  }

  // حذف المهمة
  function deleteTask(taskId) {
    if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      tasks = tasks.filter(task => task.id !== taskId);
      saveTasks();
      renderTasks();
      updateStats();
    }
  }

  // تحديث الإحصائيات
  function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = tasks.filter(task => !task.completed).length;
    const overdueTasks = tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate) < new Date()
    ).length;
    
    completedCount.textContent = completedTasks;
    pendingCount.textContent = pendingTasks;
    overdueCount.textContent = overdueTasks;
  }

  // تحديث عدد المهام في بطاقة الترحيب
  function updateWelcomeTasksCount(count) {
    welcomeTasksCount.innerHTML = `لديك <strong>${count} مهام</strong> تحتاج لاهتمامك اليوم`;
  }

  // تنسيق التاريخ
  function formatDate(dateString) {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  }

  // الحصول على نص الأولوية
  function getPriorityText(priority) {
    const texts = {
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة'
    };
    return texts[priority] || '';
  }

  // بدء التطبيق
  initApp();
});