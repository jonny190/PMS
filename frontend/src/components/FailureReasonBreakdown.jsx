import { useMemo } from 'react';

function FailureReasonBreakdown({ failureReasons }) {
  const totalReasons = useMemo(() => 
    failureReasons.reduce((sum, r) => sum + (parseInt(r.count) || 0), 0), 
    [failureReasons]
  );

  if (!failureReasons || failureReasons.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Failure Reasons Breakdown</h2>
      </div>
      <div className="divide-y">
        {failureReasons.map((reason) => (
          <div key={reason.failure_reason} className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900">{reason.failure_reason}</span>
              <span className="text-sm font-bold text-gray-600">{reason.count} tasks</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2.5 rounded-full"
                style={{ 
                  width: `${(reason.count / (totalReasons || 1)) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FailureReasonBreakdown;