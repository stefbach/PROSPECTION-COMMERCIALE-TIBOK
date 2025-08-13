export function Checkbox({ checked, onCheckedChange, ...props }: any) {
  return (
    <input 
      type="checkbox" 
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )
}
