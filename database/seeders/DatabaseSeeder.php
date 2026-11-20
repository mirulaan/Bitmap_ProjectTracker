<?php

namespace Database\Seeders;

use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Group;
use App\Models\Phase;
use App\Models\Project;
use App\Models\Task;
use App\Models\TeamUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = base_path('project_data.json');
        if (file_exists($jsonPath)) {
            $data = json_decode(file_get_contents($jsonPath), true);
            if ($data && !empty($data['id'])) {
                $this->seedFromData($data);
                return;
            }
        }

        $this->seedDefaultTemplate();
    }

    public function seedFromData(array $data): void
    {
        $project = Project::updateOrCreate(
            ['id' => $data['id']],
            [
                'name' => $data['name'] ?? 'Bitmap_ProjectTracker',
                'customer' => $data['customer'] ?? '',
                'project_manager' => $data['projectManager'] ?? 'Project Manager',
                'start_date' => $data['startDate'] ?? date('Y-m-d'),
                'end_date' => $data['endDate'] ?? date('Y-m-d', strtotime('+3 months')),
                'settings' => $data['settings'] ?? ['autoSave' => true],
            ]
        );

        if (!empty($data['groups'])) {
            foreach ($data['groups'] as $g) {
                Group::updateOrCreate(
                    ['id' => $g['id'], 'project_id' => $project->id],
                    ['name' => $g['name']]
                );
            }
        }

        if (!empty($data['phases'])) {
            foreach ($data['phases'] as $p) {
                Phase::updateOrCreate(
                    ['id' => $p['id'], 'project_id' => $project->id],
                    [
                        'name' => $p['name'],
                        'description' => $p['description'] ?? '',
                        'order' => $p['order'] ?? 1,
                        'start_date' => $p['startDate'] ?? null,
                        'due_date' => $p['dueDate'] ?? null,
                    ]
                );
            }
        }

        if (!empty($data['users'])) {
            foreach ($data['users'] as $u) {
                TeamUser::updateOrCreate(
                    ['id' => $u['id'], 'project_id' => $project->id],
                    [
                        'name' => $u['name'],
                        'role' => $u['role'] ?? '',
                        'group_id' => $u['groupId'] ?? null,
                        'email' => $u['email'] ?? '',
                        'active' => $u['active'] ?? true,
                    ]
                );
            }
        }

        if (!empty($data['tasks'])) {
            foreach ($data['tasks'] as $t) {
                Task::updateOrCreate(
                    ['id' => $t['id'], 'project_id' => $project->id],
                    [
                        'phase_id' => $t['phaseId'],
                        'parent_id' => $t['parentId'] ?? null,
                        'title' => $t['title'],
                        'description' => $t['description'] ?? '',
                        'assignee_ids' => $t['assigneeIds'] ?? [],
                        'group_ids' => $t['groupIds'] ?? [],
                        'start_date' => $t['startDate'] ?? null,
                        'due_date' => $t['dueDate'] ?? null,
                        'duration_days' => $t['durationDays'] ?? 0,
                        'status' => $t['status'] ?? 'Not Started',
                        'progress' => $t['progress'] ?? 0,
                        'priority' => $t['priority'] ?? 'Medium',
                        'dependencies' => $t['dependencies'] ?? [],
                        'attachment_ids' => $t['attachmentIds'] ?? [],
                        'is_milestone' => $t['isMilestone'] ?? false,
                        'milestone_label' => $t['milestoneLabel'] ?? null,
                        'internal_notes' => $t['internalNotes'] ?? null,
                    ]
                );
            }
        }

        if (!empty($data['comments'])) {
            foreach ($data['comments'] as $c) {
                Comment::updateOrCreate(
                    ['id' => $c['id'], 'project_id' => $project->id],
                    [
                        'task_id' => $c['taskId'] ?? null,
                        'author' => $c['author'] ?? 'Coordinator',
                        'text' => $c['text'] ?? '',
                        'type' => $c['type'] ?? 'Progress',
                    ]
                );
            }
        }

        if (!empty($data['attachmentRegistry'])) {
            foreach ($data['attachmentRegistry'] as $a) {
                Attachment::updateOrCreate(
                    ['id' => $a['id'], 'project_id' => $project->id],
                    [
                        'file_name' => $a['fileName'] ?? 'file',
                        'stored_path' => $a['storedPath'] ?? '',
                        'file_size' => $a['fileSize'] ?? 0,
                        'mime_type' => $a['mimeType'] ?? 'application/octet-stream',
                        'uploaded_date' => $a['uploadedDate'] ?? now()->toIso8601String(),
                        'notes' => $a['notes'] ?? '',
                        'added_by' => $a['addedBy'] ?? '',
                    ]
                );
            }
        }
    }

    public function seedDefaultTemplate(): void
    {
        $projectId = 'project-' . Str::uuid();
        $project = Project::create([
            'id' => $projectId,
            'name' => 'Automation Project Tracker',
            'customer' => 'Industrial Automation Client',
            'project_manager' => 'Project Lead',
            'start_date' => date('Y-m-d'),
            'end_date' => date('Y-m-d', strtotime('+4 months')),
            'settings' => ['autoSave' => true],
        ]);

        $groups = [
            ['id' => 'group-mechanical', 'name' => 'Mechanical'],
            ['id' => 'group-electrical', 'name' => 'Electrical'],
            ['id' => 'group-plc', 'name' => 'PLC Team'],
            ['id' => 'group-vision', 'name' => 'Vision / Software Team'],
            ['id' => 'group-project-management', 'name' => 'Project Management'],
            ['id' => 'group-quality', 'name' => 'Quality / Commissioning'],
        ];
        foreach ($groups as $g) {
            Group::create(array_merge($g, ['project_id' => $project->id]));
        }

        $phases = [
            ['id' => 'phase-1', 'order' => 1, 'name' => 'System Design & Procurement', 'description' => 'Electrical schematics, mechanical BOM, long-lead hardware.'],
            ['id' => 'phase-2', 'order' => 2, 'name' => 'Panel Wiring & Mechanical Assembly', 'description' => 'Control panel build, vision rig assembly, sensor mounting.'],
            ['id' => 'phase-3', 'order' => 3, 'name' => 'Software & PLC Development', 'description' => 'PLC ladder / structured text, HMI screens, PC vision software.'],
            ['id' => 'phase-4', 'order' => 4, 'name' => 'Internal Integration & FAT', 'description' => 'Dry run, cycle time verification, debugging, FAT.'],
            ['id' => 'phase-5', 'order' => 5, 'name' => 'Onsite Installation & Commissioning', 'description' => 'Delivery, mechanical/electrical hookup at client site.'],
            ['id' => 'phase-6', 'order' => 6, 'name' => 'SAT & Final Buyoff', 'description' => 'Production run validation, operator training, handover sign-off.'],
        ];
        foreach ($phases as $p) {
            Phase::create(array_merge($p, ['project_id' => $project->id]));
        }
    }
}
