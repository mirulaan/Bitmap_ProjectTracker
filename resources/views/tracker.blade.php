@extends('layouts.app')

@section('content')
    @if($tab === 'dashboard')
        @include('tabs.dashboard')
    @elseif($tab === 'tasks')
        @include('tabs.tasks')
    @elseif($tab === 'gantt')
        @include('tabs.gantt')
    @elseif($tab === 'reports')
        @include('tabs.reports')
    @elseif($tab === 'setup')
        @include('tabs.setup')
    @endif
@endsection
