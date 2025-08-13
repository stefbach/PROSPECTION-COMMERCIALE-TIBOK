export function Button({ children, onClick, disabled, className = "", variant = "default", size = "default" }: any) {
  const baseClass = "px-4 py-2 rounded font-medium transition-colors"
  const variantClass = variant === "outline" ? "border border-gray-300 hover:bg-gray-50" : "bg-blue-600 text-white hover:bg-blue-700"
  const sizeClass = size === "sm" ? "text-sm px-3 py-1" : ""
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : ""
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${sizeClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  )
}
