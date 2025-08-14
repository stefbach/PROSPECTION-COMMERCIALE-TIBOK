export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="mb-4">Page non trouvée</p>
        <a href="/" className="text-blue-500 underline">Retour à l'accueil</a>
      </div>
    </div>
  )
}
