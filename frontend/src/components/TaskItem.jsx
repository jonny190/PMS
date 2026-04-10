import { useState } from 'react';

function TaskItem({ task, onToggle, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="p-3 flex items-center space-x-3 hover:bg-gray-50 rounded-md transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => onToggle(task.id, task.is_completed)}
        className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
          task.is_completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-indigo-500'
        }`}
      >
        {task.is_completed && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span
        className={`flex-1 ${
          task.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'
        }`}
      >
        {task.title}
      </span>
      {isHovered && (
        <button
          onClick={() => onDelete(task.id)}
          className="text-gray-400 hover:text-red-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default TaskItem;