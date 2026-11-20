<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'project_id',
        'file_name',
        'stored_path',
        'file_size',
        'mime_type',
        'uploaded_date',
        'notes',
        'added_by',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
