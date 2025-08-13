export function Badge({ children, className = "", variant = "default" }: any) {
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 ${className}`}>
      {children}
    </span>
  )
}
