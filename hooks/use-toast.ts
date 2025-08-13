export function useToast() {
  return {
    toast: ({ title, description, variant }: any) => {
      console.log(`Toast: ${title} - ${description}`)
      if (typeof window !== 'undefined') {
        alert(`${title}\n${description}`)
      }
    }
  }
}
