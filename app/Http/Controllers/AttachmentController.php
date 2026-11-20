<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Task;
use App\Services\ProjectService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttachmentController extends Controller
{
    public function __construct(protected ProjectService $projectService) {}

    public function store(Request $request)
    {
        $project = $this->projectService->getActiveProject();

        $request->validate([
            'file' => 'required|file|max:51200', // 50MB
            'task_id' => 'nullable|string',
            'notes' => 'nullable|string',
            'added_by' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $id = 'att-' . Str::uuid();
        $storedName = $id . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('attachments', $storedName, 'public');

        $attachment = Attachment::create([
            'id' => $id,
            'project_id' => $project->id,
            'file_name' => $file->getClientOriginalName(),
            'stored_path' => 'storage/' . $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'uploaded_date' => now()->toIso8601String(),
            'notes' => $request->input('notes', ''),
            'added_by' => $request->input('added_by', 'User'),
        ]);

        // If taskId provided, add attachment id to task's attachment_ids array
        $taskId = $request->input('task_id');
        if ($taskId) {
            $task = Task::find($taskId);
            if ($task) {
                $ids = $task->attachment_ids ?: [];
                $ids[] = $id;
                $task->attachment_ids = array_values(array_unique($ids));
                $task->save();
            }
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'attachment' => $attachment]);
        }

        return redirect()->back()->with('success', 'File attached successfully.');
    }

    public function download(string $id)
    {
        $attachment = Attachment::findOrFail($id);
        $relativePath = str_replace('storage/', '', $attachment->stored_path);

        if (Storage::disk('public')->exists($relativePath)) {
            return Storage::disk('public')->download($relativePath, $attachment->file_name);
        }

        // Check local attachments folder fallback
        $localPath = public_path($attachment->stored_path);
        if (file_exists($localPath)) {
            return response()->download($localPath, $attachment->file_name);
        }

        return back()->with('error', 'File not found on server.');
    }

    public function destroy(string $id)
    {
        $attachment = Attachment::findOrFail($id);
        $relativePath = str_replace('storage/', '', $attachment->stored_path);

        Storage::disk('public')->delete($relativePath);

        // Remove from task attachment_ids
        $tasks = Task::where('project_id', $attachment->project_id)->get();
        foreach ($tasks as $t) {
            if ($t->attachment_ids && in_array($id, $t->attachment_ids)) {
                $t->attachment_ids = array_values(array_diff($t->attachment_ids, [$id]));
                $t->save();
            }
        }

        $attachment->delete();

        return redirect()->back()->with('success', 'Attachment deleted.');
    }
}
