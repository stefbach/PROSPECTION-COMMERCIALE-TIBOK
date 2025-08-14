import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "ProspectMed Pro",
  description: "Gestion commerciale téléconsultation",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
