import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import TaskItem from '../components/TaskItem';

function MyDay() {
  const { user, token } = useAuthStore();
  const [dayEntry, setDayEntry] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('');
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

  const createDayEntry = async () => {
    try {
      const response = await fetch('/api/day-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user.tenant_id,
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDayEntry(data.data);
        fetchTasks(data.data.id);
      }
    } catch (err) {
      console.error('Error creating day entry:', err);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user.tenant_id,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          day_entry_id: dayEntry.id,
          title: newTask,
          category: newCategory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTasks([...tasks, data.data]);
        setNewTask('');
        setNewCategory('');
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': user.tenant_id,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_completed: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setTasks(tasks.map((t) => (t.id === taskId ? data.data : t)));
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': user.tenant_id,
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setTasks(tasks.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleEndOfDay = () => {
    navigate('/end-of-day');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Day</h1>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          {dayEntry ? (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Day Started
            </span>
          ) : (
            <button
              onClick={createDayEntry}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Start Day
            </button>
          )}
        </div>

        {dayEntry && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm font-medium text-gray-700">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3">
                Tasks ({completedTasks}/{totalTasks} completed)
              </h2>
              <form onSubmit={addTask} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category (optional)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add
                </button>
              </form>

              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tasks yet. Add one above!</p>
                ) : (
                  tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="pt-6 border-t">
              <button
                onClick={handleEndOfDay}
                disabled={totalTasks === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  totalTasks === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                End of Day Review
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MyDay;