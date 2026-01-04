import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  MapPin,
  Hospital,
  Pill,
  Stethoscope,
  Navigation,
  Loader2,
  RefreshCw,
  ExternalLink,
  Phone,
  Clock,
  Activity,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types and Icons
interface NearbyPlace {
  id: string;
  name: string;
  type: 'hospital' | 'pharmacy' | 'clinic';
  address: string;
  distance: number;
  lat: number;
  lon: number;
  phone?: string;
  openingHours?: string;
}

const placeIcons = {
  hospital: Hospital,
  pharmacy: Pill,
  clinic: Stethoscope,
};

const placeColors = {
  hospital: 'bg-destructive/10 text-destructive',
  pharmacy: 'bg-success/10 text-success',
  clinic: 'bg-primary/10 text-primary',
};

export default function NearbyServices() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(10000); // 10km default
  const [searchQuery, setSearchQuery] = useState('');

  // Location logic
  const getCurrentLocation = () => {
    setIsLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        fetchNearbyPlaces(latitude, longitude, searchRadius);
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const fetchNearbyPlaces = async (lat: number, lon: number, radius: number) => {
    setIsLoading(true);
    const controller = new AbortController();

    try {
      const query = `[out:json][timeout:20];(node["amenity"~"hospital|pharmacy|clinic|doctors"](around:${radius},${lat},${lon});way["amenity"~"hospital|pharmacy|clinic|doctors"](around:${radius},${lat},${lon});node["healthcare"~"hospital|pharmacy|doctor|centre"](around:${radius},${lat},${lon}););out center;`;

      const mirrors = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.openstreetmap.ru/cgi/interpreter'
      ];

      const data: any = await new Promise((resolve, reject) => {
        let errorCount = 0;
        let resolved = false;

        mirrors.forEach(url => {
          fetch(`${url}?data=${encodeURIComponent(query)}`, { signal: controller.signal })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(json => {
              if (json?.elements && !resolved) {
                resolved = true;
                controller.abort();
                resolve(json);
              }
            })
            .catch(() => {
              errorCount++;
              if (errorCount === mirrors.length && !resolved) reject(new Error('fail'));
            });
        });
      });

      const uniquePlacesMap = new Map();
      data.elements.forEach((element: any, index: number) => {
        const isPharmacy = element.tags.amenity === 'pharmacy' || element.tags.healthcare === 'pharmacy';
        const isHospital = element.tags.amenity === 'hospital' || element.tags.healthcare === 'hospital' || element.tags.building === 'hospital';
        const type = isPharmacy ? 'pharmacy' : (isHospital ? 'hospital' : 'clinic');
        const itemLat = element.lat || element.center?.lat;
        const itemLon = element.lon || element.center?.lon;
        const id = element.id?.toString() || `place-${index}`;

        if (!uniquePlacesMap.has(id)) {
          uniquePlacesMap.set(id, {
            id,
            name: element.tags.name || element.tags['name:en'] || `${type.charAt(0).toUpperCase() + type.slice(1)}`,
            type,
            address: element.tags['addr:full'] || element.tags['addr:street'] || element.tags['addr:city'] || 'Nearby Area',
            distance: calculateDistance(lat, lon, itemLat, itemLon),
            lat: itemLat,
            lon: itemLon,
            phone: element.tags.phone || element.tags['contact:phone'],
            openingHours: element.tags.opening_hours,
          });
        }
      });

      setPlaces(Array.from(uniquePlacesMap.values()).sort((a, b) => a.distance - b.distance));
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast({ title: 'Search Lag', description: 'Retrying map servers...', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const formatDistance = (km: number): string => km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;

  const filteredPlaces = places
    .filter((place) => activeTab === 'all' || place.type === activeTab)
    .filter((place) =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

  useEffect(() => {
    if (userLocation) fetchNearbyPlaces(userLocation.lat, userLocation.lon, searchRadius);
  }, [searchRadius, userLocation]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Map BBox calculation
  // 1 degree latitude = 111.32km
  // 1 degree longitude = 111.32km * cos(latitude)
  const getBBox = () => {
    if (!userLocation) return '';
    const latRad = userLocation.lat * Math.PI / 180;
    const latDegreeRadius = (searchRadius / 1000) / 111.32;
    const lonDegreeRadius = latDegreeRadius / Math.cos(latRad);

    // Add 20% padding for better view
    const padding = 1.2;
    const l = userLocation.lon - (lonDegreeRadius * padding);
    const b = userLocation.lat - (latDegreeRadius * padding);
    const r = userLocation.lon + (lonDegreeRadius * padding);
    const t = userLocation.lat + (latDegreeRadius * padding);

    return `${l},${b},${r},${t}`;
  };

  return (
    <Layout>
      <div className="container py-8 max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              {t('nearby.title') || 'Nearby Services'}
            </h1>
            <p className="text-muted-foreground font-medium max-w-xl">
              {t('nearby.description') || 'Locate healthcare facilities, pharmacies, and clinics in your immediate vicinity.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-muted/50 p-1 rounded-2xl border border-border/50">
              {[5000, 10000, 20000, 50000].map((r) => (
                <button
                  key={r}
                  onClick={() => setSearchRadius(r)}
                  className={cn(
                    "px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                    searchRadius === r
                      ? "bg-white shadow-xl text-primary scale-105"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r / 1000}km
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl h-11 w-11 hover:bg-primary/5 border-primary/20"
              onClick={getCurrentLocation}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {locationError ? (
          <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden glass-card">
            <CardContent className="py-24 text-center">
              <div className="h-20 w-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-10 w-10 text-rose-500" />
              </div>
              <h3 className="text-2xl font-black mb-2">Location Required</h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">{locationError}</p>
              <Button onClick={getCurrentLocation} className="rounded-2xl px-8 py-6 font-black tracking-tighter shadow-lg shadow-primary/20">
                <Navigation className="h-4 w-4 mr-2" />
                Enable Location
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Map Area */}
            <div className="lg:col-span-3 space-y-6">
              <div className="relative h-[550px] rounded-[3rem] overflow-hidden border-2 border-white/20 shadow-2xl group bg-muted/20">
                {userLocation ? (
                  <iframe
                    title="Nearby Map"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    frameBorder="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${getBBox()}&layer=mapnik&marker=${userLocation.lat},${userLocation.lon}`}
                    className="w-full h-full grayscale-[0.2] contrast-[1.1] opacity-90 transition-opacity group-hover:opacity-100"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest opacity-40">Calibrating Satellite...</p>
                  </div>
                )}

                {/* Radar Floating Info */}
                <div className="absolute top-8 left-8 p-5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl max-w-[240px] z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-black tracking-widest px-2 py-0.5">LIVE SCAN</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black tracking-tight">{filteredPlaces.length}</span>
                      <span className="text-[10px] font-black uppercase text-muted-foreground opacity-70">Facilities</span>
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground/80 leading-tight">
                      Located within <span className="text-primary">{searchRadius / 1000}km</span> of your current position.
                    </p>
                  </div>
                </div>

                {/* Accuracy Badge */}
                <div className="absolute bottom-8 right-8 px-4 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 z-10">
                  <Zap className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">High Accuracy</span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Activity className="h-5 w-5 opacity-40" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, facility or address..."
                  className="w-full pl-16 pr-8 py-6 bg-white dark:bg-zinc-900 shadow-xl border-none rounded-[2rem] outline-none text-base font-bold placeholder:font-medium placeholder:opacity-30 transition-all focus:ring-4 focus:ring-primary/5"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Sidebar / Legend */}
            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl glass-card overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('nearby.legend') || 'Scan Legend'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 group cursor-help" onClick={() => setActiveTab('hospital')}>
                    <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-rose-500/5">
                      <Hospital className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight">Hospitals</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Emergency Care</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group cursor-help" onClick={() => setActiveTab('pharmacy')}>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
                      <Pill className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight">Pharmacies</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Medical Supplies</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group cursor-help" onClick={() => setActiveTab('clinic')}>
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/5">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight">Clinics</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Specialists</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Result Summary */}
              <div className="p-8 rounded-[2.5rem] bg-zinc-900 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Navigation className="h-24 w-24" />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-8 text-white/40">Radar Status</h4>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Radius</span>
                    <span className="text-xl font-black">{searchRadius / 1000} KM</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Efficiency</p>
                      <p className="text-lg font-black text-emerald-400">OPTIMAL</p>
                    </div>
                    <Activity className="h-8 w-8 text-emerald-400/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Places List Section */}
            <div className="lg:col-span-4 mt-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2 scrollbar-none">
                  <TabsList className="bg-muted/50 p-1.5 rounded-[2rem] h-14 border border-border/50">
                    <TabsTrigger value="all" className="rounded-2xl px-8 font-black text-[11px] uppercase tracking-widest">All Services</TabsTrigger>
                    <TabsTrigger value="hospital" className="rounded-2xl px-8 font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white">
                      <Hospital className="h-4 w-4 mr-2" /> Hospitals
                    </TabsTrigger>
                    <TabsTrigger value="pharmacy" className="rounded-2xl px-8 font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                      <Pill className="h-4 w-4 mr-2" /> Pharmacies
                    </TabsTrigger>
                    <TabsTrigger value="clinic" className="rounded-2xl px-8 font-black text-[11px] uppercase tracking-widest data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                      <Stethoscope className="h-4 w-4 mr-2" /> Clinics
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={activeTab} className="mt-0">
                  {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="rounded-[2.5rem] border-none bg-muted/20 h-[300px] animate-pulse">
                          <CardContent className="h-full flex flex-col items-center justify-center p-7">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20 mb-4" />
                            <div className="h-4 w-3/4 bg-muted rounded-full mb-2"></div>
                            <div className="h-3 w-1/2 bg-muted rounded-full opacity-50"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredPlaces.length === 0 ? (
                    <Card className="rounded-[4rem] border-dashed border-2 bg-transparent py-32 text-center">
                      <CardContent>
                        <div className="h-24 w-24 bg-muted/50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
                          <Navigation className="h-10 w-10 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="text-2xl font-black mb-2">Area is Clear</h3>
                        <p className="text-muted-foreground font-medium mb-10 max-w-sm mx-auto leading-relaxed">
                          We didn't find any specialized facilities in your current <span className="text-primary font-bold">{searchRadius / 1000}km</span> scan.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                          {searchRadius < 50000 && (
                            <Button onClick={() => setSearchRadius(50000)} className="rounded-2xl px-10 h-14 font-black shadow-2xl shadow-primary/20">
                              <MapPin className="h-4 w-4 mr-2" /> Scan 50km
                            </Button>
                          )}
                          <Button variant="outline" onClick={getCurrentLocation} className="rounded-2xl px-10 h-14 font-black border-2 border-primary/20">
                            Re-calibrate Location
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {filteredPlaces.map((place) => {
                        const Icon = placeIcons[place.type] || MapPin;
                        return (
                          <Card
                            key={place.id}
                            className="group rounded-[2.5rem] border-none bg-white dark:bg-zinc-900 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                          >
                            <CardContent className="p-7">
                              <div className="flex items-start justify-between mb-6">
                                <div className={cn("p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110", placeColors[place.type])}>
                                  <Icon className="h-6 w-6" />
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 mb-1">Distance</p>
                                  <Badge variant="secondary" className="font-mono text-[10px] rounded-full px-3">
                                    {formatDistance(place.distance)}
                                  </Badge>
                                </div>
                              </div>

                              <div className="space-y-2 mb-8 min-h-[100px]">
                                <h3 className="text-lg font-black leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                                  {place.name}
                                </h3>
                                <p className="text-xs font-medium text-muted-foreground/80 line-clamp-3 leading-relaxed">
                                  {place.address}
                                </p>
                              </div>

                              <div className="grid grid-cols-5 gap-2 pt-6 border-t border-muted/30">
                                <Button
                                  className="col-span-4 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10"
                                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`, '_blank')}
                                >
                                  <Navigation className="h-3 w-3 mr-2" /> Directions
                                </Button>
                                {place.phone && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-2xl h-12 w-12 border-muted hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200 transition-all"
                                    onClick={() => window.open(`tel:${place.phone}`)}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
