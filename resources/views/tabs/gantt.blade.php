<div class="space-y-4">

    <!-- Gantt Controls Toolbar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline Controls</span>
            
            <!-- Zoom Switch -->
            <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
                <button onclick="setGanttZoom('day')" id="zoomDay" class="px-2.5 py-1 rounded-md transition hover:text-slate-900 text-slate-600">Day</button>
                <button onclick="setGanttZoom('week')" id="zoomWeek" class="px-2.5 py-1 rounded-md transition bg-white text-blue-600 shadow-xs">Week</button>
                <button onclick="setGanttZoom('month')" id="zoomMonth" class="px-2.5 py-1 rounded-md transition hover:text-slate-900 text-slate-600">Month</button>
            </div>

            <!-- Color Mode -->
            <div class="flex items-center gap-1.5 text-xs text-slate-600 ml-2">
                <span class="font-medium">Color by:</span>
                <select id="ganttColorMode" onchange="renderGantt()" class="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white">
                    <option value="status">Status</option>
                    <option value="phase">Phase</option>
                </select>
            </div>

            <!-- Subtasks Toggle -->
            <label class="flex items-center gap-1.5 text-xs text-slate-600 ml-2 cursor-pointer select-none">
                <input type="checkbox" id="ganttShowSubtasks" checked onchange="renderGantt()" class="rounded border-slate-300 text-blue-600">
                <span>Show Subtasks</span>
            </label>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-slate-400"></span> Not Started</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-blue-500"></span> In Progress</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-rose-500"></span> Blocked</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-amber-500"></span> Pending Review</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-emerald-500"></span> Completed</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rotate-45 bg-amber-500 inline-block"></span> Milestone</span>
        </div>
    </div>

    <!-- Gantt Chart Container -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div class="overflow-x-auto" id="ganttScrollWrapper" style="max-height: 700px;">
            <div id="ganttCanvas" class="relative min-w-full">
                <!-- Dynamically rendered by JS -->
            </div>
        </div>
    </div>

</div>

