<!-- Import Project Modal -->
<div id="importModal" class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs hidden flex items-center justify-center p-4 no-print">
    <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 class="text-sm font-bold text-slate-900">Import Project JSON</h3>
            <button onclick="closeImportModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>

        <form action="{{ route('project.import') }}" method="POST" enctype="multipart/form-data" class="p-6 space-y-4 text-xs">
            @csrf
            <div>
                <label class="block font-semibold text-slate-700 mb-2">Select project_data.json file</label>
                <input type="file" name="json_file" accept=".json" required class="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                <p class="text-[11px] text-slate-400 mt-2">Uploading will import phases, tasks, team members, and comments into the SQLite database.</p>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeImportModal()" class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50">Cancel</button>
                <button type="submit" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">Import Now</button>
            </div>
        </form>
    </div>
</div>

<script>
    function openImportModal() {
        document.getElementById('importModal').classList.remove('hidden');
    }
    function closeImportModal() {
        document.getElementById('importModal').classList.add('hidden');
    }
</script>
