import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import FailureReasonSelector from '../components/FailureReasonSelector';

function EndOfDay() {
  const { user, token } = useAuthStore();
  const [dayEntry, setDayEntry] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [failureReasons, setFailureReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDayEntry();
  }, []);

  const fetchDayEntry = async () => {
    try {
      const response = await fetch('/api/day-entries/today', {
        headers: {
          'x-tenant-id': user.tenant_id,
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setDayEntry(data.data);
        fetchTasks(data.data.id);
        fetchFailureReasons();
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Error fetching day entry:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (dayEntryId) => {
    try {
      const response = await fetch(
        `/api/tasks?dayEntryId=${dayEntryId}`,
        {
          headers: {
            'x-tenant-id': user.tenant_id,
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchFailureReasons = async () => {
    try {
      const response = await fetch('/api/failure-reasons', {
        headers: {
          'x-tenant-id': user.tenant_id,
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFailureReasons(data.data);
      }
    } catch (err) {
      console.error('Error fetching failure reasons:', err);
    }
  };

  const handleSubmit = async () => {
    const incompleteTasks = tasks.filter((t) => !t.is_completed);
    
    if (incompleteTasks.length === 0) {
      // No incomplete tasks, just close the day
      closeDay();
      return;
    }

    // Check if all incomplete tasks have failure reasons
    const allIncompleteHaveReason = incompleteTasks.every(
      (t) => t.failure_reason_id && t.failure_reason_id !== ''
    );

    if (!allIncompleteHaveReason) {
      alert('Please select a failure reason for all incomplete tasks before closing the day.');
      return;
    }

    closeDay();
  };

  const closeDay = async () => {
    if (!dayEntry) return;

    try {
      const response = await fetch('/api/day-entries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user.tenant_id,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: dayEntry.id,
          is_closed: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Day closed successfully!');
        navigate('/');
      }
    } catch (err) {
      console.error('Error closing day:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const incompleteTasks = tasks.filter((t) => !t.is_completed);
  const totalTasks = tasks.length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">End of Day Review</h1>
          <p className="text-sm text-gray-600">
            Review your tasks and provide failure reasons for incomplete items
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Task Summary</h2>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {completedTasks} completed, {incompleteTasks.length} incomplete
            </span>
          </div>
        </div>

        {incompleteTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              Incomplete Tasks ({incompleteTasks.length})
            </h2>
            <div className="space-y-4">
              {incompleteTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </span>
                    {task.is_completed && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  {task.category && (
                    <span className="text-xs text-gray-500">{task.category}</span>
                  )}

                  <div className="mt-3">
                    <FailureReasonSelector
                      failureReasons={failureReasons}
                      selectedReasonId={task.failure_reason_id || ''}
                      onSelectReason={(reasonId) => {
                        setTasks((prev) =>
                          prev.map((t) =>
                            t.id === task.id ? { ...t, failure_reason_id: reasonId } : t
                          )
                        );
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={totalTasks === 0}
            className={`px-6 py-2 rounded-lg font-medium ${
              totalTasks === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Close Day
          </button>
        </div>
      </div>
    </div>
  );
}

export default EndOfDay;