<script>
    let currentZoom = 'week';

    const statusPalette = {
        'Not Started': '#94a3b8',
        'In Progress': '#3b82f6',
        'Blocked / On Hold': '#ef4444',
        'Pending Review': '#f59e0b',
        'Completed': '#10b981'
    };

    const phasePalette = [
        '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#dc2626', '#65a30d', '#db2777'
    ];

    function setGanttZoom(zoom) {
        currentZoom = zoom;
        ['Day', 'Week', 'Month'].forEach(z => {
            const btn = document.getElementById('zoom' + z);
            if (z.toLowerCase() === zoom) {
                btn.className = 'px-2.5 py-1 rounded-md transition bg-white text-blue-600 shadow-xs';
            } else {
                btn.className = 'px-2.5 py-1 rounded-md transition hover:text-slate-900 text-slate-600';
            }
        });
        renderGantt();
    }

    function renderGantt() {
        const container = document.getElementById('ganttCanvas');
        if (!container) return;

        const showSubtasks = document.getElementById('ganttShowSubtasks').checked;
        const colorMode = document.getElementById('ganttColorMode').value;

        // Filter tasks
        const tasksToRender = tasksData.filter(t => showSubtasks || !t.parent_id);

        if (tasksToRender.length === 0) {
            container.innerHTML = '<div class="p-12 text-center text-xs text-slate-400">No tasks available to render on timeline.</div>';
            return;
        }

        // Determine date bounds
        let minDate = new Date('{{ $project->start_date }}');
        let maxDate = new Date('{{ $project->end_date }}');
        if (isNaN(minDate.getTime())) minDate = new Date();
        if (isNaN(maxDate.getTime())) maxDate = new Date(minDate.getTime() + (90 * 86400000));

        // Ensure task dates are included in bounds
        tasksToRender.forEach(t => {
            if (t.start_date) {
                const s = new Date(t.start_date);
                if (s < minDate) minDate = s;
            }
            if (t.due_date) {
                const d = new Date(t.due_date);
                if (d > maxDate) maxDate = d;
            }
        });

        // Add 7 days padding
        minDate = new Date(minDate.getTime() - (7 * 86400000));
        maxDate = new Date(maxDate.getTime() + (14 * 86400000));

        const msPerDay = 86400000;
        const totalDays = Math.max(14, Math.ceil((maxDate - minDate) / msPerDay));

        let colWidth = 32; // day
        if (currentZoom === 'week') colWidth = 14;
        if (currentZoom === 'month') colWidth = 5;

        const leftWidth = 280;
        const timelineWidth = totalDays * colWidth;
        const totalWidth = leftWidth + timelineWidth;
        const rowHeight = 36;
        const headerHeight = 48;

        const phaseColors = {};
        phasesData.forEach((p, idx) => {
            phaseColors[p.id] = phasePalette[idx % phasePalette.length];
        });

        // Build header intervals
        let headerHtml = `<div class="sticky top-0 z-20 flex bg-slate-100 border-b border-slate-200" style="height: ${headerHeight}px; width: ${totalWidth}px;">
            <div class="sticky left-0 z-30 bg-slate-100 border-r border-slate-200 px-4 flex items-center font-bold text-xs text-slate-700" style="width: ${leftWidth}px; min-width: ${leftWidth}px;">
                Task / WBS Hierarchy
            </div>
            <div class="relative flex-1 flex items-end">`;

        // Render date ticks
        for (let i = 0; i < totalDays; i++) {
            const d = new Date(minDate.getTime() + (i * msPerDay));
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const isFirst = d.getDate() === 1 || i === 0;

            if (currentZoom === 'day') {
                headerHtml += `<div class="border-r border-slate-200 flex flex-col justify-end text-[10px] text-center pb-1 ${isWeekend ? 'bg-slate-200/50' : ''}" style="width: ${colWidth}px;">
                    <span class="text-slate-400 text-[8px] leading-tight">${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                    <span class="font-bold text-slate-700">${d.getDate()}</span>
                </div>`;
            } else if (currentZoom === 'week') {
                if (d.getDay() === 1 || i === 0) { // Monday
                    headerHtml += `<div class="border-r border-slate-300 text-[10px] font-bold text-slate-600 px-1 pb-1" style="width: ${colWidth * 7}px;">
                        ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>`;
                }
            } else {
                if (isFirst) {
                    headerHtml += `<div class="border-r border-slate-300 text-[10px] font-bold text-slate-700 px-2 pb-1" style="width: ${colWidth * 30}px;">
                        ${d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </div>`;
                }
            }
        }
        headerHtml += `</div></div>`;

        // Today line
        const today = new Date();
        const todayOffsetDays = (today - minDate) / msPerDay;
        const todayX = leftWidth + (todayOffsetDays * colWidth);
        let todayLineHtml = '';
        if (todayOffsetDays >= 0 && todayOffsetDays <= totalDays) {
            todayLineHtml = `<div class="absolute top-0 bottom-0 z-10 pointer-events-none border-l-2 border-dashed border-rose-500" style="left: ${todayX}px;" title="Today (${today.toISOString().split('T')[0]})">
                <span class="bg-rose-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-b ml-0.5">TODAY</span>
            </div>`;
        }

        // Rows
        let rowsHtml = `<div class="relative" style="width: ${totalWidth}px;">${todayLineHtml}`;

        tasksToRender.forEach((task, idx) => {
            const isSub = Boolean(task.parent_id);
            const sDate = task.start_date ? new Date(task.start_date) : minDate;
            const dDate = task.due_date ? new Date(task.due_date) : sDate;

            const startOffsetDays = Math.max(0, (sDate - minDate) / msPerDay);
            const durationDays = Math.max(1, (dDate - sDate) / msPerDay);

            const barLeft = leftWidth + (startOffsetDays * colWidth);
            const barWidth = Math.max(16, durationDays * colWidth);

            const color = colorMode === 'phase'
                ? (phaseColors[task.phase_id] || '#3b82f6')
                : (statusPalette[task.status] || '#94a3b8');

            const prog = task.progress || 0;

            rowsHtml += `
            <div class="flex items-center border-b border-slate-100 hover:bg-slate-50/70 transition" style="height: ${rowHeight}px;">
                <!-- Left Task Info -->
                <div class="sticky left-0 z-10 bg-white border-r border-slate-200 px-3 flex items-center justify-between text-xs" style="width: ${leftWidth}px; min-width: ${leftWidth}px; height: 100%;">
                    <div class="flex items-center gap-1.5 truncate" style="padding-left: ${isSub ? 20 : 0}px;">
                        ${task.is_milestone ? '<span class="text-amber-500 font-bold">◆</span>' : ''}
                        <span class="truncate font-semibold text-slate-800 cursor-pointer hover:text-blue-600" onclick="editTask('${task.id}')">${task.title}</span>
                    </div>
                    <span class="text-[10px] font-bold text-slate-400">${prog}%</span>
                </div>

                <!-- Timeline Track with Task Bar -->
                <div class="relative flex-1" style="height: 100%;">
                    ${task.is_milestone ? `
                        <div onclick="editTask('${task.id}')" title="${task.title} (${task.due_date})"
                            class="absolute top-2 w-4 h-4 rotate-45 bg-amber-500 border border-amber-600 shadow-sm cursor-pointer hover:scale-125 transition"
                            style="left: ${barLeft}px;"></div>
                    ` : `
                        <div onclick="editTask('${task.id}')" title="${task.title}: ${task.start_date} to ${task.due_date} (${prog}%)"
                            class="absolute top-1.5 h-6 rounded-md shadow-xs overflow-hidden cursor-pointer hover:brightness-110 transition flex items-center px-2 text-[10px] font-bold text-white select-none"
                            style="left: ${barLeft}px; width: ${barWidth}px; background-color: ${color};">
                            <div class="absolute inset-y-0 left-0 bg-white/20" style="width: ${prog}%;"></div>
                            <span class="relative z-10 truncate">${task.title}</span>
                        </div>
                    `}
                </div>
            </div>`;
        });

        rowsHtml += `</div>`;

        container.innerHTML = headerHtml + rowsHtml;
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderGantt();
    });
</script>
