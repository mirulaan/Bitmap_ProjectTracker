<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('customer')->nullable();
            $table->string('project_manager')->nullable();
            $table->string('start_date')->nullable();
            $table->string('end_date')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('phases', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('project_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('order')->default(1);
            $table->string('start_date')->nullable();
            $table->string('due_date')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('groups', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('project_id');
            $table->string('name');
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('team_users', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('project_id');
            $table->string('name');
            $table->string('role')->nullable();
            $table->string('group_id')->nullable();
            $table->string('email')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('project_id');
            $table->string('phase_id');
            $table->string('parent_id')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('assignee_ids')->nullable();
            $table->json('group_ids')->nullable();
            $table->string('start_date')->nullable();
            $table->string('due_date')->nullable();
            $table->integer('duration_days')->default(0);
            $table->string('status')->default('Not Started');
            $table->integer('progress')->default(0);
            $table->string('priority')->default('Medium');
            $table->json('dependencies')->nullable();
            $table->json('attachment_ids')->nullable();
            $table->boolean('is_milestone')->default(false);
            $table->string('milestone_label')->nullable();
            $table->text('internal_notes')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('comments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('project_id');
            $table->string('task_id')->nullable();
            $table->string('author');
            $table->text('text');
            $table->string('type')->default('Progress');
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });

        Schema::create('attachments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('project_id');
            $table->string('file_name');
            $table->string('stored_path');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('mime_type')->default('application/octet-stream');
            $table->string('uploaded_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('added_by')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('team_users');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('phases');
        Schema::dropIfExists('projects');
    }
};
