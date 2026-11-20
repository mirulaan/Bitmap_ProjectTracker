<div class="space-y-6">

    <!-- Filters & Search Toolbar -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div class="flex flex-col md:flex-row items-center justify-between gap-3">
            <!-- Search -->
            <div class="relative w-full md:w-80">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                <input type="text" id="taskSearchInput" oninput="filterTasks()" placeholder="Search tasks by title..." class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
            </div>

            <!-- Filter Controls -->
            <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <!-- Phase filter -->
                <select id="filterPhase" onchange="filterTasks()" class="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700">
                    <option value="all">All Phases</option>
                    @foreach($phases as $p)
                        <option value="{{ $p->id }}">{{ $p->name }}</option>
                    @endforeach
                </select>

                <!-- Status filter -->
                <select id="filterStatus" onchange="filterTasks()" class="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700">
                    <option value="all">All Statuses</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked / On Hold">Blocked / On Hold</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Completed">Completed</option>
                </select>

                <!-- Priority filter -->
                <select id="filterPriority" onchange="filterTasks()" class="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700">
                    <option value="all">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>

                <!-- Group filter -->
                <select id="filterGroup" onchange="filterTasks()" class="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700">
                    <option value="all">All Groups</option>
                    @foreach($groups as $g)
                        <option value="{{ $g->id }}">{{ $g->name }}</option>
                    @endforeach
                </select>

                <!-- Milestone Toggle -->
                <label class="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer select-none">
                    <input type="checkbox" id="filterMilestoneOnly" onchange="filterTasks()" class="rounded border-slate-300 text-blue-600">
                    <span>Milestones Only</span>
                </label>
            </div>

            <!-- Expand / Collapse & Add Task -->
            <div class="flex items-center gap-2 shrink-0">
                <button onclick="toggleAllPhases(true)" class="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Expand All</button>
                <button onclick="toggleAllPhases(false)" class="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">Collapse All</button>
                <button onclick="openCreateTaskModal()" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    Add Task
                </button>
            </div>
        </div>
    </div>

    <!-- Tasks Tree By Phase -->
    <div class="space-y-4" id="taskTreeContainer">
        @foreach($phases as $phase)
            @php
                $phaseTasks = $tasks->where('phase_id', $phase->id);
                $pProg = $stats['phaseProgress'][$phase->id] ?? 0;
            @endphp
            <div class="phase-card bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" data-phase-id="{{ $phase->id }}">
                
                <!-- Phase Header -->
                <div class="bg-slate-50/80 px-4 py-3 flex items-center justify-between border-b border-slate-200 cursor-pointer select-none" onclick="togglePhase('{{ $phase->id }}')">
                    <div class="flex items-center gap-3">
                        <button class="phase-toggle-icon text-slate-400 hover:text-slate-600 transition" id="icon-{{ $phase->id }}">
                            <svg class="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <span class="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">Phase {{ $phase->order }}</span>
                        <h3 class="text-sm font-bold text-slate-900">{{ $phase->name }}</h3>
                        <span class="text-xs text-slate-400 font-medium">({{ $phaseTasks->count() }} tasks)</span>
                    </div>

                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                            <div class="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div class="bg-blue-600 h-1.5 rounded-full" style="width: {{ $pProg }}%"></div>
                            </div>
                            <span class="text-xs font-bold text-slate-700">{{ $pProg }}%</span>
                        </div>
                        <button onclick="event.stopPropagation(); openCreateTaskModal('{{ $phase->id }}')" class="p-1 rounded hover:bg-slate-200 text-slate-600" title="Add Task to this phase">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                    </div>
                </div>

                <!-- Tasks Table in Phase -->
                <div class="phase-body divide-y divide-slate-100" id="body-{{ $phase->id }}">
                    @if($phaseTasks->isEmpty())
                        <div class="p-6 text-center text-xs text-slate-400 empty-phase-msg">
                            No tasks created in this phase yet. Click the + icon above to add a task.
                        </div>
                    @else
                        @php
                            // Organize parent and child tasks
                            $rootPhaseTasks = $phaseTasks->whereNull('parent_id')->sortBy('start_date');
                        @endphp

                        @foreach($rootPhaseTasks as $rootTask)
                            @include('tabs.task_row', ['task' => $rootTask, 'level' => 0, 'allTasks' => $tasks])
                        @endforeach
                    @endif
                </div>

            </div>
        @endforeach
    </div>

</div>

<script>
    function togglePhase(phaseId) {
        const body = document.getElementById('body-' + phaseId);
        const icon = document.getElementById('icon-' + phaseId);
        if (body.classList.contains('hidden')) {
            body.classList.remove('hidden');
            icon.querySelector('svg').classList.remove('-rotate-90');
        } else {
            body.classList.add('hidden');
            icon.querySelector('svg').classList.add('-rotate-90');
        }
    }

    function toggleSubtasks(taskId) {
        const sub = document.getElementById('subtasks-' + taskId);
        const icon = document.getElementById('chevron-' + taskId);
        if (sub) {
            if (sub.classList.contains('hidden')) {
                sub.classList.remove('hidden');
                if (icon) icon.classList.remove('-rotate-90');
            } else {
                sub.classList.add('hidden');
                if (icon) icon.classList.add('-rotate-90');
            }
        }
    }

    function toggleAllPhases(open) {
        document.querySelectorAll('.phase-body').forEach(b => {
            if (open) b.classList.remove('hidden');
            else b.classList.add('hidden');
        });
        document.querySelectorAll('.phase-toggle-icon svg').forEach(svg => {
            if (open) svg.classList.remove('-rotate-90');
            else svg.classList.add('-rotate-90');
        });
    }

    function filterTasks() {
        const q = (document.getElementById('taskSearchInput').value || '').toLowerCase().trim();
        const phase = document.getElementById('filterPhase').value;
        const status = document.getElementById('filterStatus').value;
        const priority = document.getElementById('filterPriority').value;
        const group = document.getElementById('filterGroup').value;
        const milestoneOnly = document.getElementById('filterMilestoneOnly').checked;

        const rows = document.querySelectorAll('.task-row');
        rows.forEach(r => {
            const rTitle = (r.getAttribute('data-title') || '').toLowerCase();
            const rPhase = r.getAttribute('data-phase-id');
            const rStatus = r.getAttribute('data-status');
            const rPriority = r.getAttribute('data-priority');
            const rGroups = (r.getAttribute('data-groups') || '').split(',');
            const rIsMilestone = r.getAttribute('data-milestone') === '1';

            let match = true;
            if (q && !rTitle.includes(q)) match = false;
            if (phase !== 'all' && rPhase !== phase) match = false;
            if (status !== 'all' && rStatus !== status) match = false;
            if (priority !== 'all' && rPriority !== priority) match = false;
            if (group !== 'all' && !rGroups.includes(group)) match = false;
            if (milestoneOnly && !rIsMilestone) match = false;

            if (match) {
                r.classList.remove('hidden');
            } else {
                r.classList.add('hidden');
            }
        });
    }
</script>
