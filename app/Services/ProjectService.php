<?php

namespace App\Services;

use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Group;
use App\Models\Phase;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamUser;
use Carbon\Carbon;
use Illuminate\Support\Str;

class ProjectService
{
    public function getActiveProject(): Project
    {
        $project = Project::first();
        if (!$project) {
            $seeder = new \Database\Seeders\DatabaseSeeder();
            $seeder->run();
            $project = Project::first();
        }

        return $project;
    }

    public function computeStats(Project $project): array
    {
        $tasks = $project->tasks()->get();
        $phases = $project->phases()->get();
        $groups = $project->groups()->get();
        $today = Carbon::today()->toDateString();

        $progressMap = $this->buildProgressMap($tasks);

        $rootTasks = $tasks->filter(fn($t) => empty($t->parent_id));
        $overallWeight = 0;
        $overallSum = 0;

        foreach ($rootTasks as $t) {
            $w = max(1, (int)$t->duration_days);
            $overallSum += ($progressMap[$t->id] ?? 0) * $w;
            $overallWeight += $w;
        }

        $overall = $overallWeight > 0
            ? $overallSum / $overallWeight
            : ($tasks->count() > 0 ? $tasks->sum(fn($t) => $progressMap[$t->id] ?? 0) / $tasks->count() : 0);

        $phaseProgress = [];
        foreach ($phases as $phase) {
            $phaseRoots = $rootTasks->filter(fn($t) => $t->phase_id === $phase->id);
            if ($phaseRoots->isNotEmpty()) {
                $pw = 0;
                $psum = 0;
                foreach ($phaseRoots as $pr) {
                    $w = max(1, (int)$pr->duration_days);
                    $psum += ($progressMap[$pr->id] ?? 0) * $w;
                    $pw += $w;
                }
                $phaseProgress[$phase->id] = $pw > 0 ? round($psum / $pw) : 0;
            } else {
                $phaseTasks = $tasks->filter(fn($t) => $t->phase_id === $phase->id);
                $phaseProgress[$phase->id] = $phaseTasks->isNotEmpty()
                    ? round($phaseTasks->avg(fn($t) => $progressMap[$t->id] ?? 0))
                    : 0;
            }
        }

        $overdue = $tasks->filter(function ($t) use ($today) {
            return $t->due_date && $t->due_date < $today && $t->status !== 'Completed';
        })->sortBy('due_date')->values();

        $weekEnd = Carbon::today()->endOfWeek()->toDateString();
        $dueThisWeek = $tasks->filter(function ($t) use ($today, $weekEnd) {
            return $t->due_date && $t->due_date >= $today && $t->due_date <= $weekEnd && $t->status !== 'Completed';
        })->sortBy('due_date')->values();

        $blocked = $tasks->filter(fn($t) => $t->status === 'Blocked / On Hold')->values();

        $milestones = $tasks->filter(fn($t) => $t->is_milestone)->sortBy('due_date')->values();

        $countsByStatus = [
            'Not Started' => $tasks->where('status', 'Not Started')->count(),
            'In Progress' => $tasks->where('status', 'In Progress')->count(),
            'Blocked / On Hold' => $tasks->where('status', 'Blocked / On Hold')->count(),
            'Pending Review' => $tasks->where('status', 'Pending Review')->count(),
            'Completed' => $tasks->where('status', 'Completed')->count(),
        ];

        return [
            'totalTasks' => $tasks->count(),
            'completedTasks' => $countsByStatus['Completed'],
            'inProgressTasks' => $countsByStatus['In Progress'],
            'blockedTasks' => $countsByStatus['Blocked / On Hold'],
            'notStartedTasks' => $countsByStatus['Not Started'],
            'pendingReviewTasks' => $countsByStatus['Pending Review'],
            'overallProgress' => round($overall),
            'progressMap' => $progressMap,
            'phaseProgress' => $phaseProgress,
            'overdue' => $overdue,
            'dueThisWeek' => $dueThisWeek,
            'blocked' => $blocked,
            'milestones' => $milestones,
            'countsByStatus' => $countsByStatus,
        ];
    }

