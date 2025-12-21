import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Stethoscope,
  Menu,
  User,
  Calendar,
  FileText,
  Activity,
  MapPin,
  Video,
  LogOut,
  Settings,
  Shield,
  History,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const patientNavItems = [
  { href: '/symptom-checker', labelKey: 'nav.symptom_checker', icon: Activity },
  { href: '/appointments', labelKey: 'nav.appointments', icon: Calendar },
  { href: '/doctors', labelKey: 'nav.find_doctors', icon: Stethoscope },
  { href: '/reports', labelKey: 'nav.medical_reports', icon: FileText },
  { href: '/nearby', labelKey: 'nav.nearby_services', icon: MapPin },
];

const doctorNavItems = [
  { href: '/appointments', labelKey: 'nav.appointments', icon: Calendar },
  { href: '/consultations', labelKey: 'nav.consultations', icon: Video },
  { href: '/patients', labelKey: 'nav.patients', icon: User },
];

const adminNavItems = [
  { href: '/admin/doctors', labelKey: 'nav.manage_doctors', icon: Stethoscope },
  { href: '/admin/users', labelKey: 'nav.manage_users', icon: User },
  { href: '/admin/settings', labelKey: 'common.settings', icon: Settings },
];

export function Header() {
  const { t } = useTranslation();
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getNavItems = () => {
    switch (role) {
      case 'doctor':
        return doctorNavItems;
      case 'admin':
        return adminNavItems;
      default:
        return patientNavItems;
    }
  };

  const navItems = getNavItems();
  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="sticky top-4 z-50 w-full px-4 md:px-6">
      <div className="mx-auto max-w-7xl rounded-2xl glass-strong border-2 border-white/30 dark:border-white/10 px-4 shadow-xl">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-health shadow-lg shadow-emerald-500/30 transition-all group-hover:scale-110 group-hover:shadow-emerald-500/50">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <span className="hidden font-black text-xl sm:inline-block tracking-tight text-gradient group-hover:scale-105 transition-transform">
                Sanjeevani
              </span>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-all rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:scale-105"
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={profile?.avatar_url || undefined}
                          alt={profile?.full_name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-teal-400 text-white font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 glass-card" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.full_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {profile?.email}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Shield className="h-3 w-3 text-primary" />
                          <span className="text-xs text-primary font-medium capitalize">
                            {role}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem asChild className="focus:bg-primary/10 cursor-pointer">
                      <Link to="/profile">
                        <User className="mr-2 h-4 w-4" />
                        {t('common.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-primary/10 cursor-pointer">
                      <Link to="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        {t('common.settings')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('common.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72 glass-card border-none">
                    <div className="flex flex-col gap-6 mt-8">
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center">
                          <Stethoscope className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">{t('common.menu')}</span>
                      </div>
                      <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-4 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                          >
                            <item.icon className="h-5 w-5" />
                            {t(item.labelKey)}
                          </Link>
                        ))}
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" asChild className="hover:bg-primary/5 hover:text-primary">
                  <Link to="/auth">{t('common.sign_in')}</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                  <Link to="/auth?mode=signup">{t('common.get_started')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
