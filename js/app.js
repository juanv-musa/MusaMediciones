console.log("MusaApp: ARCHIVO JS CARGADO CORRECTAMENTE");

// Objeto Global de la App
window.musaApp = {
    authListenerAttached: false,
    components: {},
    views: {},

    init: function() {
        console.log("MusaApp: Iniciando aplicación...");
        
        // Referencias UI
        this.navItems = document.querySelectorAll('.nav-item');
        this.loginOverlay = document.getElementById('login-overlay');
        this.loginEmailInput = document.getElementById('login-email');
        this.loginKeyInput = document.getElementById('login-key');
        this.btnLogin = document.getElementById('btn-login');

        this.views = {
            dashboard: document.getElementById('view-dashboard'),
            projects: document.getElementById('view-projects'),
            clients: document.getElementById('view-clients'),
            budget: document.getElementById('view-budget'),
            planning: document.getElementById('view-planning')
        };
        
        try {
            this.components = {
                dashboard: new window.DashboardView(this.views.dashboard),
                projects: new window.ProjectManagerView(this.views.projects),
                clients: new window.ClientManagerView(this.views.clients),
                budget: new window.BudgetView(this.views.budget),
                planning: new window.PlanningView(this.views.planning)
            };
        } catch (e) {
            console.error("MusaApp: Error instanciando componentes:", e);
        }

        this.initLogin();
    },

    initLogin: function() {
        console.log("MusaApp: Configurando Login...");
        if (!this.btnLogin || !this.loginOverlay) return;

        const setupListener = () => {
            if (window.firebase && window.state && !this.authListenerAttached) {
                console.log("MusaApp: Conectando detector de sesión...");
                window.state.initFirebaseAppOnly();
                const auth = window.state.auth;
                if (auth) {
                    window.firebase.onAuthStateChanged(auth, (user) => {
                        console.log("MusaApp: Sesión detectada ->", user ? user.email : "CERRADA");
                        if (user) {
                            this.loginOverlay.style.display = 'none';
                            this.enterApp();
                        } else {
                            this.loginOverlay.style.display = 'flex';
                        }
                    });
                    this.authListenerAttached = true;
                    return true;
                }
            }
            return false;
        };

        setupListener();
        setTimeout(setupListener, 1000);
        setTimeout(setupListener, 3000);

        this.btnLogin.addEventListener('click', () => {
            console.log("MusaApp: Click en Entrar.");
            const email = this.loginEmailInput.value.trim();
            const pwd = this.loginKeyInput.value.trim();
            if (!email || !pwd) { alert("Introduce datos"); return; }
            
            this.btnLogin.disabled = true;
            this.btnLogin.textContent = "Conectando...";

            window.firebase.signInWithEmailAndPassword(window.state.auth, email, pwd)
                .then(() => {
                    this.btnLogin.textContent = "¡Entrando!";
                    setTimeout(() => { this.loginOverlay.style.display = 'none'; this.enterApp(); }, 500);
                })
                .catch(err => {
                    this.btnLogin.disabled = false;
                    this.btnLogin.textContent = "Entrar";
                    alert("Error: " + err.message);
                });
        });
    },

    enterApp: function() {
        if (window.state && window.firebase) {
            window.state.initFirebase().then(() => {
                this.startMainUI();
            });
        } else {
            this.startMainUI();
        }
    },

    startMainUI: function() {
        console.log("MusaApp: Cargando Interfaz Principal...");
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(item.getAttribute('data-view'));
            });
        });

        if (window.state) {
            window.state.subscribe((data, projectList, clientList) => {
                this.updateGlobalUI(data);
                this.updatePrintFields(data, clientList);
                const activeNav = document.querySelector('.nav-item.active');
                if (activeNav) {
                    const viewName = activeNav.getAttribute('data-view');
                    if (viewName === 'projects') this.components.projects.render(data, projectList);
                    else if (viewName === 'clients') this.components.clients.render(data, projectList, clientList);
                    else if (this.components[viewName]) this.components[viewName].render(data);
                }
            });
        }

        const btnSave = document.getElementById('btn-save');
        if (btnSave) btnSave.addEventListener('click', () => {
            window.state.saveAll();
            btnSave.textContent = '¡Guardado!';
            setTimeout(() => btnSave.textContent = 'Guardar Cambios', 2000);
        });

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) btnLogout.addEventListener('click', () => {
            if (confirm("¿Cerrar sesión?")) {
                window.firebase.signOut(window.state.auth).then(() => location.reload());
            }
        });

        this.switchView('dashboard');
    },

    switchView: function(viewName) {
        this.navItems.forEach(item => {
            if (item.getAttribute('data-view') === viewName) item.classList.add('active');
            else item.classList.remove('active');
        });
        Object.keys(this.views).forEach(name => {
            this.views[name].style.display = (name === viewName) ? 'block' : 'none';
            if (name === viewName && window.state) this.components[name].render(window.state.data, window.state.projects, window.state.clients);
        });
        if (window.lucide) lucide.createIcons();
    },

    updateGlobalUI: function(data) {
        if (!data || !data.project) return;
        const totalVal = document.getElementById('project-total-val');
        if (totalVal) totalVal.textContent = (data.project.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 });
    },

    updatePrintFields: function(data, clientList) {
        // ... (resto de funciones de renderizado, simplificadas para brevedad)
    }
};

// Arrancar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.musaApp.init());
} else {
    window.musaApp.init();
}
