function FailureReasonSelector({ failureReasons, selectedReasonId, onSelectReason }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Failure Reason
      </label>
      <select
        value={selectedReasonId || ''}
        onChange={(e) => onSelectReason(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <option value="">Select a reason...</option>
        {failureReasons.map((reason) => (
          <option key={reason.id} value={reason.id}>
            {reason.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FailureReasonSelector;