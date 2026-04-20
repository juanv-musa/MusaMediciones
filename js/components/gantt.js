/**
 * MusaMediciones Planning/Gantt Component
 */

class PlanningView {
    constructor(container) {
        this.container = container;
        this.dayWidth = 45;
        this.rowHeight = 60;
        this.colors = [
            '#8CC63F', // Corporate Green
            '#3b82f6', // Blue
            '#8b5cf6', // Violet
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#ec4899', // Pink
            '#06b6d4', // Cyan
        ];
    }

    render(data) {
        const flattened = this.getFlattenedItems(data);
        const minDate = new Date(data.project.startDate);
        const maxDate = this.getMaxDate(flattened, minDate);
        const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 10;

        this.container.innerHTML = `
            <div class="planning-view glass" style="display: flex; flex-direction: column; height: calc(100vh - 130px); border-radius: var(--radius-xl); overflow: hidden; background: white;">
                <div style="padding: 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border);">
                    <h2 style="font-weight: 800; font-size: 2rem; color: var(--text-primary);">Planificación Temporal (Gantt)</h2>
                    <div style="display: flex; gap: 1rem;">
                        <button id="btn-export-pdf" class="btn-musa" style="background: white; color: var(--primary); border: 2px solid var(--primary);">Exportar a PDF / Imprimir</button>
                    </div>
                </div>

                <div class="gantt-chart" style="flex: 1; display: grid; grid-template-columns: 350px 1fr; overflow: hidden;">
                    <!-- Task List -->
                    <div class="gantt-task-list" style="border-right: 1px solid var(--border); overflow-y: auto; background: #f8fafc;">
                        <div style="height: 50px; background: white; display: flex; align-items: center; padding: 0 1.5rem; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border);">PARTIDA / TAREA</div>
                        ${flattened.map(f => `
                            <div style="height: ${this.rowHeight}px; padding: 0 1.5rem; display: flex; flex-direction: column; justify-content: center; border-bottom: 1px solid rgba(0,0,0,0.03); background: white;">
                                <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${f.item.descShort}</span>
                                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">${f.item.planning.duration} días</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- SVG Timeline -->
                    <div id="gantt-timeline-container" style="overflow: auto; background: #ffffff;">
                        <svg width="${totalDays * this.dayWidth}" height="${flattened.length * this.rowHeight + 50}" class="gantt-svg">
                            <defs>
                                <pattern id="grid" width="${this.dayWidth}" height="${this.rowHeight}" patternUnits="userSpaceOnUse">
                                    <path d="M ${this.dayWidth} 0 L 0 0 0 ${this.rowHeight}" fill="none" stroke="#f1f5f9" stroke-width="1"/>
                                </pattern>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                                </marker>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />

                            <!-- Header -->
                            <g>${this.renderTimelineHeader(minDate, totalDays)}</g>
                            <!-- Dependencies -->
                            <g style="transform: translateY(50px);">${this.renderDependencies(flattened, minDate)}</g>
                            <!-- Bars -->
                            <g style="transform: translateY(50px);">${flattened.map((f, idx) => this.renderBar(f, idx, minDate)).join('')}</g>
                        </svg>
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners();
        if (window.lucide) lucide.createIcons();
    }

    addEventListeners() {
        const btnPdf = this.container.querySelector('#btn-export-pdf');
        if (btnPdf) {
            btnPdf.addEventListener('click', () => window.print());
        }
    }

    getFlattenedItems(data) {
        const items = [];
        data.chapters.forEach((c, cIdx) => {
            c.items.forEach(i => items.push({ item: i, chapterIdx: cIdx }));
        });
        return items;
    }

    getMaxDate(flattened, minDate) {
        let max = new Date(minDate);
        flattened.forEach(f => {
            if (f.item.planning.endDate) {
                const end = new Date(f.item.planning.endDate);
                if (end > max) max = end;
            }
        });
        return max;
    }

    renderTimelineHeader(minDate, totalDays) {
        let headers = [];
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(minDate);
            date.setDate(date.getDate() + i);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isToday = new Date().toDateString() === date.toDateString();
            
            headers.push(`
                <g transform="translate(${i * this.dayWidth}, 0)">
                    <rect width="${this.dayWidth}" height="50" fill="${isWeekend ? '#f8fafc' : 'white'}" />
                    <text x="${this.dayWidth / 2}" y="30" text-anchor="middle" fill="${isToday ? 'var(--primary)' : (isWeekend ? '#cbd5e1' : '#64748b')}" style="font-size: 11px; font-weight: ${isToday ? '800' : '600'};">
                        ${date.getDate()}
                    </text>
                </g>
            `);
        }
        return headers.join('');
    }

    renderBar(f, idx, minDate) {
        const item = f.item;
        if (!item.planning.startDate) return '';
        
        const start = new Date(item.planning.startDate);
        const diffDays = Math.ceil((start - minDate) / (1000 * 60 * 60 * 24));
        const x = diffDays * this.dayWidth + 10;
        const y = idx * this.rowHeight + 15;
        const width = item.planning.duration * this.dayWidth - 20;

        const color = this.colors[f.chapterIdx % this.colors.length];

        return `
            <g class="gantt-item-group" data-id="${item.id}" style="cursor: pointer;">
                <rect x="${x}" y="${y}" width="${width}" height="30" fill="${color}" rx="15" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))">
                    <title>${item.descShort}: ${item.planning.startDate} a ${item.planning.endDate}</title>
                </rect>
                <text x="${x + width / 2}" y="${y + 20}" text-anchor="middle" fill="white" style="font-size: 10px; font-weight: 700; pointer-events: none;">${item.planning.duration}d</text>
            </g>
        `;
    }

    renderDependencies(flattened, minDate) {
        const lines = [];
        const itemMap = {};
        flattened.forEach((f, idx) => itemMap[f.item.id] = { f, idx });

        flattened.forEach((f, idx) => {
            const item = f.item;
            item.planning.dependencies.forEach(depId => {
                const depData = itemMap[depId];
                if (depData) {
                    const depEnd = new Date(depData.f.item.planning.endDate);
                    const itemStart = new Date(item.planning.startDate);
                    
                    const x1 = (Math.ceil((depEnd - minDate) / (1000 * 60 * 60 * 24)) + 1) * this.dayWidth - 10;
                    const y1 = depData.idx * this.rowHeight + 30;
                    
                    const x2 = (Math.ceil((itemStart - minDate) / (1000 * 60 * 60 * 24))) * this.dayWidth + 10;
                    const y2 = idx * this.rowHeight + 30;

                    const midX = x1 + (x2 - x1) / 2;
                    lines.push(`
                        <path d="M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}" 
                              stroke="#cbd5e1" stroke-width="2" fill="none" opacity="0.6" marker-end="url(#arrowhead)" />
                    `);
                }
            });
        });
        return lines.join('');
    }
}

window.PlanningView = PlanningView;
