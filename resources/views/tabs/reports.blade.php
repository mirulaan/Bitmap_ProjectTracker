<div class="space-y-6">

    <!-- Print / Export Action Bar (Hidden when printing) -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between no-print">
        <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Template</span>
            <select id="reportTypeSelect" onchange="switchReport(this.value)" class="text-xs font-semibold px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800">
                <option value="exec">Executive Summary</option>
                <option value="phase">Phase Delivery Breakdown</option>
                <option value="overdue">Critical Path & Overdue Issues</option>
                <option value="milestones">Milestone Status Checkpoints</option>
            </select>
        </div>

        <button onclick="window.print()" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print / Save to PDF
        </button>
    </div>

    <!-- Printable Report Document Container -->
    <div class="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm print:p-0 print:border-0 print:shadow-none" id="reportPrintArea">
        
        <!-- Document Print Header -->
        <div class="border-b-2 border-slate-800 pb-5 mb-6 flex items-start justify-between">
            <div>
                <span class="text-xs font-extrabold uppercase tracking-widest text-blue-600">Bitmap Automation Engineering</span>
                <h1 class="text-2xl font-black text-slate-900 mt-0.5">{{ $project->name }}</h1>
                <div class="text-xs text-slate-600 mt-1 space-y-0.5">
                    <p><span class="font-semibold text-slate-800">Client / Customer:</span> {{ $project->customer ?: 'Internal Project' }}</p>
                    <p><span class="font-semibold text-slate-800">Project Manager / Lead:</span> {{ $project->project_manager ?: 'Unassigned' }}</p>
                </div>
            </div>

            <div class="text-right text-xs text-slate-500">
                <span class="inline-block px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-800 mb-1" id="reportTitleBadge">EXECUTIVE STATUS REPORT</span>
                <p><span class="font-medium text-slate-700">Project Window:</span> {{ $project->start_date }} → {{ $project->end_date }}</p>
                <p><span class="font-medium text-slate-700">Generated:</span> {{ date('Y-m-d H:i:s') }}</p>
            </div>
        </div>

        <!-- 1. Executive Summary Report -->
        <div id="report-exec" class="report-section space-y-6">
            <!-- Overall Status Banner -->
            <div class="grid grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div>
                    <span class="text-[11px] font-bold text-slate-500 uppercase">Overall Completion</span>
                    <div class="text-3xl font-extrabold text-blue-600 mt-1">{{ $stats['overallProgress'] }}%</div>
                </div>
                <div>
                    <span class="text-[11px] font-bold text-slate-500 uppercase">Total Tasks</span>
                    <div class="text-3xl font-extrabold text-slate-800 mt-1">{{ $stats['totalTasks'] }}</div>
                </div>
                <div>
                    <span class="text-[11px] font-bold text-slate-500 uppercase">Blocked / On Hold</span>
                    <div class="text-3xl font-extrabold {{ $stats['blockedTasks'] > 0 ? 'text-rose-600' : 'text-slate-800' }} mt-1">{{ $stats['blockedTasks'] }}</div>
                </div>
                <div>
                    <span class="text-[11px] font-bold text-slate-500 uppercase">Overdue Tasks</span>
                    <div class="text-3xl font-extrabold {{ $stats['overdue']->count() > 0 ? 'text-amber-600' : 'text-slate-800' }} mt-1">{{ $stats['overdue']->count() }}</div>
                </div>
            </div>

            <!-- Phase Completion Matrix -->
            <div>
                <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Automation Delivery Phases</h3>
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-bold">
                            <tr>
                                <th class="p-3 w-16">Phase</th>
                                <th class="p-3">Phase Scope</th>
                                <th class="p-3 text-center w-24">Tasks</th>
                                <th class="p-3 text-center w-24">Completed</th>
                                <th class="p-3 w-48 text-right">Progress</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            @foreach($phases as $phase)
                                @php
                                    $pTasks = $tasks->where('phase_id', $phase->id);
                                    $pProg = $stats['phaseProgress'][$phase->id] ?? 0;
                                @endphp
                                <tr>
                                    <td class="p-3 font-bold text-slate-700">#{{ $phase->order }}</td>
                                    <td class="p-3">
                                        <div class="font-bold text-slate-900">{{ $phase->name }}</div>
                                        <div class="text-[11px] text-slate-500">{{ $phase->description }}</div>
                                    </td>
                                    <td class="p-3 text-center font-medium">{{ $pTasks->count() }}</td>
                                    <td class="p-3 text-center font-bold text-emerald-600">{{ $pTasks->where('status', 'Completed')->count() }}</td>
                                    <td class="p-3 text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <div class="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                                                <div class="h-2 rounded-full {{ $pProg >= 100 ? 'bg-emerald-500' : 'bg-blue-600' }}" style="width: {{ $pProg }}%"></div>
                                            </div>
                                            <span class="font-bold text-slate-800 w-10">{{ $pProg }}%</span>
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- 2. Phase Breakdown Report -->
        <div id="report-phase" class="report-section space-y-6 hidden">
            @foreach($phases as $phase)
                @php $pTasks = $tasks->where('phase_id', $phase->id)->sortBy('start_date'); @endphp
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                    <div class="bg-slate-100 px-4 py-2.5 font-bold text-xs flex justify-between items-center">
                        <span>Phase {{ $phase->order }}: {{ $phase->name }}</span>
                        <span class="text-blue-600">{{ $stats['phaseProgress'][$phase->id] ?? 0 }}% Complete</span>
                    </div>
                    <table class="w-full text-xs text-left">
                        <thead class="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                            <tr>
                                <th class="p-2.5">Task Title</th>
                                <th class="p-2.5 w-24">Priority</th>
                                <th class="p-2.5 w-28">Status</th>
                                <th class="p-2.5 w-40">Dates</th>
                                <th class="p-2.5 w-24 text-right">Progress</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            @forelse($pTasks as $pt)
                                <tr>
                                    <td class="p-2.5 font-medium {{ $pt->parent_id ? 'pl-6 text-slate-600' : 'font-bold text-slate-900' }}">
                                        {{ $pt->title }}
                                        @if($pt->is_milestone) <span class="text-amber-600 text-[10px] font-bold">◆ Milestone</span> @endif
                                    </td>
                                    <td class="p-2.5">{{ $pt->priority }}</td>
                                    <td class="p-2.5 font-semibold">{{ $pt->status }}</td>
                                    <td class="p-2.5 text-slate-500">{{ $pt->start_date }} → {{ $pt->due_date }}</td>
                                    <td class="p-2.5 text-right font-bold">{{ $pt->progress }}%</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="p-4 text-center text-slate-400">No tasks in this phase.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            @endforeach
        </div>

        <!-- 3. Critical Path & Overdue Issues Report -->
        <div id="report-overdue" class="report-section space-y-6 hidden">
            <!-- Overdue -->
            <div>
                <h3 class="text-sm font-bold text-rose-700 uppercase tracking-wider mb-2">Overdue Tasks</h3>
                <div class="border border-rose-200 rounded-xl overflow-hidden">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-rose-50 text-rose-800 font-bold border-b border-rose-200">
                            <tr>
                                <th class="p-2.5">Task</th>
                                <th class="p-2.5">Due Date</th>
                                <th class="p-2.5">Status</th>
                                <th class="p-2.5">Priority</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            @forelse($stats['overdue'] as $ot)
                                <tr>
                                    <td class="p-2.5 font-bold text-slate-900">{{ $ot->title }}</td>
                                    <td class="p-2.5 text-rose-600 font-bold">{{ $ot->due_date }}</td>
                                    <td class="p-2.5">{{ $ot->status }}</td>
                                    <td class="p-2.5 font-bold">{{ $ot->priority }}</td>
                                </tr>
                            @empty
                                <tr><td colspan="4" class="p-4 text-center text-slate-400">No overdue tasks.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Blocked -->
            <div>
                <h3 class="text-sm font-bold text-amber-700 uppercase tracking-wider mb-2">Blocked / On Hold Tasks</h3>
                <div class="border border-amber-200 rounded-xl overflow-hidden">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-amber-50 text-amber-800 font-bold border-b border-amber-200">
                            <tr>
                                <th class="p-2.5">Task</th>
                                <th class="p-2.5">Phase</th>
                                <th class="p-2.5">Target Due</th>
                                <th class="p-2.5">Notes</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            @forelse($stats['blocked'] as $bt)
                                <tr>
                                    <td class="p-2.5 font-bold text-slate-900">{{ $bt->title }}</td>
                                    <td class="p-2.5">{{ $phases->firstWhere('id', $bt->phase_id)?->name }}</td>
                                    <td class="p-2.5">{{ $bt->due_date }}</td>
                                    <td class="p-2.5 text-slate-500">{{ $bt->internal_notes ?: '—' }}</td>
                                </tr>
                            @empty
                                <tr><td colspan="4" class="p-4 text-center text-slate-400">No blocked tasks.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- 4. Milestones Report -->
        <div id="report-milestones" class="report-section space-y-6 hidden">
            <div>
                <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Project Delivery Checkpoints</h3>
                <div class="border border-slate-200 rounded-xl overflow-hidden">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                            <tr>
                                <th class="p-2.5">Checkpoint / Milestone</th>
                                <th class="p-2.5">Target Date</th>
                                <th class="p-2.5">Phase</th>
                                <th class="p-2.5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            @forelse($stats['milestones'] as $m)
                                <tr>
                                    <td class="p-2.5 font-bold text-slate-900">
                                        {{ $m->title }}
                                        @if($m->milestone_label) <span class="text-slate-500 font-normal">({{ $m->milestone_label }})</span> @endif
                                    </td>
                                    <td class="p-2.5 font-semibold text-slate-700">{{ $m->due_date }}</td>
                                    <td class="p-2.5">{{ $phases->firstWhere('id', $m->phase_id)?->name }}</td>
                                    <td class="p-2.5 text-center">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold {{ $m->status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700' }}">
                                            {{ $m->status }}
                                        </span>
                                    </td>
                                </tr>
                            @empty
                                <tr><td colspan="4" class="p-4 text-center text-slate-400">No milestones designated yet.</td></tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>

</div>

<script>
    function switchReport(type) {
        document.querySelectorAll('.report-section').forEach(sec => sec.classList.add('hidden'));
        const el = document.getElementById('report-' + type);
        if (el) el.classList.remove('hidden');

        const titles = {
            exec: 'EXECUTIVE STATUS REPORT',
            phase: 'PHASE DELIVERY BREAKDOWN',
            overdue: 'CRITICAL PATH & OVERDUE ISSUES',
            milestones: 'MILESTONE CHECKPOINT REPORT'
        };
        document.getElementById('reportTitleBadge').innerText = titles[type] || 'PROJECT REPORT';
    }
</script>
