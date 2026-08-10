// Smart Study Planner - JavaScript Functionality
class StudyPlanner {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("studyPlanner_tasks")) || [];
    this.goals = JSON.parse(localStorage.getItem("studyPlanner_goals")) || [];
    this.settings = JSON.parse(
      localStorage.getItem("studyPlanner_settings")
    ) || {
      theme: "light",
      notifications: true,
      focusTime: 25,
      breakTime: 5,
      longBreakTime: 15,
    };
    this.studyStats = JSON.parse(
      localStorage.getItem("studyPlanner_stats")
    ) || {
      totalTasks: 0,
      completedTasks: 0,
      studyHours: 0,
      streak: 0,
      completedPomodoros: 0,
      totalFocusTime: 0,
      lastStudyDate: null,
    };
    this.notifications = [];
    this.timer = {
      isRunning: false,
      isPaused: false,
      currentTime: 25 * 60, // 25 minutes in seconds
      totalTime: 25 * 60,
      type: "focus", // 'focus', 'break', 'longBreak'
      interval: null,
      pomodoroCount: 0,
    };
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadTheme();
    this.updateDashboard();
    this.renderTasks();
    this.renderCalendar();
    this.updateTimer();
    this.showMotivationalQuote();
    this.checkStreak();
    this.startNotificationSystem();

    // Initialize section navigation
    this.showSection("dashboard");
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        this.showSection(section);
        this.updateActiveNavLink(link);
      });
    });

    // Theme toggle
    document.getElementById("themeToggle").addEventListener("click", () => {
      this.toggleTheme();
    });

    // Notifications
    document
      .getElementById("notificationsBtn")
      .addEventListener("click", () => {
        this.toggleNotificationPanel();
      });

    // Task management
    document.getElementById("addTaskBtn").addEventListener("click", () => {
      this.showAddTaskModal();
    });

    document.getElementById("addTaskForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.addTask();
    });

    // Task filters
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.filterTasks(btn.dataset.filter);
      });
    });

    // Task search
    document.getElementById("taskSearch").addEventListener("input", (e) => {
      this.searchTasks(e.target.value);
    });

    // Calendar navigation
    document.getElementById("prevMonth").addEventListener("click", () => {
      this.previousMonth();
    });

    document.getElementById("nextMonth").addEventListener("click", () => {
      this.nextMonth();
    });

    // Timer controls
    document.getElementById("startTimer").addEventListener("click", () => {
      this.startTimer();
    });

    document.getElementById("pauseTimer").addEventListener("click", () => {
      this.pauseTimer();
    });

    document.getElementById("resetTimer").addEventListener("click", () => {
      this.resetTimer();
    });

    // Timer settings
    ["focusTime", "breakTime", "longBreakTime"].forEach((id) => {
      document.getElementById(id).addEventListener("change", (e) => {
        this.updateTimerSettings(id, parseInt(e.target.value));
      });
    });

    // Goals section removed - no longer needed

    // Modal close buttons
    document.querySelectorAll(".close-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal");
        if (modal) {
          this.closeModal(modal.id);
        }
      });
    });

    // Overlay clicks
    document.getElementById("overlay").addEventListener("click", () => {
      this.closeAllModals();
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
      }
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        this.showAddTaskModal();
      }
      if (
        e.key === " " &&
        e.target.tagName !== "INPUT" &&
        e.target.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        if (this.timer.isRunning) {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
      }
    });
  }

  // Theme Management
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    this.settings.theme = theme;
    this.saveSettings();

    const themeIcon = document.querySelector("#themeToggle i");
    themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";

    // Add animation
    themeIcon.style.transform = "rotate(180deg)";
    setTimeout(() => {
      themeIcon.style.transform = "rotate(0deg)";
    }, 300);
  }

  loadTheme() {
    this.setTheme(this.settings.theme);
  }

  // Navigation
  showSection(sectionId) {
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active");
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add("active");
      targetSection.style.animation = "slideIn 0.5s ease-out";
    }

    // Update specific sections
    if (sectionId === "dashboard") {
      this.updateDashboard();
    } else if (sectionId === "progress") {
      this.updateProgressCharts();
    }
  }

  updateActiveNavLink(activeLink) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
    });
    activeLink.classList.add("active");
  }

  // Task Management
  addTask() {
    const title = document.getElementById("taskTitle").value.trim();
    if (!title) return;

    const task = {
      id: Date.now(),
      title: title,
      description: document.getElementById("taskDescription").value.trim(),
      subject: document.getElementById("taskSubject").value,
      priority: document.getElementById("taskPriority").value,
      dueDate: document.getElementById("taskDueDate").value,
      estimatedTime: parseFloat(
        document.getElementById("taskEstimatedTime").value
      ),
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      actualTime: 0,
    };

    this.tasks.push(task);
    this.saveTasks();
    this.renderTasks();
    this.updateDashboard();
    this.closeModal("addTaskModal");
    this.showNotification("Task added successfully!", "success");

    // Clear form
    document.getElementById("addTaskForm").reset();

    // Check for first task achievement
    this.checkAchievements();
  }

  editTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Populate form with task data
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDescription").value = task.description;
    document.getElementById("taskSubject").value = task.subject;
    document.getElementById("taskPriority").value = task.priority;
    document.getElementById("taskDueDate").value = task.dueDate;
    document.getElementById("taskEstimatedTime").value = task.estimatedTime;

    // Change form behavior for editing
    const form = document.getElementById("addTaskForm");
    form.onsubmit = (e) => {
      e.preventDefault();
      this.updateTask(taskId);
    };

    document.querySelector("#addTaskModal h3").textContent = "Edit Task";
    this.showModal("addTaskModal");
  }

  updateTask(taskId) {
    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const task = this.tasks[taskIndex];
    task.title = document.getElementById("taskTitle").value.trim();
    task.description = document.getElementById("taskDescription").value.trim();
    task.subject = document.getElementById("taskSubject").value;
    task.priority = document.getElementById("taskPriority").value;
    task.dueDate = document.getElementById("taskDueDate").value;
    task.estimatedTime = parseFloat(
      document.getElementById("taskEstimatedTime").value
    );

    this.saveTasks();
    this.renderTasks();
    this.updateDashboard();
    this.closeModal("addTaskModal");
    this.showNotification("Task updated successfully!", "success");

    // Reset form behavior
    const form = document.getElementById("addTaskForm");
    form.onsubmit = (e) => {
      e.preventDefault();
      this.addTask();
    };
    document.querySelector("#addTaskModal h3").textContent = "Add New Task";
  }

  deleteTask(taskId) {
    if (confirm("Are you sure you want to delete this task?")) {
      this.tasks = this.tasks.filter((t) => t.id !== taskId);
      this.saveTasks();
      this.renderTasks();
      this.updateDashboard();
      this.showNotification("Task deleted successfully!", "info");
    }
  }

  toggleTask(taskId) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    if (task.completed) {
      this.studyStats.completedTasks++;
      this.showNotification("Great job! Task completed!", "success");
      this.createCelebration();
    } else {
      this.studyStats.completedTasks = Math.max(
        0,
        this.studyStats.completedTasks - 1
      );
    }

    this.saveTasks();
    this.saveStats();
    this.renderTasks();
    this.updateDashboard();
    this.checkAchievements();
  }

  filterTasks(filter) {
    const tasks = document.querySelectorAll(".task-item");
    tasks.forEach((task) => {
      const taskData = this.tasks.find(
        (t) => t.id === parseInt(task.dataset.taskId)
      );
      let show = true;

      switch (filter) {
        case "pending":
          show = !taskData.completed;
          break;
        case "completed":
          show = taskData.completed;
          break;
        case "high":
          show = taskData.priority === "high";
          break;
        case "all":
        default:
          show = true;
          break;
      }

      task.style.display = show ? "block" : "none";
    });
  }

  searchTasks(query) {
    const tasks = document.querySelectorAll(".task-item");
    const lowercaseQuery = query.toLowerCase();

    tasks.forEach((task) => {
      const taskData = this.tasks.find(
        (t) => t.id === parseInt(task.dataset.taskId)
      );
      const matchesTitle = taskData.title
        .toLowerCase()
        .includes(lowercaseQuery);
      const matchesDescription = taskData.description
        .toLowerCase()
        .includes(lowercaseQuery);
      const matchesSubject = taskData.subject
        .toLowerCase()
        .includes(lowercaseQuery);

      const show = matchesTitle || matchesDescription || matchesSubject;
      task.style.display = show ? "block" : "none";
    });
  }

  renderTasks() {
    const tasksList = document.getElementById("tasksList");

    if (this.tasks.length === 0) {
      tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No tasks yet</h3>
                    <p>Create your first study task to get started!</p>
                    <button class="btn btn-primary" onclick="studyPlanner.showAddTaskModal()">
                        <i class="fas fa-plus"></i> Add Your First Task
                    </button>
                </div>
            `;
      return;
    }

    const sortedTasks = [...this.tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    tasksList.innerHTML = sortedTasks
      .map((task) => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && !task.completed;
        const dueDateText = dueDate ? this.formatDate(dueDate) : "No due date";

        return `
                <div class="task-item ${task.completed ? "completed" : ""} ${
          isOverdue ? "overdue" : ""
        }" 
                     data-task-id="${task.id}">
                    <div class="task-header">
                        <div class="task-checkbox ${
                          task.completed ? "checked" : ""
                        }" 
                             onclick="studyPlanner.toggleTask(${
                               task.id
                             })"></div>
                        <div class="task-content">
                            <h4 class="task-title">${task.title}</h4>
                            ${
                              task.description
                                ? `<p class="task-description">${task.description}</p>`
                                : ""
                            }
                            <div class="task-meta-row">
                                <div class="task-tags">
                                    <span class="task-tag subject">${this.capitalizeFirst(
                                      task.subject
                                    )}</span>
                                    <span class="task-tag priority ${
                                      task.priority
                                    }">${this.capitalizeFirst(
          task.priority
        )}</span>
                                    <span class="task-tag time">
                                        <i class="fas fa-clock"></i> ${
                                          task.estimatedTime
                                        }h
                                    </span>
                                    ${
                                      dueDate
                                        ? `<span class="task-tag due ${
                                            isOverdue ? "overdue" : ""
                                          }">
                                        <i class="fas fa-calendar"></i> ${dueDateText}
                                    </span>`
                                        : ""
                                    }
                                </div>
                                <div class="task-actions">
                                    <button class="task-action edit" onclick="studyPlanner.editTask(${
                                      task.id
                                    })" 
                                            title="Edit task">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="task-action delete" onclick="studyPlanner.deleteTask(${
                                      task.id
                                    })" 
                                            title="Delete task">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  // Calendar Management
  renderCalendar() {
    const calendarBody = document.getElementById("calendarBody");
    const currentMonthEl = document.getElementById("currentMonth");

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    currentMonthEl.textContent = `${monthNames[this.currentMonth]} ${
      this.currentYear
    }`;

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendarDays = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === this.currentMonth;
      const isToday = date.toDateString() === today.toDateString();

      // Create timezone-safe date string
      const dateString = this.getLocalDateString(date);
      const hasTasks = this.getTasksForDateString(dateString).length > 0;

      calendarDays.push(`
                <div class="calendar-day ${
                  !isCurrentMonth ? "other-month" : ""
                } 
                                        ${isToday ? "today" : ""} 
                                        ${hasTasks ? "has-tasks" : ""}"
                     data-date="${dateString}"
                     onclick="studyPlanner.showDateTasks('${dateString}')">
                    ${date.getDate()}
                </div>
            `);
    }

    calendarBody.innerHTML = calendarDays.join("");
  }

  previousMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.renderCalendar();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.renderCalendar();
  }

  getTasksForDate(date) {
    const dateString = date.toISOString().split("T")[0];
    return this.tasks.filter((task) => task.dueDate === dateString);
  }

  getTasksForDateString(dateString) {
    return this.tasks.filter((task) => task.dueDate === dateString);
  }

  // Helper function to get local date string without timezone issues
  getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  showDateTasks(dateString) {
    const tasks = this.getTasksForDateString(dateString);
    if (tasks.length === 0) {
      this.showNotification("No tasks for this date", "info");
      return;
    }

    const taskList = tasks
      .map(
        (task) =>
          `<li>${task.title} (${this.capitalizeFirst(
            task.priority
          )} priority)</li>`
      )
      .join("");

    // Create date without timezone issues
    const dateParts = dateString.split("-");
    const displayDate = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2])
    );

    this.showNotification(
      `Tasks for ${this.formatDate(displayDate)}:<ul>${taskList}</ul>`,
      "info",
      5000
    );
  }

  // Timer Management
  startTimer() {
    if (!this.timer.isRunning) {
      this.timer.isRunning = true;
      this.timer.isPaused = false;

      document.getElementById("startTimer").disabled = true;
      document.getElementById("pauseTimer").disabled = false;

      this.timer.interval = setInterval(() => {
        this.timer.currentTime--;
        this.updateTimerDisplay();

        if (this.timer.currentTime <= 0) {
          this.completeTimerSession();
        }
      }, 1000);

      this.showNotification(
        `${this.capitalizeFirst(this.timer.type)} session started!`,
        "info"
      );
    }
  }

  pauseTimer() {
    if (this.timer.isRunning) {
      this.timer.isRunning = false;
      this.timer.isPaused = true;

      clearInterval(this.timer.interval);

      document.getElementById("startTimer").disabled = false;
      document.getElementById("pauseTimer").disabled = true;

      this.showNotification("Timer paused", "info");
    }
  }

  resetTimer() {
    this.timer.isRunning = false;
    this.timer.isPaused = false;

    clearInterval(this.timer.interval);

    this.timer.currentTime = this.timer.totalTime;
    this.updateTimerDisplay();

    document.getElementById("startTimer").disabled = false;
    document.getElementById("pauseTimer").disabled = true;

    this.showNotification("Timer reset", "info");
  }

  completeTimerSession() {
    this.timer.isRunning = false;
    clearInterval(this.timer.interval);

    document.getElementById("startTimer").disabled = false;
    document.getElementById("pauseTimer").disabled = true;

    if (this.timer.type === "focus") {
      this.timer.pomodoroCount++;
      this.studyStats.completedPomodoros++;
      this.studyStats.totalFocusTime += this.timer.totalTime / 60; // Convert to minutes

      // Determine next session type
      if (this.timer.pomodoroCount % 4 === 0) {
        this.setTimerType("longBreak");
      } else {
        this.setTimerType("break");
      }

      this.showNotification(
        "Focus session completed! Time for a break.",
        "success"
      );
      this.createCelebration();
    } else {
      this.setTimerType("focus");
      this.showNotification("Break over! Ready to focus?", "info");
    }

    this.saveStats();
    this.updateDashboard();
    this.checkAchievements();

    // Play notification sound
    this.playNotificationSound();
  }

  setTimerType(type) {
    this.timer.type = type;

    let duration;
    let label;

    switch (type) {
      case "focus":
        duration = this.settings.focusTime * 60;
        label = "Focus Time";
        break;
      case "break":
        duration = this.settings.breakTime * 60;
        label = "Short Break";
        break;
      case "longBreak":
        duration = this.settings.longBreakTime * 60;
        label = "Long Break";
        break;
    }

    this.timer.currentTime = duration;
    this.timer.totalTime = duration;

    document.getElementById("timerLabel").textContent = label;
    this.updateTimerDisplay();
  }

  updateTimerSettings(setting, value) {
    this.settings[setting] = value;
    this.saveSettings();

    // Update timer if not running
    if (!this.timer.isRunning && !this.timer.isPaused) {
      if (setting === "focusTime" && this.timer.type === "focus") {
        this.setTimerType("focus");
      } else if (setting === "breakTime" && this.timer.type === "break") {
        this.setTimerType("break");
      } else if (
        setting === "longBreakTime" &&
        this.timer.type === "longBreak"
      ) {
        this.setTimerType("longBreak");
      }
    }
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timer.currentTime / 60);
    const seconds = this.timer.currentTime % 60;
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    document.getElementById("timerDisplay").textContent = timeString;

    // Update progress ring
    const progress =
      ((this.timer.totalTime - this.timer.currentTime) / this.timer.totalTime) *
      100;
    const circle = document.getElementById("timerProgress");
    const circumference = 2 * Math.PI * 140; // radius = 140
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = strokeDashoffset;
  }

  updateTimer() {
    this.setTimerType("focus");
    this.updateTimerDisplay();

    // Update pomodoro stats
    document.getElementById("completedPomodoros").textContent =
      this.studyStats.completedPomodoros;

    const totalMinutes = this.studyStats.totalFocusTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    document.getElementById(
      "totalFocusTime"
    ).textContent = `${hours}h ${minutes}m`;
  }

  // Goal Management
  addGoal() {
    const titleEl = document.getElementById("goalTitle");
    const typeEl = document.getElementById("goalType");
    const targetEl = document.getElementById("goalTarget");
    const formEl = document.getElementById("addGoalForm");

    if (!titleEl || !typeEl || !targetEl || !formEl) {
      console.warn("Goal form elements not found");
      return;
    }

    const title = titleEl.value.trim();
    const type = typeEl.value;
    const target = parseInt(targetEl.value);

    if (!title || !target) return;

    const goal = {
      id: Date.now(),
      title: title,
      type: type,
      target: target,
      current: 0,
      createdAt: new Date().toISOString(),
      completed: false,
    };

    this.goals.push(goal);
    this.saveGoals();
    this.closeModal("addGoalModal");
    this.showNotification("Goal added successfully!", "success");

    // Clear form
    formEl.reset();
  }

  updateGoalProgress(goalId, progress) {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal) return;

    goal.current = Math.min(progress, goal.target);
    goal.completed = goal.current >= goal.target;

    if (goal.completed && !goal.completedAt) {
      goal.completedAt = new Date().toISOString();
      this.showNotification(`Goal "${goal.title}" completed! 🎉`, "success");
      this.createCelebration();
    }

    this.saveGoals();
  }

  renderGoals() {
    const goalsList = document.getElementById("goalsList");

    // Goals section has been removed, so this method does nothing
    if (!goalsList) {
      return;
    }

    if (this.goals.length === 0) {
      goalsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullseye"></i>
                    <p>Set your study goals</p>
                </div>
            `;
      return;
    }

    goalsList.innerHTML = this.goals
      .map((goal) => {
        const percentage = Math.round((goal.current / goal.target) * 100);

        return `
                <div class="goal-item ${goal.completed ? "completed" : ""}">
                    <div class="goal-info">
                        <h4>${goal.title}</h4>
                        <p>${goal.current} / ${
          goal.target
        } (${this.capitalizeFirst(goal.type)})</p>
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div class="goal-percentage">${percentage}%</div>
                </div>
            `;
      })
      .join("");
  }

  // Dashboard Updates
  updateDashboard() {
    // Update stats
    document.getElementById("totalTasks").textContent = this.tasks.length;
    document.getElementById("completedTasks").textContent =
      this.studyStats.completedTasks;
    document.getElementById("studyHours").textContent = Math.round(
      this.studyStats.studyHours
    );
    document.getElementById("streak").textContent = this.studyStats.streak;

    // Update today's progress
    this.updateTodayProgress();

    // Update upcoming tasks
    this.updateUpcomingTasks();
  }

  updateTodayProgress() {
    const today = this.getLocalDateString(new Date());

    // Get tasks that are due today, or if no tasks are due today, show overall progress
    let todayTasks = this.tasks.filter((task) => task.dueDate === today);

    // If no tasks are due today, use all tasks for progress calculation
    if (todayTasks.length === 0) {
      todayTasks = this.tasks;
    }

    const completedTodayTasks = todayTasks.filter((task) => task.completed);
    const percentage =
      todayTasks.length > 0
        ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
        : 0;

    document.getElementById("todayProgress").textContent = `${percentage}%`;

    // Update progress ring
    const circle = document.querySelector(".progress-ring-circle");
    if (circle) {
      const circumference = 2 * Math.PI * 54; // radius = 54
      const strokeDashoffset =
        circumference - (percentage / 100) * circumference;

      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = strokeDashoffset;
      circle.style.stroke = `url(#progressGradient)`;
    }
  }

  updateUpcomingTasks() {
    const upcomingContainer = document.getElementById("upcomingTasks");
    const upcomingTasks = this.tasks
      .filter((task) => !task.completed && task.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    if (upcomingTasks.length === 0) {
      upcomingContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <p>No upcoming tasks</p>
                </div>
            `;
      return;
    }

    upcomingContainer.innerHTML = upcomingTasks
      .map((task) => {
        const dueDate = new Date(task.dueDate);
        const isOverdue = dueDate < new Date();

        return `
                <div class="upcoming-task ${isOverdue ? "overdue" : ""}">
                    <div class="task-priority ${task.priority}"></div>
                    <div class="task-info">
                        <h4>${task.title}</h4>
                        <div class="task-meta">
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(
                              dueDate
                            )}</span>
                            <span><i class="fas fa-book"></i> ${this.capitalizeFirst(
                              task.subject
                            )}</span>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  updateProgressCharts() {
    // This would integrate with a charting library like Chart.js
    // For now, we'll simulate the chart data
    this.renderWeeklyChart();
    this.renderSubjects();
    this.checkAchievements();
  }

  renderWeeklyChart() {
    // Simulate weekly study hours data
    const weeklyData = this.generateWeeklyData();
    const canvas = document.getElementById("weeklyChart");

    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext("2d");
      this.drawSimpleChart(ctx, weeklyData);
    }
  }

  drawSimpleChart(ctx, data) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const barWidth = width / data.length;
    const maxValue = Math.max(...data.map((d) => d.value));

    ctx.clearRect(0, 0, width, height);

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * (height - 40);
      const x = index * barWidth + 10;
      const y = height - barHeight - 20;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(1, "#764ba2");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 20, barHeight);

      // Draw labels
      ctx.fillStyle = "#718096";
      ctx.font = "12px Inter";
      ctx.textAlign = "center";
      ctx.fillText(item.label, x + (barWidth - 20) / 2, height - 5);
      ctx.fillText(item.value + "h", x + (barWidth - 20) / 2, y - 5);
    });
  }

  generateWeeklyData() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      label: day,
      value: Math.floor(Math.random() * 8) + 1,
    }));
  }

  renderSubjects() {
    const subjectsList = document.getElementById("subjectsList");
    const subjects = this.getSubjectProgress();

    if (subjects.length === 0) {
      subjectsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>No subjects tracked yet</p>
                </div>
            `;
      return;
    }

    subjectsList.innerHTML = subjects
      .map(
        (subject) => `
            <div class="subject-item">
                <div class="subject-info">
                    <h4>${this.capitalizeFirst(subject.name)}</h4>
                    <p>${subject.completed} / ${
          subject.total
        } tasks completed</p>
                </div>
                <div class="subject-progress">
                    <div class="subject-progress-fill" style="width: ${
                      subject.percentage
                    }%"></div>
                </div>
            </div>
        `
      )
      .join("");
  }

  getSubjectProgress() {
    const subjectMap = {};

    this.tasks.forEach((task) => {
      if (!subjectMap[task.subject]) {
        subjectMap[task.subject] = { total: 0, completed: 0 };
      }
      subjectMap[task.subject].total++;
      if (task.completed) {
        subjectMap[task.subject].completed++;
      }
    });

    return Object.entries(subjectMap).map(([name, data]) => ({
      name,
      total: data.total,
      completed: data.completed,
      percentage: Math.round((data.completed / data.total) * 100),
    }));
  }

  // Achievements System
  checkAchievements() {
    const achievements = document.querySelectorAll(".achievement-item");

    // First Task Achievement
    if (this.tasks.length >= 1) {
      achievements[0].classList.remove("locked");
      achievements[0].classList.add("unlocked");
    }

    // 7-Day Streak Achievement
    if (this.studyStats.streak >= 7) {
      achievements[1].classList.remove("locked");
      achievements[1].classList.add("unlocked");
    }

    // 25 Hours Achievement
    if (this.studyStats.totalFocusTime >= 25 * 60) {
      // 25 hours in minutes
      achievements[2].classList.remove("locked");
      achievements[2].classList.add("unlocked");
    }

    // Perfectionist Achievement (100% tasks completed)
    if (
      this.tasks.length > 0 &&
      this.studyStats.completedTasks === this.tasks.length
    ) {
      achievements[3].classList.remove("locked");
      achievements[3].classList.add("unlocked");
    }
  }

  // Streak Management
  checkStreak() {
    const today = new Date().toDateString();
    const lastStudyDate = this.studyStats.lastStudyDate;

    if (!lastStudyDate) {
      this.studyStats.streak = 0;
    } else {
      const lastDate = new Date(lastStudyDate).toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate === today) {
        // Already studied today, keep streak
      } else if (lastDate === yesterday.toDateString()) {
        // Studied yesterday, can continue streak
      } else {
        // Streak broken
        this.studyStats.streak = 0;
      }
    }

    this.saveStats();
  }

  updateStreak() {
    const today = new Date().toDateString();
    const lastStudyDate = this.studyStats.lastStudyDate;

    if (!lastStudyDate || new Date(lastStudyDate).toDateString() !== today) {
      this.studyStats.streak++;
      this.studyStats.lastStudyDate = new Date().toISOString();
      this.saveStats();

      if (this.studyStats.streak > 1) {
        this.showNotification(
          `Great! ${this.studyStats.streak} day streak! 🔥`,
          "success"
        );
      }
    }
  }

  // Notification System
  startNotificationSystem() {
    // Check for overdue tasks every hour
    setInterval(() => {
      this.checkOverdueTasks();
    }, 60 * 60 * 1000);

    // Update notification badge
    this.updateNotificationBadge();
  }

  checkOverdueTasks() {
    const now = new Date();
    const overdueTasks = this.tasks.filter((task) => {
      if (task.completed || !task.dueDate) return false;
      return new Date(task.dueDate) < now;
    });

    if (overdueTasks.length > 0) {
      this.addNotification(
        "Overdue Tasks",
        `You have ${overdueTasks.length} overdue task(s)`,
        "warning"
      );
    }
  }

  addNotification(title, message, type = "info") {
    const notification = {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.notifications.unshift(notification);
    this.updateNotificationBadge();
    this.saveNotifications();
  }

  showNotification(message, type = "info", duration = 3000) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

    notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px var(--shadow-medium);
            border-left: 4px solid var(--${
              type === "success"
                ? "success"
                : type === "error"
                ? "error"
                : type === "warning"
                ? "warning"
                : "info"
            }-color);
            z-index: 3000;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease-out";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, duration);
  }

  getNotificationIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  toggleNotificationPanel() {
    const panel = document.getElementById("notificationPanel");
    const overlay = document.getElementById("overlay");

    panel.classList.toggle("active");
    overlay.classList.toggle("active");

    if (panel.classList.contains("active")) {
      this.renderNotifications();
      this.markAllNotificationsAsRead();
    }
  }

  renderNotifications() {
    const notificationsList = document.getElementById("notificationsList");

    if (this.notifications.length === 0) {
      notificationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell"></i>
                    <p>No notifications</p>
                </div>
            `;
      return;
    }

    notificationsList.innerHTML = this.notifications
      .map(
        (notification) => `
            <div class="notification-item ${
              notification.read ? "read" : "unread"
            }">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${this.timeAgo(
                  new Date(notification.timestamp)
                )}</div>
            </div>
        `
      )
      .join("");
  }

  markAllNotificationsAsRead() {
    this.notifications.forEach((notification) => {
      notification.read = true;
    });
    this.updateNotificationBadge();
    this.saveNotifications();
  }

  updateNotificationBadge() {
    const badge = document.getElementById("notificationBadge");
    const unreadCount = this.notifications.filter((n) => !n.read).length;
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? "flex" : "none";
  }

  closeNotificationPanel() {
    document.getElementById("notificationPanel").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
  }

  // Modal Management
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById("overlay");

    modal.classList.add("active");
    overlay.classList.add("active");

    // Focus first input
    const firstInput = modal.querySelector("input, textarea, select");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById("overlay");

    modal.classList.remove("active");
    overlay.classList.remove("active");
  }

  closeAllModals() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("active");
    });
    document.getElementById("overlay").classList.remove("active");
    this.closeNotificationPanel();
  }

  showAddTaskModal() {
    // Reset form
    document.getElementById("addTaskForm").reset();
    document.querySelector("#addTaskModal h3").textContent = "Add New Task";

    // Reset form behavior
    const form = document.getElementById("addTaskForm");
    form.onsubmit = (e) => {
      e.preventDefault();
      this.addTask();
    };

    this.showModal("addTaskModal");
  }

  showAddGoalModal() {
    this.showModal("addGoalModal");
  }

  // Utility Functions
  formatDate(date) {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }

  timeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  showMotivationalQuote() {
    const quotes = [
      {
        text: "Success is the sum of small efforts repeated day in and day out.",
        author: "Robert Collier",
      },
      {
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
      },
      {
        text: "Don't watch the clock; do what it does. Keep going.",
        author: "Sam Levenson",
      },
      {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
      {
        text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
        author: "Malcolm X",
      },
      {
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
      },
      {
        text: "The beautiful thing about learning is that no one can take it away from you.",
        author: "B.B. King",
      },
      {
        text: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.",
        author: "Richard Feynman",
      },
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById(
      "motivationQuote"
    ).textContent = `"${randomQuote.text}"`;
    document.getElementById(
      "motivationAuthor"
    ).textContent = `- ${randomQuote.author}`;
  }

  createCelebration() {
    // Create confetti effect
    const colors = [
      "#667eea",
      "#764ba2",
      "#f093fb",
      "#f5576c",
      "#4facfe",
      "#00f2fe",
    ];

    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${
                      colors[Math.floor(Math.random() * colors.length)]
                    };
                    top: -10px;
                    left: ${Math.random() * 100}vw;
                    z-index: 5000;
                    border-radius: 50%;
                    pointer-events: none;
                    animation: confettiFall 3s linear forwards;
                `;

        document.body.appendChild(confetti);

        setTimeout(() => {
          if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
          }
        }, 3000);
      }, i * 50);
    }

    // Add CSS animation if not exists
    if (!document.querySelector("#confettiAnimation")) {
      const style = document.createElement("style");
      style.id = "confettiAnimation";
      style.textContent = `
                @keyframes confettiFall {
                    to {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;
      document.head.appendChild(style);
    }
  }

  playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    if (this.settings.notifications) {
      try {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.log("Audio not supported");
      }
    }
  }

  // Data Persistence
  saveTasks() {
    localStorage.setItem("studyPlanner_tasks", JSON.stringify(this.tasks));
  }

  saveGoals() {
    localStorage.setItem("studyPlanner_goals", JSON.stringify(this.goals));
  }

  saveSettings() {
    localStorage.setItem(
      "studyPlanner_settings",
      JSON.stringify(this.settings)
    );
  }

  saveStats() {
    localStorage.setItem("studyPlanner_stats", JSON.stringify(this.studyStats));
  }

  saveNotifications() {
    localStorage.setItem(
      "studyPlanner_notifications",
      JSON.stringify(this.notifications)
    );
  }

  // Export/Import Data
  exportData() {
    const data = {
      tasks: this.tasks,
      goals: this.goals,
      settings: this.settings,
      stats: this.studyStats,
      notifications: this.notifications,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `study-planner-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    this.showNotification("Data exported successfully!", "success");
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (confirm("This will replace all current data. Are you sure?")) {
          this.tasks = data.tasks || [];
          this.goals = data.goals || [];
          this.settings = data.settings || this.settings;
          this.studyStats = data.stats || this.studyStats;
          this.notifications = data.notifications || [];

          this.saveTasks();
          this.saveGoals();
          this.saveSettings();
          this.saveStats();
          this.saveNotifications();

          this.loadTheme();
          this.updateDashboard();
          this.renderTasks();
          this.renderCalendar();

          this.showNotification("Data imported successfully!", "success");
        }
      } catch (error) {
        this.showNotification("Invalid backup file!", "error");
      }
    };
    reader.readAsText(file);
  }
}

// Mobile Menu Functionality
function initializeMobileMenu() {
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mainNav = document.getElementById("mainNav");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
  const mobileNavClose = document.getElementById("mobileNavClose");
  const navLinks = document.querySelectorAll(".nav-link");

  // Mobile controls
  const mobileThemeToggle = document.getElementById("mobileThemeToggle");
  const mobileNotificationsBtn = document.getElementById(
    "mobileNotificationsBtn"
  );
  const desktopThemeToggle = document.getElementById("themeToggle");
  const desktopNotificationsBtn = document.getElementById("notificationsBtn");

  // Toggle mobile menu
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileMenu();
    });
  } else {
    console.error("Mobile menu toggle button not found!");
  }

  // Close menu when close button is clicked
  if (mobileNavClose) {
    mobileNavClose.addEventListener("click", () => {
      closeMobileMenu();
    });
  }

  // Mobile theme toggle
  if (mobileThemeToggle && desktopThemeToggle) {
    mobileThemeToggle.addEventListener("click", () => {
      desktopThemeToggle.click(); // Trigger the existing theme toggle functionality
      closeMobileMenu();
    });
  }

  // Mobile notifications toggle
  if (mobileNotificationsBtn && desktopNotificationsBtn) {
    mobileNotificationsBtn.addEventListener("click", () => {
      desktopNotificationsBtn.click(); // Trigger the existing notifications functionality
      closeMobileMenu();
    });
  }

  // Close menu when a nav link is clicked
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });

  // Close menu when escape key is pressed
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mainNav.classList.contains("active")) {
      closeMobileMenu();
    }
  });

  function toggleMobileMenu() {
    if (mobileMenuToggle) mobileMenuToggle.classList.toggle("active");
    if (mainNav) mainNav.classList.toggle("active");
    if (mobileMenuOverlay) mobileMenuOverlay.classList.toggle("active");

    // Prevent body scroll when menu is open
    if (mainNav?.classList.contains("active")) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }

  function closeMobileMenu() {
    if (mobileMenuToggle) mobileMenuToggle.classList.remove("active");
    if (mainNav) mainNav.classList.remove("active");
    if (mobileMenuOverlay) mobileMenuOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Sync notification badges
  function syncNotificationBadges() {
    const desktopBadge = document.getElementById("notificationBadge");
    const mobileBadge = document.getElementById("mobileNotificationBadge");
    if (desktopBadge && mobileBadge) {
      mobileBadge.textContent = desktopBadge.textContent;
      mobileBadge.style.display = desktopBadge.style.display;
    }
  }

  // Initial sync
  syncNotificationBadges();

  // Observe changes to desktop badge
  const desktopBadge = document.getElementById("notificationBadge");
  if (desktopBadge) {
    const observer = new MutationObserver(syncNotificationBadges);
    observer.observe(desktopBadge, { childList: true, subtree: true });
  }

  // Handle window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileMenu();
    }
  });
}

// Initialize the Study Planner
let studyPlanner;

document.addEventListener("DOMContentLoaded", () => {
  studyPlanner = new StudyPlanner();

  // Backwards-compatible aliases for inline HTML actions.
  window.showAddTaskModal = () => studyPlanner.showAddTaskModal();
  window.closeModal = (id) => studyPlanner.closeModal(id);
  window.closeNotificationPanel = () => studyPlanner.closeNotificationPanel();

  // Simple test to ensure DOM is ready

  // Initialize mobile navigation once the DOM is ready
  initializeMobileMenu();

  // Also bind to window for easy access
  window.hamburgerBtn = document.getElementById("mobileMenuToggle");

  // Add CSS animations
  const style = document.createElement("style");
  style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(300px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(300px);
            }
        }
    `;
  document.head.appendChild(style);

  // Add SVG gradient definitions
  const svgDefs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgDefs.style.position = "absolute";
  svgDefs.style.width = "0";
  svgDefs.style.height = "0";
  svgDefs.innerHTML = `
        <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#4facfe;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#00f2fe;stop-opacity:1" />
            </linearGradient>
        </defs>
    `;
  document.body.appendChild(svgDefs);
});

// Service Worker for offline functionality (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}