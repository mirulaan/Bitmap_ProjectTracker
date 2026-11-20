<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\ProjectService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProjectController extends Controller
{
    public function __construct(protected ProjectService $projectService) {}

    public function index(Request $request)
    {
        $project = $this->projectService->getActiveProject();
        $project->load(['phases', 'groups', 'teamUsers', 'tasks', 'comments', 'attachments']);

        $tab = $request->query('tab', 'dashboard');
        $stats = $this->projectService->computeStats($project);

        // Sorting tasks hierarchically
        $tasks = $project->tasks;
        $phases = $project->phases;
        $groups = $project->groups;
        $users = $project->teamUsers;
        $comments = $project->comments;
        $attachments = $project->attachments;

        return view('tracker', compact(
            'project',
            'tab',
            'stats',
            'tasks',
            'phases',
            'groups',
            'users',
            'comments',
            'attachments'
        ));
    }

    public function update(Request $request)
    {
        $project = $this->projectService->getActiveProject();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'customer' => 'nullable|string|max:255',
            'project_manager' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $project->update($validated);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'project' => $project]);
        }

        return redirect()->route('project.index', ['tab' => 'setup'])->with('success', 'Project details updated successfully.');
    }

    public function exportJson()
    {
        $project = $this->projectService->getActiveProject();
        $data = $this->projectService->exportToJson($project);

        $fileName = 'project_data_' . date('Ymd_His') . '.json';
        return response()->json($data, 200, [
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }

    public function importJson(Request $request)
    {
        $request->validate([
            'json_file' => 'required|file',
        ]);

        $content = file_get_contents($request->file('json_file')->getRealPath());
        $data = json_decode($content, true);

        if (!$data || !isset($data['name'])) {
            return back()->with('error', 'Invalid project JSON format.');
        }

        // Wipe current records and seed new
        $seeder = new DatabaseSeeder();
        $seeder->seedFromData($data);

        return redirect()->route('project.index')->with('success', 'Project imported successfully.');
    }

    public function newFromTemplate()
    {
        $seeder = new DatabaseSeeder();
        $seeder->seedDefaultTemplate();

        return redirect()->route('project.index', ['tab' => 'setup'])->with('success', 'Created project from automation template.');
    }
}
