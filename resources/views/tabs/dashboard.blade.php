<div class="space-y-6">

    <!-- KPI Summary Row -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <!-- Overall Progress -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div class="flex items-start justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Progress</span>
                <span class="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                </span>
            </div>
            <div class="mt-3">
                <div class="text-2xl font-extrabold text-slate-900 leading-none">{{ $stats['overallProgress'] }}%</div>
                <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div class="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style="width: {{ $stats['overallProgress'] }}%"></div>
                </div>
            </div>
            <p class="text-[11px] text-slate-400 mt-2 font-medium">{{ $stats['completedTasks'] }} of {{ $stats['totalTasks'] }} tasks done</p>
        </div>

        <!-- Total Tasks -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div class="flex items-start justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tasks</span>
                <span class="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                </span>
            </div>
            <div class="mt-3">
                <div class="text-2xl font-extrabold text-slate-900 leading-none">{{ $stats['totalTasks'] }}</div>
                <p class="text-[11px] text-slate-400 mt-2 font-medium">{{ $stats['notStartedTasks'] }} pending start</p>
            </div>
        </div>

        <!-- In Progress -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div class="flex items-start justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">In Progress</span>
                <span class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </span>
            </div>
            <div class="mt-3">
                <div class="text-2xl font-extrabold text-indigo-600 leading-none">{{ $stats['inProgressTasks'] }}</div>
                <p class="text-[11px] text-slate-400 mt-2 font-medium">Active work in flight</p>
            </div>
        </div>

        <!-- Blocked / On Hold -->
        <div class="bg-white rounded-2xl p-4 border {{ $stats['blockedTasks'] > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200' }} shadow-xs flex flex-col justify-between">
            <div class="flex items-start justify-between">
                <span class="text-xs font-bold {{ $stats['blockedTasks'] > 0 ? 'text-rose-700' : 'text-slate-500' }} uppercase tracking-wider">Blocked</span>
                <span class="p-1.5 rounded-lg {{ $stats['blockedTasks'] > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500' }}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </span>
            </div>
            <div class="mt-3">
                <div class="text-2xl font-extrabold {{ $stats['blockedTasks'] > 0 ? 'text-rose-600' : 'text-slate-900' }} leading-none">{{ $stats['blockedTasks'] }}</div>
                <p class="text-[11px] text-slate-400 mt-2 font-medium">Requires resolution</p>
            </div>
        </div>

        <!-- Overdue Tasks -->
        <div class="bg-white rounded-2xl p-4 border {{ $stats['overdue']->count() > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200' }} shadow-xs flex flex-col justify-between">
            <div class="flex items-start justify-between">
                <span class="text-xs font-bold {{ $stats['overdue']->count() > 0 ? 'text-amber-700' : 'text-slate-500' }} uppercase tracking-wider">Overdue</span>
                <span class="p-1.5 rounded-lg {{ $stats['overdue']->count() > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500' }}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </span>
            </div>
            <div class="mt-3">
                <div class="text-2xl font-extrabold {{ $stats['overdue']->count() > 0 ? 'text-amber-600' : 'text-slate-900' }} leading-none">{{ $stats['overdue']->count() }}</div>
                <p class="text-[11px] text-slate-400 mt-2 font-medium">Past target completion</p>
            </div>
        </div>

        <!-- Milestones Completed -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div class="flex items-start justify-between">
                <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Milestones</span>
                <span class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                </span>
            </div>
            <div class="mt-3">
                <div class="text-2xl font-extrabold text-emerald-600 leading-none">
                    {{ $stats['milestones']->where('status', 'Completed')->count() }} / {{ $stats['milestones']->count() }}
                </div>
                <p class="text-[11px] text-slate-400 mt-2 font-medium">Project checkpoints</p>
            </div>
        </div>
    </div>

    <!-- Automation Phases Progress Cards -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h2 class="text-base font-bold text-slate-900">Automation Delivery Phases</h2>
                <p class="text-xs text-slate-500">Progress across standard industrial automation lifecycle milestones</p>
            </div>
            <a href="{{ route('project.index', ['tab' => 'tasks']) }}" class="text-xs font-semibold text-blue-600 hover:text-blue-700">View in Task Tree &rarr;</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            @foreach($phases as $phase)
                @php
                    $pProg = $stats['phaseProgress'][$phase->id] ?? 0;
                    $pTasks = $tasks->where('phase_id', $phase->id);
                @endphp
                <div class="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between hover:bg-slate-50 transition">
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded">Phase {{ $phase->order }}</span>
                            <span class="text-xs font-extrabold text-slate-700">{{ $pProg }}%</span>
                        </div>
                        <h3 class="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mt-1">{{ $phase->name }}</h3>
                        <p class="text-[11px] text-slate-400 line-clamp-2 mt-1">{{ $phase->description }}</p>
                    </div>

                    <div class="mt-3">
                        <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div class="h-1.5 rounded-full {{ $pProg === 100 ? 'bg-emerald-500' : 'bg-blue-600' }}" style="width: {{ $pProg }}%"></div>
                        </div>
                        <div class="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                            <span>{{ $pTasks->count() }} tasks</span>
                            <span>{{ $pTasks->where('status', 'Completed')->count() }} done</span>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

    <!-- Two-Column Layout: Attention Items & Upcoming Deadlines -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Blocked & At-Risk Tasks -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <h2 class="text-base font-bold text-slate-900">Blocked & At-Risk Tasks</h2>
                    </div>
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">{{ $stats['blocked']->count() }} items</span>
                </div>

                @if($stats['blocked']->isEmpty())
                    <div class="py-8 text-center text-slate-400 text-xs">
                        <svg class="w-8 h-8 mx-auto text-emerald-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        No tasks currently blocked or on hold. Great job!
                    </div>
                @else
                    <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        @foreach($stats['blocked'] as $bt)
                            <div class="py-3 flex items-start justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition">
                                <div class="min-w-0">
                                    <div class="flex items-center gap-2">
                                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded {{ $bt->priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800' }}">{{ $bt->priority }}</span>
                                        <h4 class="text-xs font-bold text-slate-800 truncate">{{ $bt->title }}</h4>
                                    </div>
                                    <p class="text-[11px] text-slate-400 mt-0.5">Due: {{ $bt->due_date }} • Phase: {{ $phases->firstWhere('id', $bt->phase_id)?->name ?? 'General' }}</p>
                                </div>
                                <button onclick="editTask('{{ $bt->id }}')" class="text-xs font-medium text-blue-600 hover:text-blue-800 shrink-0">Edit</button>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>
        </div>

        <!-- Upcoming Deadlines (Next 14 Days) -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                        <h2 class="text-base font-bold text-slate-900">Upcoming Deadlines (This Week)</h2>
                    </div>
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{{ $stats['dueThisWeek']->count() }} due</span>
                </div>

                @if($stats['dueThisWeek']->isEmpty())
                    <div class="py-8 text-center text-slate-400 text-xs">
                        <svg class="w-8 h-8 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        No tasks due in the remaining days of this week.
                    </div>
                @else
                    <div class="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        @foreach($stats['dueThisWeek'] as $dt)
                            <div class="py-3 flex items-start justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition">
                                <div class="min-w-0">
                                    <h4 class="text-xs font-bold text-slate-800 truncate">{{ $dt->title }}</h4>
                                    <p class="text-[11px] text-slate-400 mt-0.5">Due: {{ $dt->due_date }} • Status: {{ $dt->status }}</p>
                                </div>
                                <div class="flex items-center gap-3 shrink-0">
                                    <div class="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div class="bg-blue-600 h-1.5 rounded-full" style="width: {{ $dt->progress }}%"></div>
                                    </div>
                                    <button onclick="editTask('{{ $dt->id }}')" class="text-xs font-medium text-blue-600 hover:text-blue-800">Edit</button>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>
        </div>

    </div>

    <!-- Recent Activity & Comments Stream -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h2 class="text-base font-bold text-slate-900">Project Comments & Activity Stream</h2>
                <p class="text-xs text-slate-500">Real-time log of engineering decisions, issues, and progress updates</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Add comment form -->
            <form action="{{ route('comments.store') }}" method="POST" class="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-3">
                @csrf
                <h3 class="text-xs font-bold text-slate-900">Post an Update or Note</h3>
                <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Author</label>
                    <input type="text" name="author" value="{{ $project->project_manager ?: 'Coordinator' }}" required class="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Type</label>
                    <select name="type" class="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                        <option value="Progress">Progress Update</option>
                        <option value="Decision">Decision</option>
                        <option value="Issue">Issue / Risk</option>
                        <option value="Note">General Note</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-slate-600 mb-1">Note Details</label>
                    <textarea name="text" rows="3" required placeholder="What was decided or updated today?" class="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white"></textarea>
                </div>
                <button type="submit" class="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition">
                    Post Comment
                </button>
            </form>

            <!-- Activity list -->
            <div class="lg:col-span-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                @forelse($comments as $comment)
                    <div class="py-3 flex items-start gap-3">
                        <span class="mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold shrink-0
                            {{ $comment->type === 'Issue' ? 'bg-rose-100 text-rose-800' : '' }}
                            {{ $comment->type === 'Decision' ? 'bg-emerald-100 text-emerald-800' : '' }}
                            {{ $comment->type === 'Progress' ? 'bg-blue-100 text-blue-800' : '' }}
                            {{ $comment->type === 'Note' ? 'bg-slate-100 text-slate-800' : '' }}">
                            {{ $comment->type }}
                        </span>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between text-xs">
                                <span class="font-bold text-slate-800">{{ $comment->author }}</span>
                                <span class="text-[10px] text-slate-400">{{ $comment->created_at?->diffForHumans() }}</span>
                            </div>
                            <p class="text-xs text-slate-600 mt-1">{{ $comment->text }}</p>
                        </div>
                    </div>
                @empty
                    <div class="py-8 text-center text-slate-400 text-xs">
                        No activity or comments logged yet. Use the form on the left to add notes or decisions.
                    </div>
                @endforelse
            </div>
        </div>
    </div>

</div>
