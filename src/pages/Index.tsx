import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import {
  Stethoscope,
  Activity,
  Calendar,
  FileText,
  MapPin,
  Video,
  Shield,
  ArrowRight,
  Heart,
  Sparkles,
  Clock,
  Users,
  CheckCircle,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Activity,
    titleKey: 'landing.feature_symptom_title',
    descriptionKey: 'landing.feature_symptom_desc',
    gradient: 'gradient-health',
  },
  {
    icon: Video,
    titleKey: 'landing.feature_video_title',
    descriptionKey: 'landing.feature_video_desc',
    gradient: 'gradient-medical',
  },
  {
    icon: Calendar,
    titleKey: 'landing.feature_scheduling_title',
    descriptionKey: 'landing.feature_scheduling_desc',
    gradient: 'gradient-energy',
  },
  {
    icon: FileText,
    titleKey: 'landing.feature_records_title',
    descriptionKey: 'landing.feature_records_desc',
    gradient: 'gradient-vitality',
  },
  {
    icon: MapPin,
    titleKey: 'landing.feature_nearby_title',
    descriptionKey: 'landing.feature_nearby_desc',
    gradient: 'gradient-medical',
  },
  {
    icon: Shield,
    titleKey: 'landing.feature_security_title',
    descriptionKey: 'landing.feature_security_desc',
    gradient: 'gradient-health',
  },
];

const stats = [
  { value: '10K+', labelKey: 'landing.happy_patients', icon: Users, color: 'text-emerald-600' },
  { value: '500+', labelKey: 'landing.expert_doctors', icon: Stethoscope, color: 'text-blue-600' },
  { value: '4.9/5', labelKey: 'landing.user_rating', icon: Sparkles, color: 'text-purple-600' },
  { value: '24/7', labelKey: 'landing.support_available', icon: Clock, color: 'text-orange-600' },
];

export default function Index() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="flex flex-col gap-16 md:gap-24 pb-16">
        {/* Hero Section - Vibrant & Dynamic */}
        <section className="relative pt-12 md:pt-24 pb-16 overflow-hidden">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-emerald-950/20 dark:via-blue-950/20 dark:to-purple-950/20"></div>

          {/* Floating Particles */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute top-40 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow delay-300"></div>
            <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse-slow delay-500"></div>
          </div>

          <div className="container mx-auto px-4 text-center space-y-10">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-strong text-sm font-bold shadow-xl animate-fade-in-scale border-2 border-emerald-200 dark:border-emerald-800">
              <Heart className="h-5 w-5 fill-rose-500 text-rose-500 animate-heartbeat" />
              <span className="text-gradient">{t('landing.hero_trusted')}</span>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>

            {/* Hero Title */}
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-up">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight">
                <span className="text-foreground/90">{t('landing.hero_title')}</span>
                <br />
                <span className="text-gradient-vitality">
                  {t('landing.hero_title_highlight')}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
                {t('landing.hero_desc')}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up delay-200">
              {user ? (
                <Button
                  asChild
                  size="lg"
                  className="btn-gradient text-lg px-10 py-7 rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/50 group h-auto"
                >
                  <Link to="/dashboard" className="flex items-center gap-2">
                    Explore Now
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="btn-gradient text-lg px-10 py-7 rounded-2xl font-bold shadow-2xl hover:shadow-emerald-500/50 group h-auto"
                  >
                    <Link to="/auth" className="flex items-center gap-2">
                      Get Started Free
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="text-lg px-10 py-7 rounded-2xl font-bold border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl h-auto"
                  >
                    <Link to="/symptom-checker" className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Try Symptom Checker
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Health Metrics Preview */}
            <div className="flex justify-center gap-3 flex-wrap animate-fade-up delay-300">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 hover:scale-105 transition-transform">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">AI Powered</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Secure & Private</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">24/7 Available</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid - Gradient Cards */}
        <section className="container mx-auto px-4 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black">
              <span className="text-gradient-vitality">{t('landing.ecosystem_title')}</span>
            </h2>
            <p className="text-xl text-muted-foreground font-medium">{t('landing.ecosystem_desc')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card
                key={feature.titleKey}
                className="glass-card border-2 border-white/50 dark:border-white/10 hover:shadow-2xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-2 transition-all duration-300 group overflow-hidden"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="p-8 space-y-4">
                  <div className={`w-16 h-16 rounded-2xl ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-gradient transition-colors">{t(feature.titleKey)}</h3>
                    <p className="text-muted-foreground leading-relaxed text-base">{t(feature.descriptionKey)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section - Vibrant Gradient */}
        <section className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 gradient-vitality animate-gradient"></div>
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

            <div className="relative z-10 p-12 md:p-20 text-center space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-white max-w-3xl mx-auto leading-tight">
                {t('landing.cta_ready')}
              </h2>
              <p className="text-white/90 text-xl md:text-2xl max-w-2xl mx-auto font-medium">
                {t('landing.cta_join')}
              </p>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="h-16 px-12 rounded-2xl text-xl shadow-2xl hover:scale-105 transition-all font-bold bg-white text-emerald-600 hover:bg-white/90"
              >
                <Link to="/auth?mode=signup" className="flex items-center gap-2">
                  {t('landing.create_free_account')}
                  <CheckCircle className="h-6 w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
