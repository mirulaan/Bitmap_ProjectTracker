<!-- Task Editor Modal -->
<div id="taskModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs hidden flex items-center justify-center p-4 overflow-y-auto no-print">
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
                <h3 class="text-base font-bold text-slate-900" id="taskModalTitle">Task Editor</h3>
                <p class="text-xs text-slate-500">Configure task scope, dates, assignments, and dependencies</p>
            </div>
            <button onclick="closeTaskModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none p-1">&times;</button>
        </div>

        <!-- Tab Switcher inside Modal -->
        <div class="flex border-b border-slate-200 bg-white px-6 text-xs font-semibold">
            <button onclick="switchTaskModalTab('details')" id="btnTabDetails" class="py-2.5 px-3 border-b-2 border-blue-600 text-blue-600 transition">Task Details</button>
            <button onclick="switchTaskModalTab('comments')" id="btnTabComments" class="py-2.5 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition">Comments & Updates</button>
            <button onclick="switchTaskModalTab('attachments')" id="btnTabAttachments" class="py-2.5 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition">File Attachments</button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto flex-1">
            
            <!-- 1. Task Details Tab -->
            <form id="taskDetailsForm" action="{{ route('tasks.store') }}" method="POST" class="space-y-4">
                @csrf
                <input type="hidden" name="id" id="task_id" value="">

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <!-- Phase Selection -->
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Phase</label>
                        <select name="phase_id" id="task_phase_id" required class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                            @foreach($phases as $p)
                                <option value="{{ $p->id }}">{{ $p->name }}</option>
                            @endforeach
                        </select>
                    </div>

                    <!-- Parent Task (Hierarchical) -->
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Parent Task (Optional)</label>
                        <select name="parent_id" id="task_parent_id" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                            <option value="">None (Top-Level Task)</option>
                            @foreach($tasks as $t)
                                <option value="{{ $t->id }}">{{ $t->title }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>

                <!-- Title -->
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                    <input type="text" name="title" id="task_title" required placeholder="e.g. PLC Safety Circuit Review" class="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                </div>

                <!-- Description -->
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Scope & Description</label>
                    <textarea name="description" id="task_description" rows="2" placeholder="Details and technical criteria..." class="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea>
                </div>

                <!-- Dates & Duration -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Start Date</label>
                        <input type="date" name="start_date" id="task_start_date" onchange="recalculateDueDate()" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Duration (Days)</label>
                        <input type="number" name="duration_days" id="task_duration_days" min="0" value="1" onchange="recalculateDueDate()" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Target Due Date</label>
                        <input type="date" name="due_date" id="task_due_date" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                    </div>
                </div>

                <!-- Status, Priority, Progress -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Status</label>
                        <select name="status" id="task_status" onchange="syncProgressFromStatus(this.value)" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Blocked / On Hold">Blocked / On Hold</option>
                            <option value="Pending Review">Pending Review</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>

                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Priority</label>
                        <select name="priority" id="task_priority" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                            <option value="Low">Low</option>
                            <option value="Medium" selected>Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>

                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <label class="font-semibold text-slate-700">Progress</label>
                            <span id="task_progress_display" class="font-bold text-blue-600">0%</span>
                        </div>
                        <input type="range" name="progress" id="task_progress" min="0" max="100" value="0" oninput="document.getElementById('task_progress_display').innerText = this.value + '%'" class="w-full">
                    </div>
                </div>

                <!-- Group & Assignee Selection -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Responsible Groups</label>
                        <div class="max-h-28 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1">
                            @foreach($groups as $g)
                                <label class="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" name="group_ids[]" value="{{ $g->id }}" class="group-checkbox rounded border-slate-300 text-blue-600">
                                    <span>{{ $g->name }}</span>
                                </label>
                            @endforeach
                        </div>
                    </div>

                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Assigned Team Members</label>
                        <div class="max-h-28 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 space-y-1">
                            @forelse($users as $u)
                                <label class="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" name="assignee_ids[]" value="{{ $u->id }}" class="assignee-checkbox rounded border-slate-300 text-blue-600">
                                    <span>{{ $u->name }} ({{ $u->role ?: 'Engineer' }})</span>
                                </label>
                            @empty
                                <div class="text-slate-400 py-1">No users defined. Add team members in Setup.</div>
                            @endforelse
                        </div>
                    </div>
                </div>

                <!-- Milestone Settings -->
                <div class="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
                    <label class="flex items-center gap-2 font-bold text-amber-900 cursor-pointer">
                        <input type="checkbox" name="is_milestone" id="task_is_milestone" value="1" class="rounded border-amber-300 text-amber-600">
                        <span>Mark as Key Milestone Checkpoint</span>
                    </label>
                    <input type="text" name="milestone_label" id="task_milestone_label" placeholder="e.g. M1: Drawing Sign-Off" class="w-64 text-xs px-2.5 py-1 border border-amber-200 rounded-lg bg-white">
                </div>

                <!-- Internal Notes -->
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">Internal Notes & Remarks</label>
                    <textarea name="internal_notes" id="task_internal_notes" rows="2" placeholder="Blocker reasons, vendor parts status..." class="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea>
                </div>

                <!-- Modal Footer -->
                <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                    <button type="button" onclick="closeTaskModal()" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold">Cancel</button>
                    <button type="submit" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">Save Task</button>
                </div>
            </form>

            <!-- 2. Task Comments Tab -->
            <div id="taskCommentsTab" class="hidden space-y-4">
                <form action="{{ route('comments.store') }}" method="POST" class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    @csrf
                    <input type="hidden" name="task_id" id="comment_task_id" value="">
                    <div class="grid grid-cols-2 gap-2">
                        <input type="text" name="author" value="{{ $project->project_manager ?: 'Coordinator' }}" required placeholder="Author" class="px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                        <select name="type" class="px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                            <option value="Progress">Progress</option>
                            <option value="Issue">Issue / Risk</option>
                            <option value="Decision">Decision</option>
                            <option value="Note">Note</option>
                        </select>
                    </div>
                    <textarea name="text" rows="2" required placeholder="Add note to this task..." class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"></textarea>
                    <button type="submit" class="w-full py-1.5 rounded-lg bg-blue-600 text-white font-semibold">Post Task Comment</button>
                </form>

                <div class="divide-y divide-slate-100" id="taskCommentsList">
                    <!-- Loaded dynamically by JS -->
                </div>
            </div>

            <!-- 3. Task Attachments Tab -->
            <div id="taskAttachmentsTab" class="hidden space-y-4">
                <form action="{{ route('attachments.store') }}" method="POST" enctype="multipart/form-data" class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    @csrf
                    <input type="hidden" name="task_id" id="attachment_task_id" value="">
                    <div>
                        <label class="block font-semibold mb-1">Select File</label>
                        <input type="file" name="file" required class="w-full text-xs">
                    </div>
                    <div>
                        <input type="text" name="notes" placeholder="Attachment notes (e.g. Electrical schematics v2)" class="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white">
                    </div>
                    <button type="submit" class="w-full py-1.5 rounded-lg bg-blue-600 text-white font-semibold">Upload File</button>
                </form>

                <div class="divide-y divide-slate-100" id="taskAttachmentsList">
                    <!-- Loaded dynamically by JS -->
                </div>
            </div>

        </div>

    </div>
</div>

<script>
    function openCreateTaskModal(phaseId = null) {
        document.getElementById('taskModalTitle').innerText = 'Create New Task';
        document.getElementById('task_id').value = '';
        document.getElementById('task_title').value = '';
        document.getElementById('task_description').value = '';
        document.getElementById('task_status').value = 'Not Started';
        document.getElementById('task_priority').value = 'Medium';
        document.getElementById('task_progress').value = 0;
        document.getElementById('task_progress_display').innerText = '0%';
        document.getElementById('task_is_milestone').checked = false;
        document.getElementById('task_milestone_label').value = '';
        document.getElementById('task_internal_notes').value = '';
        document.getElementById('task_parent_id').value = '';

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('task_start_date').value = today;
        document.getElementById('task_duration_days').value = 1;
        document.getElementById('task_due_date').value = today;

        if (phaseId) {
            document.getElementById('task_phase_id').value = phaseId;
        }

        document.querySelectorAll('.group-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.assignee-checkbox').forEach(cb => cb.checked = false);

        switchTaskModalTab('details');
        document.getElementById('taskModal').classList.remove('hidden');
    }

    function openCreateSubtaskModal(phaseId, parentId) {
        openCreateTaskModal(phaseId);
        document.getElementById('taskModalTitle').innerText = 'Create Subtask';
        document.getElementById('task_parent_id').value = parentId;
    }

    function editTask(taskId) {
        const task = tasksData.find(t => t.id === taskId);
        if (!task) return;

        document.getElementById('taskModalTitle').innerText = 'Edit Task: ' + task.title;
        document.getElementById('task_id').value = task.id;
        document.getElementById('task_phase_id').value = task.phase_id;
        document.getElementById('task_parent_id').value = task.parent_id || '';
        document.getElementById('task_title').value = task.title;
        document.getElementById('task_description').value = task.description || '';
        document.getElementById('task_start_date').value = task.start_date || '';
        document.getElementById('task_due_date').value = task.due_date || '';
        document.getElementById('task_duration_days').value = task.duration_days || 1;
        document.getElementById('task_status').value = task.status || 'Not Started';
        document.getElementById('task_priority').value = task.priority || 'Medium';
        document.getElementById('task_progress').value = task.progress || 0;
        document.getElementById('task_progress_display').innerText = (task.progress || 0) + '%';
        document.getElementById('task_is_milestone').checked = Boolean(task.is_milestone);
        document.getElementById('task_milestone_label').value = task.milestone_label || '';
        document.getElementById('task_internal_notes').value = task.internal_notes || '';

        // Checkboxes
        const taskGroups = task.group_ids || [];
        document.querySelectorAll('.group-checkbox').forEach(cb => {
            cb.checked = taskGroups.includes(cb.value);
        });

        const taskAssignees = task.assignee_ids || [];
        document.querySelectorAll('.assignee-checkbox').forEach(cb => {
            cb.checked = taskAssignees.includes(cb.value);
        });

        // Set IDs for comments and attachments tabs
        document.getElementById('comment_task_id').value = task.id;
        document.getElementById('attachment_task_id').value = task.id;

        // Render task comments
        const commentsList = document.getElementById('taskCommentsList');
        const taskComments = (window.taskCommentsAll || []).filter(c => c.task_id === task.id);
        if (taskComments.length === 0) {
            commentsList.innerHTML = '<div class="py-4 text-center text-xs text-slate-400">No comments on this task yet.</div>';
        } else {
            commentsList.innerHTML = taskComments.map(c => `
                <div class="py-2.5 text-xs">
                    <div class="flex items-center justify-between font-bold text-slate-800">
                        <span>${c.author} <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-normal">${c.type}</span></span>
                        <span class="text-[10px] text-slate-400 font-normal">${new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p class="text-slate-600 mt-1">${c.text}</p>
                </div>
            `).join('');
        }

        // Render task attachments
        const attachmentsList = document.getElementById('taskAttachmentsList');
        const taskAttIds = task.attachment_ids || [];
        const taskAttachments = (window.taskAttachmentsAll || []).filter(a => taskAttIds.includes(a.id));
        if (taskAttachments.length === 0) {
            attachmentsList.innerHTML = '<div class="py-4 text-center text-xs text-slate-400">No attachments on this task.</div>';
        } else {
            attachmentsList.innerHTML = taskAttachments.map(a => `
                <div class="py-2.5 flex items-center justify-between text-xs">
                    <div>
                        <a href="/attachments/${a.id}/download" class="font-bold text-blue-600 hover:underline">${a.file_name}</a>
                        <p class="text-[10px] text-slate-400">${(a.file_size / 1024).toFixed(1)} KB • ${a.notes || 'No description'}</p>
                    </div>
                    <form action="/attachments/${a.id}" method="POST" onsubmit="return confirm('Delete attachment?')" class="inline">
                        <input type="hidden" name="_token" value="${csrfToken}">
                        <input type="hidden" name="_method" value="DELETE">
                        <button type="submit" class="text-rose-500 hover:text-rose-700 text-xs font-semibold">Delete</button>
                    </form>
                </div>
            `).join('');
        }

        switchTaskModalTab('details');
        document.getElementById('taskModal').classList.remove('hidden');
    }

    function closeTaskModal() {
        document.getElementById('taskModal').classList.add('hidden');
    }

    function switchTaskModalTab(tab) {
        document.getElementById('taskDetailsForm').classList.toggle('hidden', tab !== 'details');
        document.getElementById('taskCommentsTab').classList.toggle('hidden', tab !== 'comments');
        document.getElementById('taskAttachmentsTab').classList.toggle('hidden', tab !== 'attachments');

        ['Details', 'Comments', 'Attachments'].forEach(t => {
            const btn = document.getElementById('btnTab' + t);
            if (t.toLowerCase() === tab) {
                btn.className = 'py-2.5 px-3 border-b-2 border-blue-600 text-blue-600 transition';
            } else {
                btn.className = 'py-2.5 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition';
            }
        });
    }

    function recalculateDueDate() {
        const startVal = document.getElementById('task_start_date').value;
        const durVal = parseInt(document.getElementById('task_duration_days').value, 10) || 0;
        if (startVal) {
            const d = new Date(startVal);
            d.setDate(d.getDate() + durVal);
            document.getElementById('task_due_date').value = d.toISOString().split('T')[0];
        }
    }

    function syncProgressFromStatus(status) {
        if (status === 'Completed') {
            document.getElementById('task_progress').value = 100;
            document.getElementById('task_progress_display').innerText = '100%';
        } else if (status === 'Not Started') {
            document.getElementById('task_progress').value = 0;
            document.getElementById('task_progress_display').innerText = '0%';
        }
    }
</script>
