/**
 * MusaMediciones Project Manager Component
 */

class ProjectManagerView {
    constructor(container) {
        this.container = container;
    }

    render(data, projects) {
        this.container.innerHTML = `
            <div class="project-manager-view view-container" style="animation: fadeIn 0.4s ease-out;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;">
                    <div>
                        <h2 style="font-weight: 800; font-size: 2.2rem; color: var(--text-primary);">Mis Proyectos</h2>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Gestiona y organiza todos tus presupuestos registrados.</p>
                    </div>
                    <button id="btn-create-new-project" class="btn-musa" style="padding: 1rem 2rem; font-size: 1rem;">
                        <i data-lucide="plus-circle" style="width: 20px;"></i> + Nuevo Presupuesto
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem;">
                    ${projects.length === 0 ? `
                        <div class="glass" style="grid-column: 1 / -1; padding: 4rem; text-align: center; background: white;">
                            <i data-lucide="folder-open" style="width: 64px; height: 64px; color: var(--border); margin-bottom: 1.5rem;"></i>
                            <h3 style="color: var(--text-secondary);">No hay proyectos guardados</h3>
                            <p style="color: var(--text-muted); margin-top: 0.5rem;">Crea tu primer presupuesto para empezar a trabajar.</p>
                        </div>
                    ` : projects.map(p => this.renderProjectCard(p, data.project.id)).join('')}
                </div>
            </div>
        `;

        this.addEventListeners();
        if (window.lucide) lucide.createIcons();
    }

    renderProjectCard(project, activeId) {
        const isActive = project.id === activeId;
        const date = new Date(project.lastModified).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        return `
            <div class="glass" style="padding: 2rem; border-radius: var(--radius-xl); background: white; border: 2px solid ${isActive ? 'var(--primary)' : 'transparent'}; transition: all 0.2s; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                    <div style="width: 48px; height: 48px; background: ${isActive ? 'rgba(140, 198, 63, 0.1)' : '#f8fafc'}; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="file-text" style="color: ${isActive ? 'var(--primary)' : 'var(--text-muted)'}; width: 24px;"></i>
                    </div>
                    ${isActive ? '<span style="font-size: 0.7rem; font-weight: 800; color: var(--primary); text-transform: uppercase; background: rgba(140, 198, 63, 0.1); padding: 4px 8px; border-radius: 4px;">Activo</span>' : ''}
                </div>

                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary);">${project.name}</h3>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">Modificado: ${date}</div>
                
                <div style="margin-top: auto;">
                    <div style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">${project.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€</div>
                    
                    <div style="display: flex; gap: 0.8rem;">
                        <button class="btn-load-project btn-musa" data-id="${project.id}" style="flex: 1; ${isActive ? 'opacity: 0.5; pointer-events: none;' : ''}">Abrir</button>
                        <button class="btn-delete-project" data-id="${project.id}" style="padding: 0.8rem; border-radius: 0.75rem; border: 1px solid #fee2e2; color: #ef4444; background: #fff; cursor: pointer;">
                            <i data-lucide="trash-2" style="width: 18px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addEventListeners() {
        this.container.querySelectorAll('.btn-load-project').forEach(btn => {
            btn.addEventListener('click', () => {
                window.state.loadProject(btn.getAttribute('data-id'));
                if (window.app) window.app.switchView('budget');
            });
        });

        this.container.querySelectorAll('.btn-delete-project').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
                    window.state.deleteProject(btn.getAttribute('data-id'));
                }
            });
        });

        const btnNew = this.container.querySelector('#btn-create-new-project');
        if (btnNew) {
            btnNew.addEventListener('click', () => {
                const name = prompt('Nombre del nuevo proyecto:', 'Nuevo Presupuesto');
                if (name) {
                    window.state.createNewProject(name);
                    if (window.app) window.app.switchView('budget');
                }
            });
        }
    }
}

window.ProjectManagerView = ProjectManagerView;
