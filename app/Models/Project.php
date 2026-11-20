<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'customer',
        'project_manager',
        'start_date',
        'end_date',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    public function phases(): HasMany
    {
        return $this->hasMany(Phase::class)->orderBy('order');
    }

    public function groups(): HasMany
    {
        return $this->hasMany(Group::class)->orderBy('name');
    }

    public function teamUsers(): HasMany
    {
        return $this->hasMany(TeamUser::class)->orderBy('name');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->orderBy('start_date');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class)->latest();
    }
}
