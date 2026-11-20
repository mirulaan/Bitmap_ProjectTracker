<?php

use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

// Main Project View
Route::get('/', [ProjectController::class, 'index'])->name('project.index');
Route::post('/project/update', [ProjectController::class, 'update'])->name('project.update');
Route::get('/project/export', [ProjectController::class, 'exportJson'])->name('project.export');
Route::post('/project/import', [ProjectController::class, 'importJson'])->name('project.import');
Route::post('/project/template', [ProjectController::class, 'newFromTemplate'])->name('project.template');

// Tasks
Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
Route::patch('/tasks/{id}/status', [TaskController::class, 'quickStatus'])->name('tasks.quickStatus');
Route::delete('/tasks/{id}', [TaskController::class, 'destroy'])->name('tasks.destroy');

// Setup
Route::post('/setup/phases', [SetupController::class, 'addPhase'])->name('setup.phases.store');
Route::delete('/setup/phases/{id}', [SetupController::class, 'deletePhase'])->name('setup.phases.destroy');
Route::post('/setup/groups', [SetupController::class, 'addGroup'])->name('setup.groups.store');
Route::delete('/setup/groups/{id}', [SetupController::class, 'deleteGroup'])->name('setup.groups.destroy');
Route::post('/setup/users', [SetupController::class, 'addUser'])->name('setup.users.store');
Route::delete('/setup/users/{id}', [SetupController::class, 'deleteUser'])->name('setup.users.destroy');

// Comments
Route::post('/comments', [CommentController::class, 'store'])->name('comments.store');

// Attachments
Route::post('/attachments', [AttachmentController::class, 'store'])->name('attachments.store');
Route::get('/attachments/{id}/download', [AttachmentController::class, 'download'])->name('attachments.download');
Route::delete('/attachments/{id}', [AttachmentController::class, 'destroy'])->name('attachments.destroy');
