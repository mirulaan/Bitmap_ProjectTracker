<div class="space-y-6">

    <!-- 1. General Project Information -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
                <h2 class="text-base font-bold text-slate-900">Project Metadata & Schedule Window</h2>
                <p class="text-xs text-slate-500">Configure client details, project manager, and project lifecycle boundaries</p>
            </div>
            
            <!-- Reset to Template Button -->
            <form action="{{ route('project.template') }}" method="POST" onsubmit="return confirm('Reset to default automation template? This will replace phases and groups.')">
                @csrf
                <button type="submit" class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition">
                    Load Automation Template
                </button>
            </form>
        </div>

        <form action="{{ route('project.update') }}" method="POST" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            @csrf
            <div>
                <label class="block font-semibold text-slate-700 mb-1">Project Name</label>
                <input type="text" name="name" value="{{ $project->name }}" required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white">
            </div>

            <div>
                <label class="block font-semibold text-slate-700 mb-1">Customer / Client</label>
                <input type="text" name="customer" value="{{ $project->customer }}" placeholder="e.g. Acme Corp" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white">
            </div>

            <div>
                <label class="block font-semibold text-slate-700 mb-1">Project Manager / Coordinator</label>
                <input type="text" name="project_manager" value="{{ $project->project_manager }}" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white">
            </div>

            <div>
                <label class="block font-semibold text-slate-700 mb-1">Project Start Date</label>
                <input type="date" name="start_date" value="{{ $project->start_date }}" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white">
            </div>

            <div>
                <label class="block font-semibold text-slate-700 mb-1">Project Target End Date</label>
                <input type="date" name="end_date" value="{{ $project->end_date }}" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white">
            </div>

            <div class="flex items-end">
                <button type="submit" class="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-sm">
                    Save Project Settings
                </button>
            </div>
        </form>
    </div>

    <!-- 2. Automation Phases Management -->
    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div class="mb-4 pb-3 border-b border-slate-100">
            <h2 class="text-base font-bold text-slate-900">Project Delivery Phases</h2>
            <p class="text-xs text-slate-500">Define milestone delivery phases for mechanical, electrical, software, and commissioning</p>
        </div>

        <div class="overflow-x-auto mb-6">
            <table class="w-full text-xs text-left">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                    <tr>
                        <th class="p-2.5 w-16">Order</th>
                        <th class="p-2.5 w-64">Phase Name</th>
                        <th class="p-2.5">Scope & Deliverables Description</th>
                        <th class="p-2.5 w-24 text-center">Tasks</th>
                        <th class="p-2.5 w-16 text-right">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    @foreach($phases as $phase)
                        <tr>
                            <td class="p-2.5 font-extrabold text-blue-600">#{{ $phase->order }}</td>
                            <td class="p-2.5 font-bold text-slate-900">{{ $phase->name }}</td>
                            <td class="p-2.5 text-slate-500">{{ $phase->description }}</td>
                            <td class="p-2.5 text-center font-semibold text-slate-700">{{ $tasks->where('phase_id', $phase->id)->count() }}</td>
                            <td class="p-2.5 text-right">
                                <form action="{{ route('setup.phases.destroy', $phase->id) }}" method="POST" onsubmit="return confirm('Delete this phase?')" class="inline">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="p-1 rounded hover:bg-rose-50 text-rose-500">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </form>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Add Phase Form -->
        <form action="{{ route('setup.phases.store') }}" method="POST" class="p-4 rounded-xl border border-slate-100 bg-slate-50/70 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-end">
            @csrf
            <div>
                <label class="block font-semibold text-slate-700 mb-1">New Phase Name</label>
                <input type="text" name="name" required placeholder="e.g. Field Acceptance Test (FAT)" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
            </div>
            <div class="md:col-span-2">
                <label class="block font-semibold text-slate-700 mb-1">Deliverables & Scope Description</label>
                <input type="text" name="description" placeholder="Schematics, ladder logic, cycle time signoff..." class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
            </div>
            <div>
                <button type="submit" class="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">
                    + Add Phase
                </button>
            </div>
        </form>
    </div>

    <!-- 3. Two Columns: Groups/Departments & Team Users -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Groups / Functional Departments -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
                <div class="mb-4 pb-3 border-b border-slate-100">
                    <h2 class="text-base font-bold text-slate-900">Functional Engineering Groups</h2>
                    <p class="text-xs text-slate-500">Categories for task ownership and department rollups</p>
                </div>

                <div class="divide-y divide-slate-100 mb-6">
                    @foreach($groups as $group)
                        <div class="py-2.5 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                <span class="text-xs font-bold text-slate-800">{{ $group->name }}</span>
                            </div>
                            <form action="{{ route('setup.groups.destroy', $group->id) }}" method="POST" onsubmit="return confirm('Delete group {{ addslashes($group->name) }}?')" class="inline">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="text-xs text-rose-500 hover:text-rose-700">Delete</button>
                            </form>
                        </div>
                    @endforeach
                </div>
            </div>

            <!-- Add Group Form -->
            <form action="{{ route('setup.groups.store') }}" method="POST" class="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex gap-2 text-xs">
                @csrf
                <input type="text" name="name" required placeholder="New Department / Group name..." class="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                <button type="submit" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Add Group</button>
            </form>
        </div>

        <!-- Team Members Directory -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
                <div class="mb-4 pb-3 border-b border-slate-100">
                    <h2 class="text-base font-bold text-slate-900">Team Directory</h2>
                    <p class="text-xs text-slate-500">Engineers, technicians, and project coordinators</p>
                </div>

                <div class="divide-y divide-slate-100 max-h-60 overflow-y-auto mb-6">
                    @forelse($users as $user)
                        <div class="py-2.5 flex items-center justify-between text-xs">
                            <div>
                                <div class="font-bold text-slate-800">{{ $user->name }}</div>
                                <div class="text-[11px] text-slate-400">{{ $user->role ?: 'Engineer' }} • {{ $user->group?->name ?: 'General' }} • {{ $user->email }}</div>
                            </div>
                            <form action="{{ route('setup.users.destroy', $user->id) }}" method="POST" onsubmit="return confirm('Remove team member?')" class="inline">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="text-xs text-rose-500 hover:text-rose-700">Remove</button>
                            </form>
                        </div>
                    @empty
                        <div class="py-6 text-center text-xs text-slate-400">No team members added yet.</div>
                    @endforelse
                </div>
            </div>

            <!-- Add User Form -->
            <form action="{{ route('setup.users.store') }}" method="POST" class="p-3 rounded-xl border border-slate-100 bg-slate-50/70 grid grid-cols-2 gap-2 text-xs">
                @csrf
                <div>
                    <input type="text" name="name" required placeholder="Full Name" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                </div>
                <div>
                    <input type="text" name="role" placeholder="Role (e.g. PLC Programmer)" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                </div>
                <div>
                    <select name="group_id" class="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white text-xs">
                        <option value="">Select Group...</option>
                        @foreach($groups as $g)
                            <option value="{{ $g->id }}">{{ $g->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <input type="email" name="email" placeholder="Email Address" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                </div>
                <div class="col-span-2">
                    <button type="submit" class="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold">Add Member</button>
                </div>
            </form>
        </div>

    </div>

</div>