    public function buildProgressMap($tasks): array
    {
        $byId = $tasks->keyBy('id');
        $childrenMap = [];
        foreach ($tasks as $t) {
            $key = $t->parent_id ?: '__root__';
            $childrenMap[$key][] = $t;
        }

        $cache = [];
        $visiting = [];

        $calc = function ($id) use (&$calc, &$cache, &$visiting, $byId, $childrenMap) {
            if (isset($cache[$id])) return $cache[$id];
            if (isset($visiting[$id])) return 0;

            $visiting[$id] = true;
            $task = $byId->get($id);
            if (!$task) {
                unset($visiting[$id]);
                return 0;
            }

            $children = $childrenMap[$id] ?? [];
            if (empty($children)) {
                $res = max(0, min(100, (int)$task->progress));
            } else {
                $totalW = 0;
                $sumW = 0;
                foreach ($children as $c) {
                    $cp = $calc($c->id);
                    $w = max(1, (int)$c->duration_days);
                    $sumW += $cp * $w;
                    $totalW += $w;
                }
                $res = $totalW > 0 ? $sumW / $totalW : 0;
            }

            $cache[$id] = $res;
            unset($visiting[$id]);
            return $res;
        };

        foreach ($tasks as $t) {
            $calc($t->id);
        }

        return $cache;
    }

    public function exportToJson(Project $project): array
    {
        $project->load(['phases', 'groups', 'teamUsers', 'tasks', 'comments', 'attachments']);

        return [
            'id' => $project->id,
            'name' => $project->name,
            'customer' => $project->customer ?? '',
            'projectManager' => $project->project_manager ?? '',
            'startDate' => $project->start_date ?? date('Y-m-d'),
            'endDate' => $project->end_date ?? date('Y-m-d', strtotime('+3 months')),
            'phases' => $project->phases->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description ?? '',
                'order' => $p->order,
                'startDate' => $p->start_date,
                'dueDate' => $p->due_date,
            ])->values()->all(),
            'tasks' => $project->tasks->map(fn($t) => [
                'id' => $t->id,
                'phaseId' => $t->phase_id,
                'parentId' => $t->parent_id,
                'title' => $t->title,
                'description' => $t->description ?? '',
                'assigneeIds' => $t->assignee_ids ?? [],
                'groupIds' => $t->group_ids ?? [],
                'startDate' => $t->start_date,
                'dueDate' => $t->due_date,
                'durationDays' => $t->duration_days,
                'status' => $t->status,
                'progress' => $t->progress,
                'priority' => $t->priority,
                'dependencies' => $t->dependencies ?? [],
                'comments' => [],
                'attachments' => [],
                'attachmentIds' => $t->attachment_ids ?? [],
                'isMilestone' => (bool)$t->is_milestone,
                'milestoneLabel' => $t->milestone_label ?? '',
                'internalNotes' => $t->internal_notes ?? '',
                'createdAt' => $t->created_at?->toIso8601String() ?? now()->toIso8601String(),
                'updatedAt' => $t->updated_at?->toIso8601String() ?? now()->toIso8601String(),
            ])->values()->all(),
            'users' => $project->teamUsers->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'role' => $u->role ?? '',
                'groupId' => $u->group_id ?? '',
                'email' => $u->email ?? '',
                'active' => (bool)$u->active,
            ])->values()->all(),
            'groups' => $project->groups->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
            ])->values()->all(),
            'comments' => $project->comments->map(fn($c) => [
                'id' => $c->id,
                'taskId' => $c->task_id,
                'author' => $c->author,
                'text' => $c->text,
                'type' => $c->type,
                'createdAt' => $c->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ])->values()->all(),
            'attachmentRegistry' => $project->attachments->map(fn($a) => [
                'id' => $a->id,
                'fileName' => $a->file_name,
                'storedPath' => $a->stored_path,
                'fileSize' => $a->file_size,
                'mimeType' => $a->mime_type,
                'uploadedDate' => $a->uploaded_date ?? now()->toIso8601String(),
                'notes' => $a->notes ?? '',
                'addedBy' => $a->added_by ?? '',
            ])->values()->all(),
            'settings' => $project->settings ?? ['autoSave' => true],
        ];
    }
}
