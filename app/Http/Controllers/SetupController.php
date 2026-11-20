<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Phase;
use App\Models\TeamUser;
use App\Services\ProjectService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SetupController extends Controller
{
    public function __construct(protected ProjectService $projectService) {}

    public function addPhase(Request $request)
    {
        $project = $this->projectService->getActiveProject();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order' => 'nullable|integer',
        ]);

        $maxOrder = Phase::where('project_id', $project->id)->max('order') ?? 0;

        Phase::create([
            'id' => 'phase-' . Str::uuid(),
            'project_id' => $project->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'order' => $validated['order'] ?? ($maxOrder + 1),
        ]);

        return redirect()->route('project.index', ['tab' => 'setup'])->with('success', 'Phase added.');
    }

    public function deletePhase(string $id)
    {
        Phase::findOrFail($id)->delete();
        return redirect()->route('project.index', ['tab' => 'setup'])->with('success', 'Phase deleted.');
    }

    public function addGroup(Request $request)
    {
        $project = $this->projectService->getActiveProject();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        Group::create([
            'id' => 'group-' . Str::uuid(),
            'project_id' => $project->id,
            'name' => $validated['name'],
        ]);

        return redirect()->route('project.index', ['tab' => 'setup'])->with('success', 'Group added.');
    }

    public function deleteGroup(string $id)
    {
        Group::findOrFail($id)->delete();
        return redirect()->route('project.index', ['tab' => 'setup'])->with('success', 'Group deleted.');
    }

    public function addUser(Request $request)
    {
        $project = $this->projectService->getActiveProject();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'nullable|string|max:255',
            'group_id' => 'nullable|string',
            'email' => 'nullable|email|max:255',
        ]);

        TeamUser::create([
            'id' => 'user-' . Str::uuid(),
            'project_id' => $project->id,
            'name' => $validated['name'],
            'role' => $validated['role'] ?? '',
            'group_id' => $validated['group_id'] ?? null,
            'email' => $validated['email'] ?? '',
            'active' => true,
        ]);

        return redirect()->route('project.index', ['tab' => 'setup'])->with('success', 'Team member added.');
    }

    public function deleteUser(string $id)
    {
        TeamUser::findOrFail($id)->delete();
        return redirect()->route('project.index', ['tab' => 'setup'])->with('success', 'Team member removed.');
    }
}
