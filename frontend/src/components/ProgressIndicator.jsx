function ProgressIndicator({ completed, total }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${percentage}%` }}
      ></div>
      <div className="flex justify-between text-sm text-gray-600 mt-2">
        <span>{completed} of {total} tasks completed</span>
        <span>{percentage}%</span>
      </div>
    </div>
  );
}

export default ProgressIndicator;