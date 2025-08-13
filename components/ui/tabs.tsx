export function Tabs({ children, value, onValueChange, className = "" }: any) {
  return <div className={className}>{children}</div>
}

export function TabsList({ children, className = "" }: any) {
  return <div className={`flex space-x-2 border-b ${className}`}>{children}</div>
}

export function TabsTrigger({ children, value, className = "" }: any) {
  return <button className={`px-4 py-2 ${className}`}>{children}</button>
}

export function TabsContent({ children, value, className = "" }: any) {
  return <div className={className}>{children}</div>
}


