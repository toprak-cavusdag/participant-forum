
const Field = ({
  label,
  name,
  value,
  onChange,
  required = false,
  type = "text",
  min,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 p-2 rounded"
      required={required}
      {...(type === "number" && min !== undefined ? { min } : {})}
    />
  </div>
);

export default Field;