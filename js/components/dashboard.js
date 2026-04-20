/**
 * MusaMediciones Dashboard Component
 */

class DashboardView {
    constructor(container) {
        this.container = container;
    }

    render(data) {
        const totalDuration = this.calculateTotalDuration(data);
        const completion = this.calculateCompletion(data);

        this.container.innerHTML = `
            <div class="dashboard-view view-container" style="animation: fadeIn 0.4s ease-out;">
                <h2 style="margin-bottom: 2rem; font-weight: 800; font-size: 2.2rem; color: var(--text-primary);">Dashboard del Proyecto</h2>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3rem;">
                    <div class="glass" style="padding: 2rem; border-radius: var(--radius-xl); border-bottom: 5px solid var(--primary); background: white;">
                        <div style="color: var(--text-secondary); font-size: 0.95rem; margin: 0 0 0.8rem 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Presupuesto Total</div>
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--primary);">${data.project.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</div>
                    </div>
                    <div class="glass" style="padding: 2rem; border-radius: var(--radius-xl); border-bottom: 5px solid var(--secondary); background: white;">
                        <div style="color: var(--text-secondary); font-size: 0.95rem; margin: 0 0 0.8rem 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Duración Prevista</div>
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase;">${totalDuration} Días</div>
                    </div>
                    <div class="glass" style="padding: 2rem; border-radius: var(--radius-xl); border-bottom: 5px solid var(--primary); background: white;">
                        <div style="color: var(--text-secondary); font-size: 0.95rem; margin: 0 0 0.8rem 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Tareas Completadas</div>
                        <div style="font-size: 2.5rem; font-weight: 800; color: var(--primary);">${completion}%</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div class="glass" style="padding: 2.5rem; border-radius: var(--radius-xl); background: white;">
                        <h3 style="margin-bottom: 2rem; font-size: 1.4rem; font-weight: 700;">Distribución por Capítulos</h3>
                        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                            ${data.chapters.map(chapter => this.renderChapterBar(chapter, data.project.total)).join('')}
                        </div>
                    </div>
                    
                    <div class="glass" style="padding: 2.5rem; border-radius: var(--radius-xl); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: white;">
                        <div style="width: 80px; height: 80px; background: rgba(140, 198, 63, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                            <i data-lucide="printer" style="width: 40px; height: 40px; color: var(--primary);"></i>
                        </div>
                        <h3 style="margin-bottom: 0.5rem; font-size: 1.2rem;">Informe Ejecutivo</h3>
                        <p style="color: var(--text-secondary); line-height: 1.6; max-width: 300px;">Genera un informe completo en PDF con el resumen económico y los gráficos de distribución.</p>
                        <button id="btn-print-dashboard" class="btn-musa" style="margin-top: 2rem;">Imprimir Informe a PDF</button>
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners();
        if (window.lucide) lucide.createIcons();
    }

    addEventListeners() {
        const btnPrint = this.container.querySelector('#btn-print-dashboard');
        if (btnPrint) {
            btnPrint.addEventListener('click', () => window.print());
        }
    }

    calculateTotalDuration(data) {
        let maxDays = 0;
        const projectStart = new Date(data.project.startDate);
        data.chapters.forEach(c => {
            c.items.forEach(i => {
                if (i.planning.endDate) {
                    const end = new Date(i.planning.endDate);
                    const diffDays = Math.ceil((end - projectStart) / (1000 * 60 * 60 * 24));
                    if (diffDays > maxDays) maxDays = diffDays;
                }
            });
        });
        return maxDays + 1;
    }

    calculateCompletion(data) {
        let totalItems = 0;
        let completedItems = 0;
        data.chapters.forEach(c => {
            c.items.forEach(i => {
                totalItems++;
                if (i.qty > 0) completedItems++;
            });
        });
        return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    }

    renderChapterBar(chapter, total) {
        const percentage = total > 0 ? (chapter.total / total) * 100 : 0;
        return `
            <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.8rem; font-size: 1rem; font-weight: 600;">
                    <span style="color: var(--text-secondary);">${chapter.title}</span>
                    <span style="color: var(--text-primary);">${chapter.total.toLocaleString('es-ES')}€ (${percentage.toFixed(1)}%)</span>
                </div>
                <div style="height: 12px; background: #f1f5f9; border-radius: 6px; overflow: hidden; border: 1px solid var(--border);">
                    <div style="width: ${percentage}%; height: 100%; background: var(--primary); transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);"></div>
                </div>
            </div>
        `;
    }
}

window.DashboardView = DashboardView;
