export function Card({ children, className = "" }: any) {
  return <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
}

export function CardHeader({ children, className = "" }: any) {
  return <div className={`p-6 pb-3 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = "" }: any) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
}

export function CardDescription({ children, className = "" }: any) {
  return <p className={`text-sm text-gray-600 ${className}`}>{children}</p>
}

export function CardContent({ children, className = "" }: any) {
  return <div className={`p-6 pt-3 ${className}`}>{children}</div>
}
