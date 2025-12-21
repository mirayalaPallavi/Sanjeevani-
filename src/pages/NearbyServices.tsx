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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  const fetchNearbyPlaces = async (lat: number, lon: number, radius: number, isGlobalSearch: boolean = false) => {
    setIsLoading(true);
    const controller = new AbortController();

    try {
      // Dynamic Query based on user intent
      const searchRadius = isGlobalSearch ? 80000 : radius;
      let queryTags = 'node["amenity"~"hospital|pharmacy|clinic|doctors"]';

      // If user is searching for a name, add the regex to the query
      if (searchQuery.length > 2 || isGlobalSearch) {
        const namePart = searchQuery || "Neelima|Hospital|Clinic|Medical";
        queryTags += `;node["name"~"${namePart}",i];way["name"~"${namePart}",i]`;
      }

      const query = `[out:json][timeout:20];(node["amenity"~"hospital|pharmacy|clinic|doctors"](around:${searchRadius},${lat},${lon});way["amenity"~"hospital|pharmacy|clinic|doctors"](around:${searchRadius},${lat},${lon});node["healthcare"~"hospital|pharmacy|doctor|centre"](around:${searchRadius},${lat},${lon});${(searchQuery.length > 2 || isGlobalSearch) ? `node["name"~"${searchQuery || 'Neelima'}",i](around:${searchRadius},${lat},${lon});way["name"~"${searchQuery || 'Neelima'}",i](around:${searchRadius},${lat},${lon});` : ''});out center;`;

      const mirrors = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.openstreetmap.ru/cgi/interpreter',
        'https://overpass.nchc.org.tw/api/interpreter'
      ];

      // Manual Mirror Race for older browser compatibility
      const data: any = await new Promise((resolve, reject) => {
        let errorCount = 0;
        let resolved = false;

        mirrors.forEach(url => {
          fetch(`${url}?data=${encodeURIComponent(query)}`, { signal: controller.signal })
            .then(res => {
              if (res.ok) return res.json();
              throw new Error('fail');
            })
            .then(json => {
              if (json && json.elements && !resolved) {
                resolved = true;
                controller.abort();
                resolve(json);
              }
            })
            .catch(() => {
              errorCount++;
              if (errorCount === mirrors.length && !resolved) {
                reject(new Error('All mirrors failed'));
              }
            });
        });
      });

      const nearbyPlaces: NearbyPlace[] = data.elements.map(
        (element: any, index: number) => {
          // STRICT CATEGORIZATION
          const isPharmacy = element.tags.amenity === 'pharmacy' || element.tags.healthcare === 'pharmacy';
          const isHospital = element.tags.amenity === 'hospital' || element.tags.healthcare === 'hospital' || element.tags.building === 'hospital';

          const type = isPharmacy ? 'pharmacy' : (isHospital ? 'hospital' : 'clinic');

          const itemLat = element.lat || element.center?.lat;
          const itemLon = element.lon || element.center?.lon;

          return {
            id: element.id?.toString() || `place-${index}`,
            name:
              element.tags.name ||
              element.tags['name:en'] ||
              `${type.charAt(0).toUpperCase() + type.slice(1)}`,
            type,
            address:
              element.tags['addr:full'] ||
              element.tags['addr:street'] ||
              element.tags['addr:city'] ||
              'Nearby Area',
            distance: calculateDistance(lat, lon, itemLat, itemLon),
            lat: itemLat,
            lon: itemLon,
            phone: element.tags.phone || element.tags['contact:phone'],
            openingHours: element.tags.opening_hours,
          };
        }
      );

      const sortedResults = nearbyPlaces.sort((a, b) => a.distance - b.distance);
      setPlaces(sortedResults);

      if (sortedResults.length === 0 && radius < 50000 && !isGlobalSearch) {
        toast({
          title: 'Nearby Scan Complete',
          description: `No facilities within ${radius / 1000}km. Use the 50km button to scan further.`,
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Map search failed:', err);
        toast({
          title: 'Search Lag',
          description: 'Map servers are slower than usual. Retrying...',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  const openInMaps = (place: NearbyPlace) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
    window.open(url, '_blank');
  };

  const filteredPlaces = places
    .filter((place) => activeTab === 'all' || place.type === activeTab)
    .filter((place) =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Re-fetch when radius changes
  useEffect(() => {
    if (userLocation) {
      fetchNearbyPlaces(userLocation.lat, userLocation.lon, searchRadius);
    }
  }, [searchRadius]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              {t('nearby.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('nearby.description')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted p-1 rounded-lg border">
              {[5000, 10000, 20000, 50000].map((r) => (
                <button
                  key={r}
                  onClick={() => setSearchRadius(r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${searchRadius === r
                    ? 'bg-background shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {r / 1000}km
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {locationError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('nearby.location_required')}</h3>
              <p className="text-muted-foreground mb-4">{locationError}</p>
              <Button onClick={getCurrentLocation}>
                <Navigation className="h-4 w-4 mr-2" />
                {t('nearby.enable_location')}
              </Button>
            </CardContent>
          </Card>
        ) : isLoading && places.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('nearby.scanning_area')}</p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <Card className="h-[450px] overflow-hidden border-2 shadow-2xl bg-muted/50 relative">
                  {userLocation ? (
                    <iframe
                      title="Nearby Map"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lon - (searchRadius / 100000)}%2C${userLocation.lat - (searchRadius / 130000)}%2C${userLocation.lon + (searchRadius / 100000)}%2C${userLocation.lat + (searchRadius / 130000)}&layer=mapnik&marker=${userLocation.lat}%2C${userLocation.lon}`}
                      className="grayscale-[0.1] contrast-[1.05]"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-sm">Please enable location access</p>
                    </div>
                  )}
                  <div className="absolute bottom-6 left-6 bg-background/95 backdrop-blur-md p-3 rounded-xl border border-primary/20 shadow-xl max-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">{t('nearby.live_radar')}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {t('nearby.no_facilities_found')} <span className="text-foreground font-bold">{searchRadius / 1000}km</span>
                    </p>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="bg-primary/5 border-primary/10 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Navigation className="h-20 w-20" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">{t('nearby.scanner_status')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <p className="text-4xl font-bold">{places.length}</p>
                        <p className="text-xs text-muted-foreground pb-1">{t('nearby.facilities_found')}</p>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-primary/10">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t('nearby.current_radius')}</span>
                          <Badge variant="secondary">{searchRadius / 1000} km</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t('nearby.accuracy')}</span>
                          <span className="text-success font-medium">{t('nearby.ultra_high')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">{t('nearby.legend')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="h-3 w-3 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      <span>{t('nearby.major_hospitals')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="h-3 w-3 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                      <span>{t('nearby.pharmacies')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <span>{t('nearby.clinics_doctors')}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin-slow opacity-20" />
              </div>
              <input
                type="text"
                placeholder={t('nearby.placeholder')}
                className="w-full pl-10 pr-4 py-3 bg-background border-2 border-primary/10 rounded-xl focus:border-primary/40 focus:ring-0 transition-all outline-none text-sm placeholder:text-muted-foreground/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <Badge variant="secondary" className="text-[10px] opacity-50">Filter Results</Badge>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
                  <TabsTrigger value="hospital" className="data-[state=active]:bg-destructive data-[state=active]:text-white">
                    <Hospital className="h-3.5 w-3.5 mr-2" />
                    {t('nearby.hospitals')}
                  </TabsTrigger>
                  <TabsTrigger value="pharmacy" className="data-[state=active]:bg-success data-[state=active]:text-white">
                    <Pill className="h-3.5 w-3.5 mr-2" />
                    {t('nearby.pharmacies')}
                  </TabsTrigger>
                  <TabsTrigger value="clinic" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    <Stethoscope className="h-3.5 w-3.5 mr-2" />
                    {t('nearby.clinics')}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab}>
                {filteredPlaces.length === 0 ? (
                  <Card className="border-dashed py-20 text-center">
                    <CardContent>
                      <Navigation className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <h3 className="text-lg font-semibold">{t('nearby.area_clear')}</h3>
                      <p className="text-muted-foreground max-w-[250px] mx-auto text-sm mt-1 mb-6">
                        {t('nearby.no_facilities_found')} <span className="text-primary font-bold">{searchRadius / 1000}km</span>.
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {searchRadius < 50000 && (
                          <Button onClick={() => setSearchRadius(50000)}>
                            <MapPin className="h-4 w-4 mr-2" />
                            {t('nearby.expand_50km')}
                          </Button>
                        )}
                        {searchQuery.length > 0 && (
                          <Button variant="outline" onClick={() => userLocation && fetchNearbyPlaces(userLocation.lat, userLocation.lon, 100000, true)}>
                            <Hospital className="h-4 w-4 mr-2" />
                            {t('nearby.search_globally', { query: searchQuery })}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPlaces.map((place) => {
                      const Icon = placeIcons[place.type] || MapPin;
                      return (
                        <Card
                          key={place.id}
                          className="group hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`p-2.5 rounded-xl ${placeColors[place.type]}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {formatDistance(place.distance)}
                              </Badge>
                            </div>

                            <div className="space-y-1 mb-4">
                              <h3 className="font-bold text-[15px] leading-snug group-hover:text-primary transition-colors line-clamp-1">
                                {place.name}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                                {place.address}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-muted">
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full h-8 text-[11px] font-bold tracking-tight shadow-md"
                                onClick={() => openInMaps(place)}
                              >
                                <Navigation className="h-3 w-3 mr-2" />
                                {t('nearby.go_to_maps')}
                              </Button>
                              {(place.phone) && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 shrink-0 border-muted hover:bg-success/10 hover:text-success hover:border-success/30 transition-all"
                                  onClick={() => window.open(`tel:${place.phone}`)}
                                >
                                  <Phone className="h-3 w-3" />
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
          </>
        )}
      </div>
    </Layout>
  );
}
