<div class="space-y-4">

    <!-- Gantt Controls Toolbar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline Controls</span>
            
            <!-- Zoom Switch -->
            <div class="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
                <button onclick="setGanttZoom('day')" id="zoomDay" class="px-2.5 py-1 rounded-md transition hover:text-slate-900 text-slate-600">Day</button>
                <button onclick="setGanttZoom('week')" id="zoomWeek" class="px-2.5 py-1 rounded-md transition bg-white text-blue-600 shadow-xs font-bold">Week</button>
                <button onclick="setGanttZoom('month')" id="zoomMonth" class="px-2.5 py-1 rounded-md transition hover:text-slate-900 text-slate-600">Month</button>
            </div>

            <!-- Jump to Today Button -->
            <button onclick="scrollToToday()" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 shadow-xs" title="Scroll timeline directly to today">
                <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Today</span>
            </button>

            <!-- Hide Past Tasks Filter -->
            <label class="flex items-center gap-1.5 text-xs text-slate-600 ml-1 cursor-pointer select-none">
                <input type="checkbox" id="ganttHidePast" onchange="renderGantt(); setTimeout(scrollToToday, 50);" class="rounded border-slate-300 text-blue-600">
                <span>Hide Past Tasks</span>
            </label>

            <!-- Subtasks Toggle -->
            <label class="flex items-center gap-1.5 text-xs text-slate-600 ml-1 cursor-pointer select-none">
                <input type="checkbox" id="ganttShowSubtasks" checked onchange="renderGantt()" class="rounded border-slate-300 text-blue-600">
                <span>Subtasks</span>
            </label>

            <!-- Color Mode -->
            <div class="flex items-center gap-1.5 text-xs text-slate-600 ml-1">
                <span class="font-medium">Color:</span>
                <select id="ganttColorMode" onchange="renderGantt()" class="px-2 py-1 border border-slate-200 rounded-lg text-xs bg-white">
                    <option value="status">By Status</option>
                    <option value="phase">By Phase</option>
                </select>
            </div>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-slate-400"></span> Not Started</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-blue-500"></span> In Progress</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-rose-500"></span> Blocked</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-amber-500"></span> Pending Review</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded bg-emerald-500"></span> Completed</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rotate-45 bg-amber-500 inline-block"></span> Milestone</span>
        </div>
    </div>

    <!-- Gantt Chart Split-Pane Container -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div id="ganttContainer" class="flex overflow-y-auto" style="max-height: 720px;">
            <!-- Dynamically populated by renderGantt(): Left Task Pane + Right Timeline Pane -->
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

    // Safe calendar date helpers
    function parseDate(str) {
        if (!str) return null;
        const s = String(str).trim();
        const parts = s.split('T')[0].split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    }

    function formatYMD(d) {
        if (!d) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function calcDayDiff(d1, d2) {
        const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
        const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
        return Math.round((utc1 - utc2) / 86400000);
    }

    function isTaskOrDescendantActive(task, todayYMD, allTasks) {
        if (task.due_date && task.due_date >= todayYMD) return true;
        if (!task.due_date && task.start_date && task.start_date >= todayYMD) return true;
        const children = allTasks.filter(t => t.parent_id === task.id);
        for (const child of children) {
            if (isTaskOrDescendantActive(child, todayYMD, allTasks)) return true;
        }
        return false;
    }

    function setGanttZoom(zoom) {
        currentZoom = zoom;
        ['Day', 'Week', 'Month'].forEach(z => {
            const btn = document.getElementById('zoom' + z);
            if (!btn) return;
            if (z.toLowerCase() === zoom) {
                btn.className = 'px-2.5 py-1 rounded-md transition bg-white text-blue-600 shadow-xs font-bold';
            } else {
                btn.className = 'px-2.5 py-1 rounded-md transition hover:text-slate-900 text-slate-600';
            }
        });
        renderGantt();
    }

    function scrollToToday() {
        const scrollEl = document.getElementById('ganttTimelineScroll');
        if (!scrollEl) return;

        const todayObj = new Date();
        todayObj.setHours(0, 0, 0, 0);

        if (window.ganttMinDate && window.ganttColWidth) {
            const todayOffset = calcDayDiff(todayObj, window.ganttMinDate);
            const todayX = todayOffset * window.ganttColWidth;
            // Align Today near the left of the timeline view with a comfortable margin
            const target = Math.max(0, todayX - 60);
            scrollEl.scrollTo({ left: target, behavior: 'smooth' });
        }
    }

    function renderGantt() {
        const container = document.getElementById('ganttContainer');
        if (!container) return;

        const showSubtasks = document.getElementById('ganttShowSubtasks')?.checked ?? true;
        const hidePastTasks = document.getElementById('ganttHidePast')?.checked ?? false;
        const colorMode = document.getElementById('ganttColorMode')?.value ?? 'status';

        const todayObj = new Date();
        todayObj.setHours(0, 0, 0, 0);
        const todayYMD = formatYMD(todayObj);

        // Filter tasks
        let tasksToRender = tasksData.filter(t => showSubtasks || !t.parent_id);

        if (hidePastTasks) {
            tasksToRender = tasksToRender.filter(t => isTaskOrDescendantActive(t, todayYMD, tasksData));
        }

        if (tasksToRender.length === 0) {
            container.innerHTML = `
                <div class="w-full p-12 text-center text-xs text-slate-400">
                    <p class="font-semibold text-slate-600 text-sm mb-1">No active tasks from Today onwards.</p>
                    <p>Uncheck "Hide Past Tasks" to view past/completed tasks.</p>
                </div>`;
            return;
        }

        // 1. Determine timeline date bounds
        let minDate = parseDate('{{ $project->start_date }}') || new Date();
        let maxDate = parseDate('{{ $project->end_date }}') || new Date(minDate.getTime() + (90 * 86400000));

        tasksToRender.forEach(t => {
            if (t.start_date) {
                const s = parseDate(t.start_date);
                if (s && s < minDate) minDate = s;
            }
            if (t.due_date) {
                const d = parseDate(t.due_date);
                if (d && d > maxDate) maxDate = d;
            }
        });

        // Ensure today is within date bounds
        if (todayObj < minDate) minDate = new Date(todayObj);
        if (todayObj > maxDate) maxDate = new Date(todayObj);

        // Align minDate to Monday with a 7-day lead-in for context
        const dayOfWeek = (minDate.getDay() + 6) % 7;
        minDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() - dayOfWeek - 7, 0, 0, 0, 0);
        maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate() + 14, 0, 0, 0, 0);

        const totalDays = Math.max(14, calcDayDiff(maxDate, minDate) + 1);

        // Column widths
        let colWidth = 36; // day
        if (currentZoom === 'week') colWidth = 20;
        if (currentZoom === 'month') colWidth = 6;

        window.ganttMinDate = minDate;
        window.ganttColWidth = colWidth;

        const timelineWidth = totalDays * colWidth;
        const rowHeight = 38;
        const headerHeight = 52;

        const phaseColors = {};
        phasesData.forEach((p, idx) => {
            phaseColors[p.id] = phasePalette[idx % phasePalette.length];
        });

        // 2. Build Date Scale Headers (Tier 1 & Tier 2)
        let tier1Html = '';
        let tier2Html = '';

        if (currentZoom === 'day') {
            let currentMonth = -1;
            let currentMonthName = '';
            let monthDayCount = 0;

            for (let i = 0; i < totalDays; i++) {
                const d = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() + i);
                const m = d.getMonth();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                if (m !== currentMonth) {
                    if (currentMonth !== -1) {
                        tier1Html += `<div class="border-r border-slate-200 px-2 flex items-center font-bold text-[11px] text-slate-700 truncate" style="width: ${monthDayCount * colWidth}px;">${currentMonthName}</div>`;
                    }
                    currentMonth = m;
                    currentMonthName = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                    monthDayCount = 1;
                } else {
                    monthDayCount++;
                }

                tier2Html += `<div class="border-r border-slate-200 flex flex-col justify-center items-center text-center ${isWeekend ? 'bg-slate-100/70 font-semibold text-slate-500' : 'text-slate-700'}" style="width: ${colWidth}px; min-width: ${colWidth}px;">
                    <span class="text-[8px] uppercase text-slate-400 leading-none">${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
                    <span class="text-[10px] font-bold leading-none mt-0.5">${d.getDate()}</span>
                </div>`;
            }
            if (monthDayCount > 0) {
                tier1Html += `<div class="border-r border-slate-200 px-2 flex items-center font-bold text-[11px] text-slate-700 truncate" style="width: ${monthDayCount * colWidth}px;">${currentMonthName}</div>`;
            }

        } else if (currentZoom === 'week') {
            let currentMonth = -1;
            let currentMonthName = '';
            let monthDayCount = 0;

            for (let i = 0; i < totalDays; i++) {
                const d = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() + i);
                const m = d.getMonth();

                if (m !== currentMonth) {
                    if (currentMonth !== -1) {
                        tier1Html += `<div class="border-r border-slate-200 px-2 flex items-center font-bold text-[11px] text-slate-700 truncate" style="width: ${monthDayCount * colWidth}px;">${currentMonthName}</div>`;
                    }
                    currentMonth = m;
                    currentMonthName = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                    monthDayCount = 1;
                } else {
                    monthDayCount++;
                }
            }
            if (monthDayCount > 0) {
                tier1Html += `<div class="border-r border-slate-200 px-2 flex items-center font-bold text-[11px] text-slate-700 truncate" style="width: ${monthDayCount * colWidth}px;">${currentMonthName}</div>`;
            }

            for (let i = 0; i < totalDays; i += 7) {
                const d = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() + i);
                const daysInThisWeek = Math.min(7, totalDays - i);
                tier2Html += `<div class="border-r border-slate-200 px-1 flex items-center justify-center text-[10px] font-semibold text-slate-600 truncate bg-slate-50" style="width: ${daysInThisWeek * colWidth}px; min-width: ${daysInThisWeek * colWidth}px;">
                    ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>`;
            }

        } else {
            let currentYear = -1;
            let yearDayCount = 0;
            let currentMonth = -1;
            let monthDayCount = 0;
            let currentMonthName = '';

            for (let i = 0; i < totalDays; i++) {
                const d = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() + i);
                const y = d.getFullYear();
                const m = d.getMonth();

                if (y !== currentYear) {
                    if (currentYear !== -1) {
                        tier1Html += `<div class="border-r border-slate-200 px-2 flex items-center font-bold text-[11px] text-slate-700 truncate" style="width: ${yearDayCount * colWidth}px;">${currentYear}</div>`;
                    }
                    currentYear = y;
                    yearDayCount = 1;
                } else {
                    yearDayCount++;
                }

                if (m !== currentMonth) {
                    if (currentMonth !== -1) {
                        tier2Html += `<div class="border-r border-slate-200 px-1 flex items-center justify-center font-bold text-[10px] text-slate-600 truncate bg-slate-50" style="width: ${monthDayCount * colWidth}px;">${currentMonthName}</div>`;
                    }
                    currentMonth = m;
                    currentMonthName = d.toLocaleDateString(undefined, { month: 'short' });
                    monthDayCount = 1;
                } else {
                    monthDayCount++;
                }
            }
            if (yearDayCount > 0) {
                tier1Html += `<div class="border-r border-slate-200 px-2 flex items-center font-bold text-[11px] text-slate-700 truncate" style="width: ${yearDayCount * colWidth}px;">${currentYear}</div>`;
            }
            if (monthDayCount > 0) {
                tier2Html += `<div class="border-r border-slate-200 px-1 flex items-center justify-center font-bold text-[10px] text-slate-600 truncate bg-slate-50" style="width: ${monthDayCount * colWidth}px;">${currentMonthName}</div>`;
            }
        }

        // 3. Background Grid Columns (for right timeline tracks)
        let gridColsHtml = '';
        if (currentZoom === 'day') {
            for (let i = 0; i < totalDays; i++) {
                const d = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() + i);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                gridColsHtml += `<div class="border-r border-slate-100 ${isWeekend ? 'bg-slate-50/60' : ''}" style="width: ${colWidth}px; min-width: ${colWidth}px; height: 100%;"></div>`;
            }
        } else if (currentZoom === 'week') {
            for (let i = 0; i < totalDays; i += 7) {
                const daysInWeek = Math.min(7, totalDays - i);
                gridColsHtml += `<div class="border-r border-slate-100/80" style="width: ${daysInWeek * colWidth}px; min-width: ${daysInWeek * colWidth}px; height: 100%;"></div>`;
            }
        } else {
            let mCount = 0;
            let curM = -1;
            for (let i = 0; i < totalDays; i++) {
                const d = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate() + i);
                const m = d.getMonth();
                if (m !== curM) {
                    if (curM !== -1) {
                        gridColsHtml += `<div class="border-r border-slate-200/60" style="width: ${mCount * colWidth}px; min-width: ${mCount * colWidth}px; height: 100%;"></div>`;
                    }
                    curM = m;
                    mCount = 1;
                } else {
                    mCount++;
                }
            }
            if (mCount > 0) {
                gridColsHtml += `<div class="border-r border-slate-200/60" style="width: ${mCount * colWidth}px; min-width: ${mCount * colWidth}px; height: 100%;"></div>`;
            }
        }

        // 4. Today Line in Timeline Pane
        const todayOffset = calcDayDiff(todayObj, minDate);
        const todayX = todayOffset * colWidth;
        const isTodayVisible = todayOffset >= 0 && todayOffset < totalDays;

        let todayMarkerHtml = '';
        if (isTodayVisible) {
            todayMarkerHtml = `
            <div id="ganttTodayMarker" class="absolute top-0 bottom-0 z-20 pointer-events-none border-l-2 border-dashed border-rose-500" style="left: ${todayX}px;">
                <span class="bg-rose-500 text-white text-[8px] font-extrabold px-1 py-0.5 rounded shadow-xs ml-0.5 -mt-1 uppercase tracking-wider">Today</span>
            </div>`;
        }

        // 5. Build Left Pane (Task List) & Right Pane (Timeline Tracks) separately
        let leftRowsHtml = '';
        let timelineRowsHtml = '';

        tasksToRender.forEach((task, idx) => {
            const isSub = Boolean(task.parent_id);
            const sDate = parseDate(task.start_date) || minDate;
            const dDate = parseDate(task.due_date) || sDate;

            const startOffset = Math.max(0, calcDayDiff(sDate, minDate));

            const calendarDays = Math.max(1, calcDayDiff(dDate, sDate) + 1);

            const barLeft = startOffset * colWidth;
            const barWidth = Math.max(12, calendarDays * colWidth);

            const color = colorMode === 'phase'
                ? (phaseColors[task.phase_id] || '#3b82f6')
                : (statusPalette[task.status] || '#94a3b8');

            const prog = Math.min(100, Math.max(0, parseInt(task.progress, 10) || 0));

            const priorityBadge = task.priority === 'Critical'
                ? '<span class="w-1.5 h-1.5 rounded-full bg-red-500" title="Critical"></span>'
                : (task.priority === 'High' ? '<span class="w-1.5 h-1.5 rounded-full bg-orange-500" title="High"></span>' : '');

            // Left Task Row (Completely separated - cannot be overlapped)
            leftRowsHtml += `
            <div class="flex items-center justify-between px-3 border-b border-slate-100 hover:bg-slate-50/70 transition text-xs select-none bg-white" style="height: ${rowHeight}px;">
                <div class="flex items-center gap-1.5 min-w-0 pr-2" style="padding-left: ${isSub ? 20 : 0}px;">
                    ${task.is_milestone ? '<span class="text-amber-500 font-bold text-xs" title="Milestone">◆</span>' : priorityBadge}
                    <span class="truncate font-semibold text-slate-800 cursor-pointer hover:text-blue-600" onclick="editTask('${task.id}')" title="${task.title}">
                        ${task.title}
                    </span>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 text-slate-400">
                    <span class="text-[10px] font-medium">${task.duration_days ?? durationDays}d</span>
                    <span class="text-[10px] font-bold ${prog === 100 ? 'text-emerald-600' : 'text-slate-600'}">${prog}%</span>
                </div>
            </div>`;

            // Right Timeline Row
            timelineRowsHtml += `
            <div class="relative flex items-center border-b border-slate-100 hover:bg-slate-50/40 transition group" style="height: ${rowHeight}px; width: ${timelineWidth}px; min-width: ${timelineWidth}px;">
                <!-- Grid Lines -->
                <div class="absolute inset-0 flex pointer-events-none">
                    ${gridColsHtml}
                </div>

                <!-- Task Bar or Milestone Marker -->
                ${task.is_milestone ? `
                    <div onclick="editTask('${task.id}')"
                        title="Milestone: ${task.title} (${task.due_date || task.start_date})"
                        class="absolute top-2 w-4 h-4 rotate-45 bg-amber-500 border border-amber-600 shadow-sm cursor-pointer hover:scale-125 transition z-10"
                        style="left: ${barLeft + (colWidth / 2) - 8}px;">
                    </div>
                ` : `
                    <div onclick="editTask('${task.id}')"
                        title="${task.title} | ${task.start_date || 'No start'} → ${task.due_date || 'No due'} (${durationDays}d, ${prog}%)"
                        class="absolute top-1.5 h-6 rounded-md shadow-xs overflow-hidden cursor-pointer hover:brightness-105 hover:ring-2 hover:ring-blue-400 transition flex items-center px-2 text-[10px] font-bold text-white select-none z-10"
                        style="left: ${barLeft}px; width: ${barWidth}px; background-color: ${color};">
                        
                        <div class="absolute inset-y-0 left-0 bg-white/25" style="width: ${prog}%;"></div>
                        <span class="relative z-10 truncate text-[10px] drop-shadow-xs">${task.title}</span>
                    </div>
                `}
            </div>`;
        });

        // 6. Assemble Split-Pane Structure
        const leftPaneHtml = `
        <div class="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xs">
            <div class="sticky top-0 z-30 bg-slate-100 border-b border-slate-200 px-4 flex items-center justify-between font-bold text-xs text-slate-700 select-none shadow-xs" style="height: ${headerHeight}px;">
                <span>Task / WBS Hierarchy</span>
                <span class="text-[10px] text-slate-400 font-semibold">${tasksToRender.length} items</span>
            </div>
            <div class="flex flex-col">
                ${leftRowsHtml}
            </div>
        </div>`;

        const rightPaneHtml = `
        <div class="flex-1 min-w-0 overflow-x-auto flex flex-col bg-white" id="ganttTimelineScroll">
            <!-- Timeline Date Scale Header -->
            <div class="sticky top-0 z-20 flex flex-col bg-slate-100 border-b border-slate-200 select-none shadow-xs" style="height: ${headerHeight}px; width: ${timelineWidth}px; min-width: ${timelineWidth}px;">
                <div class="flex border-b border-slate-200/80 bg-slate-100/90" style="height: 24px;">
                    ${tier1Html}
                </div>
                <div class="flex flex-1 bg-white">
                    ${tier2Html}
                </div>
            </div>
            <!-- Timeline Body Tracks -->
            <div class="relative" style="width: ${timelineWidth}px; min-width: ${timelineWidth}px;">
                ${todayMarkerHtml}
                <div class="flex flex-col">
                    ${timelineRowsHtml}
                </div>
            </div>
        </div>`;

        container.innerHTML = leftPaneHtml + rightPaneHtml;
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderGantt();
        setTimeout(scrollToToday, 100);
    });
</script>
