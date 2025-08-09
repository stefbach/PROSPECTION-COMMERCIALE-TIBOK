// components/mauritius-map.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

type Prospect = {
  id: number
  nom: string
  secteur: string
  ville: string
  region: string
  statut: string
  latitude?: number | null
  longitude?: number | null
  score?: number
  telephone?: string
  email?: string
  adresse_complete?: string
}

interface MauritiusMapProps {
  prospects: Prospect[]
  selectedProspect?: Prospect | null
  onProspectClick?: (prospect: Prospect) => void
  showRoute?: boolean
  height?: string
}

export function MauritiusMap({ 
  prospects, 
  selectedProspect,
  onProspectClick,
  showRoute = false,
  height = '500px'
}: MauritiusMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const markersRef = useRef<L.Marker[]>([])
  const routeRef = useRef<L.Polyline | null>(null)

  // Couleurs par statut
  const statusColors: Record<string, string> = {
    nouveau: '#6B7280',      // Gris
    qualifie: '#10B981',     // Vert
    'rdv-planifie': '#3B82F6', // Bleu
    'en-negociation': '#F59E0B', // Orange
    signe: '#8B5CF6',        // Violet
    refuse: '#EF4444',       // Rouge
    'a-relancer': '#F97316'  // Orange foncé
  }

  // Régions de Maurice avec leurs centres
  const regions = {
    'all': { name: 'Toute l\'île', lat: -20.2833, lng: 57.5500, zoom: 10 },
    'port-louis': { name: 'Port Louis', lat: -20.1609, lng: 57.4989, zoom: 12 },
    'plaines-wilhems': { name: 'Plaines Wilhems', lat: -20.2885, lng: 57.4915, zoom: 12 },
    'moka': { name: 'Moka', lat: -20.2333, lng: 57.5833, zoom: 12 },
    'flacq': { name: 'Flacq', lat: -20.2000, lng: 57.7167, zoom: 12 },
    'grand-port': { name: 'Grand Port', lat: -20.4073, lng: 57.7003, zoom: 12 },
    'pamplemousses': { name: 'Pamplemousses', lat: -20.1039, lng: 57.5703, zoom: 12 },
    'riviere-du-rempart': { name: 'Rivière du Rempart', lat: -20.0564, lng: 57.6553, zoom: 12 },
    'savanne': { name: 'Savanne', lat: -20.4500, lng: 57.5000, zoom: 12 },
    'riviere-noire': { name: 'Rivière Noire', lat: -20.3484, lng: 57.3672, zoom: 12 }
  }

  useEffect(() => {
    if (!mapRef.current || map) return

    // Initialiser la carte
    const newMap = L.map(mapRef.current).setView([-20.2833, 57.5500], 10)
    
    // Ajouter le fond de carte
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(newMap)

    setMap(newMap)

    return () => {
      newMap.remove()
    }
  }, [])

  useEffect(() => {
    if (!map) return

    // Nettoyer les marqueurs existants
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Filtrer les prospects
    const filteredProspects = selectedRegion === 'all' 
      ? prospects 
      : prospects.filter(p => p.region === selectedRegion)

    // Ajouter les nouveaux marqueurs
    filteredProspects.forEach(prospect => {
      if (prospect.latitude && prospect.longitude) {
        const color = statusColors[prospect.statut] || '#6B7280'
        
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 30px;
              height: 30px;
              border-radius: 50% 50% 50% 0;
              position: relative;
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
              <div style="
                transform: rotate(45deg);
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg);
                color: white;
                font-weight: bold;
                font-size: 12px;
              ">
                ${prospect.score || '?'}
              </div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -30]
        })

        const marker = L.marker([prospect.latitude, prospect.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 5px;">${prospect.nom}</h3>
              <p style="margin: 2px 0;"><strong>Statut:</strong> ${prospect.statut}</p>
              <p style="margin: 2px 0;"><strong>Ville:</strong> ${prospect.ville}</p>
              <p style="margin: 2px 0;"><strong>Score:</strong> ${'★'.repeat(prospect.score || 0)}${'☆'.repeat(5 - (prospect.score || 0))}</p>
              ${prospect.telephone ? `<p style="margin: 2px 0;"><strong>Tél:</strong> ${prospect.telephone}</p>` : ''}
              ${prospect.email ? `<p style="margin: 2px 0;"><strong>Email:</strong> ${prospect.email}</p>` : ''}
            </div>
          `)

        marker.on('click', () => {
          if (onProspectClick) {
            onProspectClick(prospect)
          }
        })

        markersRef.current.push(marker)
      }
    })

    // Tracer l'itinéraire si demandé
    if (showRoute && filteredProspects.length > 1) {
      const routeCoords: [number, number][] = filteredProspects
        .filter(p => p.latitude && p.longitude)
        .map(p => [p.latitude!, p.longitude!])

      if (routeRef.current) {
        routeRef.current.remove()
      }

      routeRef.current = L.polyline(routeCoords, {
        color: '#3B82F6',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(map)
    }

    // Ajuster la vue si un prospect est sélectionné
    if (selectedProspect?.latitude && selectedProspect?.longitude) {
      map.setView([selectedProspect.latitude, selectedProspect.longitude], 14)
    }

  }, [map, prospects, selectedRegion, selectedProspect, showRoute, onProspectClick])

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
    if (map && regions[region as keyof typeof regions]) {
      const r = regions[region as keyof typeof regions]
      map.setView([r.lat, r.lng], r.zoom)
    }
  }

  const zoomIn = () => map?.zoomIn()
  const zoomOut = () => map?.zoomOut()
  const resetView = () => map?.setView([-20.2833, 57.5500], 10)

  // Statistiques
  const stats = prospects.reduce((acc, p) => {
    if (p.latitude && p.longitude) {
      acc.geolocated++
      acc.byStatus[p.statut] = (acc.byStatus[p.statut] || 0) + 1
    } else {
      acc.notGeolocated++
    }
    return acc
  }, {
    geolocated: 0,
    notGeolocated: 0,
    byStatus: {} as Record<string, number>
  })

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Carte des Prospects - Île Maurice
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {stats.geolocated} géolocalisés
            </Badge>
            {stats.notGeolocated > 0 && (
              <Badge variant="outline">
                {stats.notGeolocated} sans position
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Contrôles de la carte */}
        <div className="flex items-center gap-2 p-3 border-b flex-wrap">
          <div className="flex items-center gap-1">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <select 
              className="text-sm border rounded px-2 py-1"
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
            >
              {Object.entries(regions).map(([key, region]) => (
                <option key={key} value={key}>{region.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={resetView}>
              <Navigation className="h-4 w-4" />
            </Button>
          </div>

          {showRoute && (
            <Badge variant="default">
              Mode itinéraire activé
            </Badge>
          )}
        </div>

        {/* Légende des statuts */}
        <div className="flex items-center gap-2 p-3 border-b flex-wrap">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div 
                className="w-4 h-4 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs capitalize">{status.replace('-', ' ')}</span>
            </div>
          ))}
        </div>

        {/* Carte */}
        <div ref={mapRef} style={{ height, width: '100%' }} />
      </CardContent>
    </Card>
  )
}
