import React, { useState } from 'react';
import { useJointStore } from '../store/useJointStore';
import { MaintenancePriority } from '../types/maintenance';
import { formatDateTimeString, exportToCsv } from '../lib/formatters';
import {
  ClipboardList,
  PlusCircle,
  Download,
  Printer,
  Trash2,
  Wrench,
  Calendar,
  User,
  X
} from 'lucide-react';

export const MaintenanceRecordsPage: React.FC = () => {
  const { maintenanceRecords, addMaintenanceRecord, deleteMaintenanceRecord, currentPoint } =
    useJointStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    inspectorName: 'EEE Capstone Student',
    priorityAtService: 'P4_ROUTINE' as MaintenancePriority,
    torqueApplied_Nm: 45.0,
    contactForceBefore_N: currentPoint?.force_N ?? 11500,
    contactForceAfter_N: 12000,
    resistanceBefore_mOhm: currentPoint?.resistance_mOhm ?? 0.045,
    resistanceAfter_mOhm: 0.040,
    actionsTaken: 'Cleaned contact faces with Scotch-Brite; torqued M10 bolt to 45 N·m',
    componentsReplaced: 'Belleville spring washer DIN 6796',
    findingsNotes: 'Routine re-torquing during planned shutdown.'
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await addMaintenanceRecord({
      inspectorName: formData.inspectorName,
      priorityAtService: formData.priorityAtService,
      torqueApplied_Nm: Number(formData.torqueApplied_Nm),
      contactForceBefore_N: Number(formData.contactForceBefore_N),
      contactForceAfter_N: Number(formData.contactForceAfter_N),
      resistanceBefore_mOhm: Number(formData.resistanceBefore_mOhm),
      resistanceAfter_mOhm: Number(formData.resistanceAfter_mOhm),
      actionsTaken: formData.actionsTaken.split(';').map(s => s.trim()).filter(Boolean),
      componentsReplaced: formData.componentsReplaced.split(';').map(s => s.trim()).filter(Boolean),
      findingsNotes: formData.findingsNotes
    });
    setIsModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (maintenanceRecords.length === 0) return;
    const flat = maintenanceRecords.map(r => ({
      RecordID: r.id,
      Timestamp: new Date(r.timestamp).toISOString(),
      Inspector: r.inspectorName,
      Priority: r.priorityAtService,
      TorqueApplied_Nm: r.torqueApplied_Nm,
      ContactForceBefore_N: r.contactForceBefore_N,
      ContactForceAfter_N: r.contactForceAfter_N,
      ResistanceBefore_mOhm: r.resistanceBefore_mOhm,
      ResistanceAfter_mOhm: r.resistanceAfter_mOhm,
      ActionsTaken: r.actionsTaken.join('; '),
      ComponentsReplaced: r.componentsReplaced.join('; '),
      Findings: r.findingsNotes
    }));
    exportToCsv(flat, `busbar_maintenance_records_${Date.now()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-copper-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Busbar Maintenance &amp; Field Inspection Log
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable service log for joint torque verification, contact surface dressing, and pre/post rehabilitation parameters.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-copper-500 hover:bg-copper-600 text-white text-xs font-bold transition-all shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Inspection Entry</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-700 hover:bg-slate-200 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4 text-copper-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-700 hover:bg-slate-200 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Print-Only Laboratory Header */}
      <div className="hidden print:block p-4 border-b border-black mb-4">
        <h1 className="text-2xl font-bold">B.TECH FINAL-YEAR PROJECT: SMART JOINT MONITOR</h1>
        <p className="text-sm">Bolted Copper Busbar Health &amp; Maintenance Record Log</p>
        <p className="text-xs text-gray-600">Generated: {new Date().toLocaleString()}</p>
      </div>

      {/* Records Feed */}
      <div className="space-y-4">
        {maintenanceRecords.length === 0 ? (
          <div className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-12 text-center text-slate-400">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No Maintenance Records Logged</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;New Inspection Entry&quot; to log the first laboratory or field maintenance event.
            </p>
          </div>
        ) : (
          maintenanceRecords.map(record => (
            <div
              key={record.id}
              className="bg-white dark:bg-navy-800 rounded-xl border border-slate-200 dark:border-navy-700 p-5 shadow-sm print-card space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-navy-700 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-copper-500/10 text-copper-500">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Inspection Log: {record.id}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-700 text-slate-500">
                        {record.priorityAtService}
                      </span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTimeString(record.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {record.inspectorName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 no-print">
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-400 block text-[10px]">Applied Torque:</span>
                    <span className="font-bold text-copper-500">{record.torqueApplied_Nm.toFixed(1)} N·m</span>
                  </div>
                  <button
                    onClick={() => deleteMaintenanceRecord(record.id)}
                    title="Delete record"
                    className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Before vs After Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700/60">
                  <span className="text-slate-400 block text-[10px]">Pre-Torque Force:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {record.contactForceBefore_N.toLocaleString()} N
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700/60">
                  <span className="text-emerald-500 block text-[10px] font-bold">Post-Torque Force:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {record.contactForceAfter_N.toLocaleString()} N
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700/60">
                  <span className="text-slate-400 block text-[10px]">Pre-Service R:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {record.resistanceBefore_mOhm.toFixed(3)} mΩ
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-navy-700/60">
                  <span className="text-emerald-500 block text-[10px] font-bold">Post-Service R:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {record.resistanceAfter_mOhm.toFixed(3)} mΩ
                  </span>
                </div>
              </div>

              {/* Actions & Components */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Actions Taken:
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-slate-700 dark:text-slate-300">
                    {record.actionsTaken.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Components Replaced:
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-slate-700 dark:text-slate-300">
                    {record.componentsReplaced.length > 0 ? (
                      record.componentsReplaced.map((comp, i) => <li key={i}>{comp}</li>)
                    ) : (
                      <li className="text-slate-400 italic">None replaced</li>
                    )}
                  </ul>
                </div>
              </div>

              {record.findingsNotes && (
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-navy-900/40 p-3 rounded-lg border border-slate-100 dark:border-navy-700/40">
                  <strong className="text-slate-700 dark:text-slate-300">Inspector Findings: </strong>
                  {record.findingsNotes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto smooth-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-700 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-copper-500 flex-shrink-0" />
                <span>Log Joint Maintenance Inspection</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold">
                    Inspector Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.inspectorName}
                    onChange={e => setFormData({ ...formData, inspectorName: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold">
                    Applied Bolt Torque (N·m):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.torqueApplied_Nm}
                    onChange={e => setFormData({ ...formData, torqueApplied_Nm: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold font-sans">
                    Force Before (N):
                  </label>
                  <input
                    type="number"
                    value={formData.contactForceBefore_N}
                    onChange={e => setFormData({ ...formData, contactForceBefore_N: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold font-sans">
                    Force After (N):
                  </label>
                  <input
                    type="number"
                    value={formData.contactForceAfter_N}
                    onChange={e => setFormData({ ...formData, contactForceAfter_N: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold font-sans">
                    Resistance Before (mΩ):
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.resistanceBefore_mOhm}
                    onChange={e => setFormData({ ...formData, resistanceBefore_mOhm: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold font-sans">
                    Resistance After (mΩ):
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.resistanceAfter_mOhm}
                    onChange={e => setFormData({ ...formData, resistanceAfter_mOhm: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold">
                  Actions Taken (semicolon separated):
                </label>
                <input
                  type="text"
                  value={formData.actionsTaken}
                  onChange={e => setFormData({ ...formData, actionsTaken: e.target.value })}
                  placeholder="e.g. Buffed contact faces; applied Penetrox; torqued M10 bolt"
                  className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold">
                  Components Replaced:
                </label>
                <input
                  type="text"
                  value={formData.componentsReplaced}
                  onChange={e => setFormData({ ...formData, componentsReplaced: e.target.value })}
                  placeholder="e.g. Belleville washer DIN 6796; M10 8.8 Bolt"
                  className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-300 block mb-1 font-semibold">
                  Findings / Observations:
                </label>
                <textarea
                  rows={2}
                  value={formData.findingsNotes}
                  onChange={e => setFormData({ ...formData, findingsNotes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-navy-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-copper-500 hover:bg-copper-600 text-white font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
