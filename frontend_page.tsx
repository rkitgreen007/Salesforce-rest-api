'use client';

import { useState, useEffect } from 'react';

interface AccountingTask {
  Id: string;
  Name: string;
  Amount__c: number;
  Type__c: string;
  Status__c: string;
  Description__c: string;
}

export default function AccountingDashboard() {
  const [tasks, setTasks] = useState<AccountingTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [taskType, setTaskType] = useState('Expense');
  const [status, setStatus] = useState('Pending');
  const [description, setDescription] = useState('');

  // Fetch ledger data
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting');
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to retrieve ledger entries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Submit record creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    try {
      const res = await fetch('/api/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          taskType,
          status,
          description,
        }),
      });

      if (res.ok) {
        setAmount('');
        setDescription('');
        fetchTasks(); // Refresh list layout
      }
    } catch (err) {
      console.error('Submission processing error', err);
    }
  };

  // Trigger record removal
  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/accounting/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Delete request failed', err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Title Block */}
        <div className="col-span-1 md:col-span-3 border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Corporate General Ledger</h1>
          <p className="text-sm text-gray-500">Salesforce Native Apex API CRUD Operations Hub</p>
        </div>

        {/* Entry Submission Form Column */}
        <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Create Accounting Task</h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase">Amount ($)</label>
              <input 
                type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase">Type</label>
              <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className="mt-1 block w-full border rounded-lg p-2.5 text-sm bg-gray-50">
                <option value="Expense">Expense</option>
                <option value="Revenue">Revenue</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full border rounded-lg p-2.5 text-sm bg-gray-50">
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Reconciled">Reconciled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 uppercase">Description</label>
              <textarea 
                rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors shadow-sm">
              Publish Entry to Salesforce
            </button>
          </form>
        </div>

        {/* Ledger Table Column */}
        <div className="bg-white p-6 rounded-xl shadow-sm border col-span-1 md:col-span-2 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Live Salesforce Records</h2>
          {loading ? (
            <p className="text-sm text-gray-400 animate-pulse py-8 text-center">Syncing data with Salesforce Org instance...</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No transactions currently exist in the database model.</p>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b text-gray-400 font-medium uppercase text-xs">
                  <th className="py-3 px-2">Task Name</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tasks.map((task) => (
                  <tr key={task.Id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 font-medium text-gray-900">
                      <div>{task.Name}</div>
                      <div className="text-xs text-gray-400 font-normal">{task.Description__c || 'No notes added'}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.Type__c === 'Revenue' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                        {task.Type__c}
                      </span>
                    </td>
                    <td className={`py-3 px-2 text-right font-semibold ${task.Type__c === 'Revenue' ? 'text-green-600' : 'text-gray-900'}`}>
                      ${task.Amount__c?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-xs text-gray-600 border px-2 py-1 rounded-full font-mono bg-white shadow-sm">
                        {task.Status__c}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button 
                        onClick={() => handleDeleteTask(task.Id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
}
