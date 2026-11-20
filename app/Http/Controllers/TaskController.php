<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Services\ProjectService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TaskController extends Controller
{
    public function __construct(protected ProjectService $projectService) {}

    public function store(Request $request)
    {
        $project = $this->projectService->getActiveProject();

        $validated = $request->validate([
            'id' => 'nullable|string',
            'phase_id' => 'required|string',
            'parent_id' => 'nullable|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assignee_ids' => 'nullable|array',
            'group_ids' => 'nullable|array',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'duration_days' => 'nullable|integer|min:0',
            'status' => 'nullable|string',
            'progress' => 'nullable|integer|min:0|max:100',
            'priority' => 'nullable|string',
            'dependencies' => 'nullable|array',
            'is_milestone' => 'nullable|boolean',
            'milestone_label' => 'nullable|string',
            'internal_notes' => 'nullable|string',
        ]);

        $id = $validated['id'] ?? ('task-' . Str::uuid());
        $isMilestone = $request->boolean('is_milestone');

        $status = $validated['status'] ?? 'Not Started';
        $progress = (int)($validated['progress'] ?? 0);
        if ($status === 'Completed' && $progress < 100) {
            $progress = 100;
        } elseif ($progress === 100 && $status !== 'Completed') {
            $status = 'Completed';
        }

        $startDate = $validated['start_date'] ?? date('Y-m-d');
        $duration = (int)($validated['duration_days'] ?? 1);
        $dueDate = $validated['due_date'] ?? date('Y-m-d', strtotime("+$duration days", strtotime($startDate)));

        if (!empty($validated['start_date']) && !empty($validated['due_date'])) {
            $calcDuration = (int)round((strtotime($validated['due_date']) - strtotime($validated['start_date'])) / 86400);
            if ($calcDuration >= 0) {
                $duration = $calcDuration;
            }
        }

        $task = Task::updateOrCreate(
            ['id' => $id],
            [
                'project_id' => $project->id,
                'phase_id' => $validated['phase_id'],
                'parent_id' => !empty($validated['parent_id']) ? $validated['parent_id'] : null,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? '',
                'assignee_ids' => $validated['assignee_ids'] ?? [],
                'group_ids' => $validated['group_ids'] ?? [],
                'start_date' => $startDate,
                'due_date' => $dueDate,
                'duration_days' => $duration,
                'status' => $status,
                'progress' => $progress,
                'priority' => $validated['priority'] ?? 'Medium',
                'dependencies' => $validated['dependencies'] ?? [],
                'is_milestone' => $isMilestone,
                'milestone_label' => $validated['milestone_label'] ?? null,
                'internal_notes' => $validated['internal_notes'] ?? null,
            ]
        );

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'task' => $task]);
        }

        return redirect()->back()->with('success', 'Task saved successfully.');
    }

    public function quickStatus(Request $request, string $id)
    {
        $task = Task::findOrFail($id);
        $status = $request->input('status');

        $task->status = $status;
        if ($status === 'Completed') {
            $task->progress = 100;
        } elseif ($status === 'Not Started') {
            $task->progress = 0;
        } elseif ($status === 'In Progress' && $task->progress === 0) {
            $task->progress = 10;
        }
        $task->save();

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'task' => $task]);
        }

        return redirect()->back()->with('success', 'Status updated.');
    }

    public function destroy(string $id)
    {
        $task = Task::findOrFail($id);

        // Reparent children to parent
        Task::where('parent_id', $task->id)->update(['parent_id' => $task->parent_id]);

        $task->delete();

        return redirect()->back()->with('success', 'Task removed.');
    }
}
