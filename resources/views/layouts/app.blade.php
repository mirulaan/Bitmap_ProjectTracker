<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $project->name ?? 'Bitmap Project Tracker' }}</title>

    <!-- Self-hosted Fonts (Instrument Sans & Plus Jakarta Sans) -->
    <link rel="stylesheet" href="{{ asset('css/fonts.css') }}">

    <!-- Vite compiled styles and scripts -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <!-- Offline Tailwind CSS distribution fallback -->
    <script src="{{ asset('js/tailwindcss.js') }}"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', '"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                    },
                    boxShadow: {
                        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans antialiased min-h-screen flex flex-col">

    <!-- Top Navigation Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
        <div class="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16 gap-4">
                
                <!-- Brand & Project Info -->
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm font-bold text-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="font-bold text-slate-900 text-base leading-tight">{{ $project->name }}</h1>
                            @if($project->customer)
                                <span class="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">{{ $project->customer }}</span>
                            @endif
                        </div>
                        <p class="text-xs text-slate-400">PM: {{ $project->project_manager ?: 'Unassigned' }} • {{ $project->start_date }} to {{ $project->end_date }}</p>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <nav class="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-sm font-medium">
                    <a href="{{ route('project.index', ['tab' => 'dashboard']) }}" class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition {{ $tab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900' }}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                        Dashboard
                    </a>
                    <a href="{{ route('project.index', ['tab' => 'tasks']) }}" class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition {{ $tab === 'tasks' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900' }}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                        Tasks / WBS
                    </a>
                    <a href="{{ route('project.index', ['tab' => 'gantt']) }}" class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition {{ $tab === 'gantt' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900' }}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Gantt
                    </a>
                    <a href="{{ route('project.index', ['tab' => 'reports']) }}" class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition {{ $tab === 'reports' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900' }}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Reports
                    </a>
                    <a href="{{ route('project.index', ['tab' => 'setup']) }}" class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition {{ $tab === 'setup' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900' }}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        Setup
                    </a>
                </nav>

                <!-- Actions: Export, Import, New Task, Storage Indicator -->
                <div class="flex items-center gap-2">
                    <span class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span class="w-2 h-2 rounded-full bg-emerald-500"></span> {{ config('database.default') === 'pgsql' ? 'PostgreSQL' : (config('database.default') === 'sqlite' ? 'SQLite' : ucfirst(config('database.default'))) }} Connected
                    </span>

                    <a href="{{ route('project.export') }}" title="Export project JSON backup" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Export JSON
                    </a>

                    <button onclick="openImportModal()" title="Import existing JSON file" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Import JSON
                    </button>

                    <button onclick="openCreateTaskModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        New Task
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile sub-navigation bar -->
        <div class="md:hidden flex border-t border-slate-200 bg-slate-50 overflow-x-auto px-4 py-2 gap-2 text-xs font-medium">
            <a href="{{ route('project.index', ['tab' => 'dashboard']) }}" class="px-3 py-1 rounded-md {{ $tab === 'dashboard' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600' }}">Dashboard</a>
            <a href="{{ route('project.index', ['tab' => 'tasks']) }}" class="px-3 py-1 rounded-md {{ $tab === 'tasks' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600' }}">Tasks</a>
            <a href="{{ route('project.index', ['tab' => 'gantt']) }}" class="px-3 py-1 rounded-md {{ $tab === 'gantt' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600' }}">Gantt</a>
            <a href="{{ route('project.index', ['tab' => 'reports']) }}" class="px-3 py-1 rounded-md {{ $tab === 'reports' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600' }}">Reports</a>
            <a href="{{ route('project.index', ['tab' => 'setup']) }}" class="px-3 py-1 rounded-md {{ $tab === 'setup' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600' }}">Setup</a>
        </div>
    </header>

    <!-- Flash notifications -->
    @if(session('success'))
        <div class="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 no-print">
            <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-2.5 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>{{ session('success') }}</span>
                </div>
                <button onclick="this.parentElement.remove()" class="text-emerald-500 hover:text-emerald-700">&times;</button>
            </div>
        </div>
    @endif

    @if(session('error'))
        <div class="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 mt-4 no-print">
            <div class="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-2.5 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span>{{ session('error') }}</span>
                </div>
                <button onclick="this.parentElement.remove()" class="text-rose-500 hover:text-rose-700">&times;</button>
            </div>
        </div>
    @endif

    <!-- Main Content Area -->
    <main class="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:max-w-none">
        @yield('content')
    </main>

    <!-- Modals -->
    @include('modals.task_modal')
    @include('modals.import_modal')

    <!-- Global App Scripts -->
    <script>
        const tasksData = @json($tasks);
        const phasesData = @json($phases);
        const groupsData = @json($groups);
        const usersData = @json($users);
        window.taskCommentsAll = @json($comments);
        window.taskAttachmentsAll = @json($attachments);
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        // Quick status updater
        async function updateTaskStatus(taskId, status) {
            try {
                const res = await fetch(`/tasks/${taskId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ status })
                });
                if (res.ok) {
                    window.location.reload();
                } else {
                    alert('Failed to update task status.');
                }
            } catch (err) {
                console.error(err);
                alert('Network error updating status.');
            }
        }
    </script>
</body>
</html>
