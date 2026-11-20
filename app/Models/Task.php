<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'project_id',
        'phase_id',
        'parent_id',
        'title',
        'description',
        'assignee_ids',
        'group_ids',
        'start_date',
        'due_date',
        'duration_days',
        'status',
        'progress',
        'priority',
        'dependencies',
        'attachment_ids',
        'is_milestone',
        'milestone_label',
        'internal_notes',
    ];

    protected $casts = [
        'assignee_ids' => 'array',
        'group_ids' => 'array',
        'dependencies' => 'array',
        'attachment_ids' => 'array',
        'is_milestone' => 'boolean',
        'progress' => 'integer',
        'duration_days' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function phase(): BelongsTo
    {
        return $this->belongsTo(Phase::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_id', 'id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_id', 'id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'task_id', 'id');
    }
}
