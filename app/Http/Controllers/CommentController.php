<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Services\ProjectService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CommentController extends Controller
{
    public function __construct(protected ProjectService $projectService) {}

    public function store(Request $request)
    {
        $project = $this->projectService->getActiveProject();

        $validated = $request->validate([
            'task_id' => 'nullable|string',
            'author' => 'required|string|max:255',
            'text' => 'required|string',
            'type' => 'required|string|in:Note,Progress,Issue,Decision',
        ]);

        $comment = Comment::create([
            'id' => 'comment-' . Str::uuid(),
            'project_id' => $project->id,
            'task_id' => !empty($validated['task_id']) ? $validated['task_id'] : null,
            'author' => $validated['author'],
            'text' => $validated['text'],
            'type' => $validated['type'],
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'comment' => $comment]);
        }

        return redirect()->back()->with('success', 'Comment added.');
    }
}
