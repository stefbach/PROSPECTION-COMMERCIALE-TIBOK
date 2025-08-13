export function Alert({ children, className = "" }: any) {
  return <div className={`p-4 bg-blue-50 border border-blue-200 rounded ${className}`}>{children}</div>
}

export function AlertDescription({ children }: any) {
  return <p className="text-sm">{children}</p>
}
