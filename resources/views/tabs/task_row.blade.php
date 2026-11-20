@php
    $children = $allTasks->where('parent_id', $task->id)->sortBy('start_date');
    $hasChildren = $children->isNotEmpty();
    $taskProgress = $stats['progressMap'][$task->id] ?? $task->progress;
    $groupIdsStr = implode(',', $task->group_ids ?: []);
    $statusColors = [
        'Not Started' => 'bg-slate-100 text-slate-700 border-slate-200',
        'In Progress' => 'bg-blue-50 text-blue-700 border-blue-200',
        'Blocked / On Hold' => 'bg-rose-50 text-rose-700 border-rose-200',
        'Pending Review' => 'bg-amber-50 text-amber-700 border-amber-200',
        'Completed' => 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ];
@endphp

<div class="task-row flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 gap-3 hover:bg-slate-50 transition border-l-4 {{ $task->is_milestone ? 'border-amber-400 bg-amber-50/20' : 'border-transparent' }}"
    data-task-id="{{ $task->id }}"
    data-title="{{ $task->title }}"
    data-phase-id="{{ $task->phase_id }}"
    data-status="{{ $task->status }}"
    data-priority="{{ $task->priority }}"
    data-groups="{{ $groupIdsStr }}"
    data-milestone="{{ $task->is_milestone ? '1' : '0' }}"
    style="padding-left: {{ 12 + ($level * 28) }}px;">

    <!-- Left: Hierarchy, Title, Priority, Milestone, Groups -->
    <div class="flex items-center gap-2.5 min-w-0 flex-1">
        @if($hasChildren)
            <button onclick="toggleSubtasks('{{ $task->id }}')" class="p-0.5 rounded hover:bg-slate-200 text-slate-500">
                <svg id="chevron-{{ $task->id }}" class="w-3.5 h-3.5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
        @else
            <span class="w-4"></span>
        @endif

        @if($task->is_milestone)
            <span class="p-1 rounded bg-amber-100 text-amber-800" title="Milestone: {{ $task->milestone_label ?: 'Key Checkpoint' }}">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
            </span>
        @endif

        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded
            {{ $task->priority === 'Critical' ? 'bg-red-100 text-red-800' : '' }}
            {{ $task->priority === 'High' ? 'bg-orange-100 text-orange-800' : '' }}
            {{ $task->priority === 'Medium' ? 'bg-slate-100 text-slate-700' : '' }}
            {{ $task->priority === 'Low' ? 'bg-slate-50 text-slate-500' : '' }}">
            {{ $task->priority }}
        </span>

        <span class="text-xs font-bold text-slate-900 truncate cursor-pointer hover:text-blue-600" onclick="editTask('{{ $task->id }}')">
            {{ $task->title }}
        </span>

        <!-- Group Tags -->
        @if(!empty($task->group_ids))
            <div class="hidden md:flex items-center gap-1">
                @foreach($task->group_ids as $gid)
                    @php $g = $groups->firstWhere('id', $gid); @endphp
                    @if($g)
                        <span class="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">{{ $g->name }}</span>
                    @endif
                @endforeach
            </div>
        @endif
    </div>

    <!-- Middle: Dates & Progress -->
    <div class="flex items-center gap-4 text-xs text-slate-500 shrink-0">
        <span class="text-[11px] font-medium hidden sm:inline">{{ $task->start_date }} → {{ $task->due_date }} ({{ $task->duration_days }}d)</span>

        <!-- Quick Status Dropdown -->
        <select onchange="updateTaskStatus('{{ $task->id }}', this.value)" class="text-xs font-semibold px-2 py-1 rounded-lg border {{ $statusColors[$task->status] ?? 'bg-slate-50' }}">
            <option value="Not Started" {{ $task->status === 'Not Started' ? 'selected' : '' }}>Not Started</option>
            <option value="In Progress" {{ $task->status === 'In Progress' ? 'selected' : '' }}>In Progress</option>
            <option value="Blocked / On Hold" {{ $task->status === 'Blocked / On Hold' ? 'selected' : '' }}>Blocked / On Hold</option>
            <option value="Pending Review" {{ $task->status === 'Pending Review' ? 'selected' : '' }}>Pending Review</option>
            <option value="Completed" {{ $task->status === 'Completed' ? 'selected' : '' }}>Completed</option>
        </select>

        <!-- Progress bar -->
        <div class="w-16 sm:w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div class="h-1.5 rounded-full {{ $taskProgress >= 100 ? 'bg-emerald-500' : 'bg-blue-600' }}" style="width: {{ $taskProgress }}%"></div>
        </div>
        <span class="text-[11px] font-bold text-slate-700 w-8 text-right">{{ round($taskProgress) }}%</span>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-1 shrink-0">
        <!-- Add Subtask -->
        <button onclick="openCreateSubtaskModal('{{ $task->phase_id }}', '{{ $task->id }}')" class="p-1 rounded hover:bg-slate-200 text-slate-500" title="Add Subtask">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </button>

        <!-- Edit -->
        <button onclick="editTask('{{ $task->id }}')" class="p-1 rounded hover:bg-slate-200 text-blue-600" title="Edit Task">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </button>

        <!-- Delete -->
        <form action="{{ route('tasks.destroy', $task->id) }}" method="POST" onsubmit="return confirm('Delete task {{ addslashes($task->title) }}?')" class="inline">
            @csrf
            @method('DELETE')
            <button type="submit" class="p-1 rounded hover:bg-slate-200 text-rose-500" title="Delete Task">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </form>
    </div>

</div>

<!-- Render subtasks -->
@if($hasChildren)
    <div id="subtasks-{{ $task->id }}" class="divide-y divide-slate-100">
        @foreach($children as $child)
            @include('tabs.task_row', ['task' => $child, 'level' => $level + 1, 'allTasks' => $allTasks])
        @endforeach
    </div>
@endif
