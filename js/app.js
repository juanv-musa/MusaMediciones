/**
 * MusaMediciones Application Controller
 * High-Fidelity Presto/Gropit report engine
 * Updated for GG/BI/PEC cascade
 */

class App {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.loginOverlay = document.getElementById('login-overlay');
        this.loginEmailInput = document.getElementById('login-email');
        this.loginKeyInput = document.getElementById('login-key');
        this.btnLogin = document.getElementById('btn-login');
        this.loginError = document.getElementById('login-error');

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
    }

    initLogin() {
        if (!this.btnLogin || !this.loginOverlay) return;

        // Intentamos inicializar Firebase Auth temprano para el onAuthStateChanged
        let auth = null;
        if (window.firebase && window.state) {
            window.state.initFirebaseAppOnly();
            auth = window.state.auth;
            if (auth) {
                window.firebase.onAuthStateChanged(auth, (user) => {
                    if (user) {
                        this.loginOverlay.style.display = 'none';
                        this.enterApp();
                    } else {
                        this.loginOverlay.style.display = 'flex';
                    }
                });
            }
        }

        // El event listener siempre debe registrarse, aunque Firebase acabe de fallar al cargar
        this.btnLogin.addEventListener('click', async () => {
            // Reintentar coger auth si falló o cargó tarde
            if (!auth && window.firebase && window.state) {
                window.state.initFirebaseAppOnly();
                auth = window.state.auth;
            }

            if (!auth) {
                if (this.loginError) {
                    this.loginError.style.display = 'block';
                    this.loginError.textContent = "Error de conexión a la Nube. Revisa tu internet o adblocker.";
                }
                return;
            }

            const email = this.loginEmailInput ? this.loginEmailInput.value.trim() : "";
            const pwd = this.loginKeyInput ? this.loginKeyInput.value.trim() : "";
            
            if (!email || !pwd) {
                if (this.loginError) {
                    this.loginError.style.display = 'block';
                    this.loginError.textContent = "Introduce correo y contraseña.";
                }
                return;
            }

            try {
                this.btnLogin.textContent = "Iniciando...";
                await window.firebase.signInWithEmailAndPassword(auth, email, pwd);
                this.btnLogin.textContent = "Entrar";
            } catch (err) {
                this.btnLogin.textContent = "Entrar";
                console.error("Login Error:", err);
                if (this.loginError) {
                    this.loginError.style.display = 'block';
                    this.loginError.textContent = "Usuario o contraseña incorrectos.";
                }
            }
        });

        if (this.loginKeyInput) {
            this.loginKeyInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.btnLogin.click();
            });
        }
    }

    async enterApp() {
        try {
            if (window.state) {
                // Inicializar Firebase si los componentes están cargados
                if (window.firebase) {
                    await window.state.initFirebase();
                } else {
                    console.warn("MusaApp: Firebase no disponible. Cargando modo local.");
                    // Si no hay Firebase, inicializar con datos locales por defecto
                    if (!window.state.data) {
                        window.state.data = window.state.getInitialProjectData("Proyecto Local (Sin Nube)");
                        window.state.calculate();
                    }
                }
            }
            this.init();
        } catch (error) {
            console.error("MusaApp: Error al entrar en la aplicación:", error);
            this.init(); // Intentar cargar la interfaz de todos modos
        }
    }

    init() {
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

        const projectNameEl = document.getElementById('current-project-name');
        if (projectNameEl) {
            projectNameEl.addEventListener('blur', (e) => {
                window.state.updateProjectMetadata('name', e.target.textContent.trim());
            });
            projectNameEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); projectNameEl.blur(); }
            });
        }

        const btnSave = document.getElementById('btn-save');
        if (btnSave) btnSave.addEventListener('click', () => {
            window.state.saveAll();
            btnSave.textContent = '¡Guardado!';
            setTimeout(() => btnSave.textContent = 'Guardar Cambios', 2000);
        });

        const btnExcel = document.getElementById('btn-export-excel');
        if (btnExcel) btnExcel.addEventListener('click', () => this.exportToExcel());

        this.switchView('dashboard');
        if (window.state && window.state.data) {
            this.updateGlobalUI(window.state.data);
            this.updatePrintFields(window.state.data, window.state.clients);
        }
    }

    switchView(viewName) {
        this.navItems.forEach(item => {
            if (item.getAttribute('data-view') === viewName) item.classList.add('active');
            else item.classList.remove('active');
        });
        Object.keys(this.views).forEach(name => {
            this.views[name].style.display = (name === viewName) ? 'block' : 'none';
            if (name === viewName && window.state) this.components[name].render(window.state.data, window.state.projects, window.state.clients);
        });
        if (window.lucide) lucide.createIcons();
    }

    updateGlobalUI(data) {
        if (!data || !data.project) return;
        const totalVal = document.getElementById('project-total-val');
        if (totalVal) totalVal.textContent = (data.project.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 });
        const prog = document.getElementById('project-progress-bar');
        const progTxt = document.getElementById('progress-text');
        const reduced = document.getElementById('project-total-reduced');
        let filled = 0; let totalCnt = 0;
        if (data.chapters) {
            data.chapters.forEach(c => {
                if (c.items) {
                    c.items.forEach(i => { totalCnt++; if(i.qty > 0) filled++; });
                }
            });
        }
        const pct = totalCnt > 0 ? Math.round((filled/totalCnt)*100) : 0;
        if (prog) prog.style.width = `${pct}%`;
        if (progTxt) progTxt.textContent = `${pct}%`;
        if (reduced) reduced.textContent = (data.project.pem || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 }) + '€';
    }

    updatePrintFields(data, clientList) {
        const p = data.project;
        document.getElementById('p-project').textContent = p.name;
        document.getElementById('p-situation').textContent = p.situation || '---';
        const client = clientList.find(c => c.id === p.clientId);
        document.getElementById('p-property').textContent = client ? client.name : (p.property || '---');
        document.getElementById('p-author').textContent = p.author || '---';
        document.getElementById('p-location').textContent = p.location || '---';

        this.renderPrintSummary(data);
        const words = this.numberToWords(p.total);
        document.getElementById('txt-amount-words').textContent = words.toUpperCase();
        document.getElementById('txt-amount-numeric').textContent = p.total.toLocaleString('es-ES', { minimumFractionDigits: 2 });
        const dateStr = this.formatDateInSpanish(p.date || new Date().toISOString());
        document.getElementById('p-signature-location').textContent = `${(p.location || 'LOCALIDAD').toUpperCase()}, ${dateStr.toUpperCase()}`;
        document.getElementById('p-signature-title').textContent = (p.authorTitle || 'MUSEOLOGO').toUpperCase();
        document.getElementById('p-signature-name').textContent = `Fdo: ${(p.author || '').toUpperCase()}`;
    }

    renderPrintSummary(data) {
        const root = document.getElementById('print-summary-root');
        const p = data.project;
        let rows = data.chapters.map(c => `
            <tr>
                <td class="desc" style="width: 50px;">${c.order}</td>
                <td class="desc" style="font-weight: 700;">${c.title.toUpperCase()}</td>
                <td>${c.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

        root.innerHTML = `
            <table class="summary-table">
                <thead><tr style="border-bottom: 2px solid #000;"><th style="text-align: left;">Ord.</th><th style="text-align: left;">Descripción</th><th>Importe</th></tr></thead>
                <tbody>
                    ${rows}
                    <tr style="border-top: 2px solid #000;">
                        <td colspan="2" style="font-weight: 800; padding-top: 20px;">SUMA EJECUCIÓN MATERIAL</td>
                        <td style="font-weight: 800; padding-top: 20px;">${p.pem.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="font-size: 0.9rem;">GASTOS GENERALES (${p.expensesPct.toFixed(2)}%)</td>
                        <td>${p.expensesTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="font-size: 0.9rem;">BENEFICIO INDUSTRIAL (${p.benefitPct.toFixed(2)}%)</td>
                        <td>${p.benefitTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr style="border-top: 1px solid #000;">
                        <td colspan="2" style="font-weight: 700;">PRESUPUESTO EJECUCIÓN POR CONTRATA (PEC)</td>
                        <td style="font-weight: 700;">${p.pec.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td colspan="2" style="font-size: 0.9rem;">I.V.A. (${p.taxPct.toFixed(2)}%)</td>
                        <td>${p.taxTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr style="border-top: 2px solid #000;">
                        <td colspan="2" style="font-weight: 900; font-size: 1.2rem; padding-top: 15px;">Total presupuesto</td>
                        <td style="font-weight: 900; font-size: 1.2rem; padding-top: 15px;">${p.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    formatDateInSpanish(isoDate) {
        const d = new Date(isoDate);
        const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
    }

    numberToWords(n) {
        const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
        const tens = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
        const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
        const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

        const convertThreeDigits = (val) => {
            if (val === 0) return '';
            if (val === 100) return 'cien';
            let res = hundreds[Math.floor(val/100)] + ' ';
            let rem = val % 100;
            if (rem === 0) return res.trim();
            if (rem < 10) res += units[rem];
            else if (rem < 20) res += teens[rem-10];
            else {
                res += tens[Math.floor(rem/10)];
                if (rem % 10 !== 0) res += ' y ' + units[rem%10];
            }
            return res.trim();
        };

        const integerPart = Math.floor(n);
        const decimalPart = Math.round((n - integerPart) * 100);

        let result = '';
        if (integerPart === 0) result = 'cero';
        else {
            const millions = Math.floor(integerPart / 1000000);
            const thousands = Math.floor((integerPart % 1000000) / 1000);
            const rest = integerPart % 1000;
            
            if (millions > 0) result += (millions === 1 ? 'un millón ' : convertThreeDigits(millions) + ' millones ');
            if (thousands > 0) result += (thousands === 1 ? 'mil ' : convertThreeDigits(thousands) + ' mil ');
            if (rest > 0) result += convertThreeDigits(rest);
        }

        result += ' euros';
        if (decimalPart > 0) result += ` con ${convertThreeDigits(decimalPart)} céntimos`;
        
        return result.replace(/\s+/g, ' ').trim();
    }

    exportToExcel() {
        const data = window.state.data;
        let csvContent = "Capítulo;Código;Resumen;Unidad;Cantidad;Precio;Total\n";
        data.chapters.forEach(c => {
            csvContent += `${c.order};;${c.title};;;;${c.total.toFixed(2)}\n`;
            c.items.forEach(i => csvContent += `${c.order};${i.order};${i.descShort};${i.unit};${i.qty.toFixed(2)};${i.price.toFixed(2)};${i.total.toFixed(2)}\n`);
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Export_${data.project.name}.csv`);
        link.click();
    }
}

// Inicialización segura
const startApp = () => {
    if (!window.app) {
        window.app = new App();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
