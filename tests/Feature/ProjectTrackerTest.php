<?php

namespace Tests\Feature;

use App\Models\Phase;
use App\Models\Project;
use App\Models\Task;
use Tests\TestCase;

class ProjectTrackerTest extends TestCase
{
    public function test_all_tabs_render_successfully(): void
    {
        foreach (['dashboard', 'tasks', 'gantt', 'reports', 'setup'] as $tab) {
            $response = $this->get('/?tab=' . $tab);
            $response->assertStatus(200);
            $response->assertSee('Bitmap_ProjectTracker');
        }
    }

    public function test_export_json_returns_valid_project_data(): void
    {
        $response = $this->get('/project/export');
        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition');

        $data = $response->json();
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('phases', $data);
        $this->assertArrayHasKey('tasks', $data);
        $this->assertArrayHasKey('groups', $data);
    }

    public function test_task_lifecycle_store_update_delete(): void
    {
        $phase = Phase::first();
        $this->assertNotNull($phase);

        // 1. Create task
        $storeResponse = $this->post('/tasks', [
            'phase_id' => $phase->id,
            'title' => 'Automated Integration Test Task',
            'status' => 'In Progress',
            'progress' => 25,
            'priority' => 'High',
            'duration_days' => 3,
        ]);
        $storeResponse->assertRedirect();

        $task = Task::where('title', 'Automated Integration Test Task')->first();
        $this->assertNotNull($task);
        $this->assertEquals(25, $task->progress);
        $this->assertEquals('In Progress', $task->status);

        // 2. Quick status update
        $statusResponse = $this->patch('/tasks/' . $task->id . '/status', [
            'status' => 'Completed',
        ]);
        $statusResponse->assertRedirect();

        $task->refresh();
        $this->assertEquals('Completed', $task->status);
        $this->assertEquals(100, $task->progress);

        // 3. Delete task
        $deleteResponse = $this->delete('/tasks/' . $task->id);
        $deleteResponse->assertRedirect();

        $this->assertNull(Task::find($task->id));
    }
}
