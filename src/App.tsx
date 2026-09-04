import React, { useEffect, useMemo, useState } from 'react';
import { 
  Clock, 
  MapPin, 
  MessageCircle, 
  Scissors, 
  Sparkles, 
  Edit3, 
  Calendar, 
  User, 
  Wand2, 
  BadgeCheck, 
  ExternalLink,
  CheckCircle2,
  Lock,
  LogOut
} from 'lucide-react';
import { LogoMark } from './components/LogoMark';
import { EditModal } from './components/EditModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { 
  loadBarbershopConfig, 
  saveBarbershopConfig, 
  resetBarbershopConfig, 
  buildWhatsAppBookingLink,
  buildGenericWhatsAppLink 
} from './data/barbershop';
import { BarbershopConfig } from './types';

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

type BookedSlotsMap = Record<string, string[]>;

const BOOKED_SLOTS_STORAGE_KEY = 'barbearia_fiais_booked_slots';

function loadBookedSlotsFromStorage(): BookedSlotsMap {
  try {
    const raw = localStorage.getItem(BOOKED_SLOTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load booked slots from storage', e);
  }
  return {};
}

function saveBookedSlotToStorage(dateStr: string, timeStr: string): BookedSlotsMap {
  try {
    const current = loadBookedSlotsFromStorage();
    const currentForDate = current[dateStr] || [];
    if (!currentForDate.includes(timeStr)) {
      const updated: BookedSlotsMap = {
        ...current,
        [dateStr]: [...currentForDate, timeStr],
      };
      localStorage.setItem(BOOKED_SLOTS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch (e) {
    console.error('Failed to save booked slot', e);
    return loadBookedSlotsFromStorage();
  }
}

export default function App() {
  const [config, setConfig] = useState<BarbershopConfig>(() => loadBarbershopConfig());
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('barbearia_fiais_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Check URL query param ?admin or #admin on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('admin') || window.location.hash.includes('admin')) {
        if (!isAdminAuthenticated) {
          setIsAdminLoginOpen(true);
        } else {
          setIsEditOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [isAdminAuthenticated]);

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    try {
      localStorage.setItem('barbearia_fiais_admin_auth', 'true');
    } catch (e) {
      console.error(e);
    }
    setIsAdminLoginOpen(false);
    setIsEditOpen(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem('barbearia_fiais_admin_auth');
    } catch (e) {
      console.error(e);
    }
    setIsEditOpen(false);
  };

  // Booking states
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => config.services[0]?.id || 'cabelo');
  const todayDateStr = useMemo(() => getTodayDateString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [selectedTime, setSelectedTime] = useState<string>('14:00');
  const [clientName, setClientName] = useState<string>('');

  // Booked slots map from localStorage
  const [bookedSlots, setBookedSlots] = useState<BookedSlotsMap>(() => loadBookedSlotsFromStorage());

  const bookedSlotsForSelectedDate = useMemo(() => {
    return bookedSlots[selectedDate] || [];
  }, [bookedSlots, selectedDate]);

  // If current selectedTime is booked for the chosen date, automatically select first available
  useEffect(() => {
    if (bookedSlotsForSelectedDate.includes(selectedTime)) {
      const firstAvailable = config.timeSlots.find(
        (slot) => !bookedSlotsForSelectedDate.includes(slot)
      );
      if (firstAvailable) {
        setSelectedTime(firstAvailable);
      }
    }
  }, [selectedDate, bookedSlotsForSelectedDate, selectedTime, config.timeSlots]);

  const selectedService = useMemo(() => {
    return config.services.find((s) => s.id === selectedServiceId) || config.services[0] || {
      id: 'cabelo',
      name: 'Cabelo',
      price: 'R$ 35,00',
      duration: '45 min',
      description: 'Corte tradicional',
      iconName: 'Scissors',
    };
  }, [config.services, selectedServiceId]);

  const formattedDate = useMemo(() => {
    return formatDateBR(selectedDate);
  }, [selectedDate]);

  const whatsappBookingUrl = useMemo(() => {
    return buildWhatsAppBookingLink(
      config.whatsappNumber,
      selectedService.name,
      selectedService.price,
      selectedTime,
      formattedDate,
      clientName
    );
  }, [config.whatsappNumber, selectedService, selectedTime, formattedDate, clientName]);

  const genericWhatsAppUrl = useMemo(() => {
    return buildGenericWhatsAppLink(config.whatsappNumber);
  }, [config.whatsappNumber]);

  const handleBookingClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!selectedDate || !selectedTime) {
      e.preventDefault();
      return;
    }

    if (bookedSlotsForSelectedDate.includes(selectedTime)) {
      e.preventDefault();
      alert('Este horário já foi reservado para esta data. Por favor, escolha outro horário disponível.');
      return;
    }

    // Save chosen slot to localStorage immediately
    const updated = saveBookedSlotToStorage(selectedDate, selectedTime);
    setBookedSlots(updated);
  };

  const handleSaveConfig = (newConfig: BarbershopConfig) => {
    setConfig(newConfig);
    saveBarbershopConfig(newConfig);
  };

  const handleResetConfig = () => {
    const defaultConf = resetBarbershopConfig();
    setConfig(defaultConf);
  };

  const renderServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wand2':
        return <Wand2 className="h-4 w-4" />;
      case 'BadgeCheck':
        return <BadgeCheck className="h-4 w-4" />;
      case 'Sparkles':
        return <Sparkles className="h-4 w-4" />;
      case 'Scissors':
      default:
        return <Scissors className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#071b2b] text-[#f4efe6] antialiased selection:bg-[#d1a868] selection:text-[#071b2b]">
      {/* Top minimal bar */}
      <header className="border-b border-[#d1a868]/20 bg-[#051522]/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg tracking-wider text-[#d1a868]">BARBEARIA FIAIS</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isAdminAuthenticated ? (
              <button
                id="btn-header-admin-login"
                type="button"
                onClick={() => setIsAdminLoginOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d1a868]/40 bg-[#061826] px-2.5 py-1.5 text-xs font-semibold text-[#d1a868] hover:bg-[#d1a868]/15 hover:border-[#d1a868] transition shadow-sm"
                title="Acesso exclusivo ao barbeiro e proprietário"
              >
                <Lock className="h-3 w-3 text-[#d1a868]" />
                <span>Área do Dono</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-edit-site"
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#d1a868] bg-[#d1a868] px-2.5 py-1.5 text-xs font-bold text-[#051522] hover:bg-[#e0b879] transition shadow-sm"
                  title="Painel de controle do proprietário"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Editar Página</span>
                </button>
                <button
                  id="btn-admin-logout-header"
                  type="button"
                  onClick={handleAdminLogout}
                  className="rounded-lg border border-white/10 px-2 py-1.5 text-xs text-[#f4efe6]/60 hover:text-rose-300 hover:border-rose-400/40 transition"
                  title="Sair do modo administrador"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              </div>
            )}
            <a
              id="btn-header-whatsapp"
              href={genericWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8 space-y-6">
        {/* LOGO HERO - Direct, clean */}
        <section className="text-center">
          <div className="mb-3">
            <LogoMark />
          </div>
          <p className="text-xs text-[#f4efe6]/70">
            WhatsApp: <strong className="text-[#d1a868]">{config.phoneDisplay}</strong>
          </p>
        </section>

        {/* PRIMARY BOOKING CARD */}
        <section id="agendamento" className="rounded-2xl border border-[#d1a868]/30 bg-[#092237] p-5 sm:p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between border-b border-[#d1a868]/20 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-display uppercase tracking-wider text-[#f4efe6]">
                Agendar Horário
              </h2>
              <p className="text-xs text-[#d1a868]">
                Selecione e envie a notificação direto para o barbeiro
              </p>
            </div>
            <div className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
              Online
            </div>
          </div>

          {/* 1. Escolha o Serviço */}
          <div className="space-y-2 mb-5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#d1a868] flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5" />
              1. Escolha o serviço
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {config.services.map((service) => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <button
                    key={service.id}
                    id={`service-select-${service.id}`}
                    type="button"
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-[#d1a868] bg-[#d1a868] text-[#071b2b] shadow-md scale-[1.01]'
                        : 'border-[#d1a868]/25 bg-[#061826] text-white hover:border-[#d1a868]/60 hover:bg-[#071d2e]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isSelected ? 'text-[#071b2b]' : 'text-[#d1a868]'}>
                        {renderServiceIcon(service.iconName)}
                      </span>
                      <p className="font-bold text-sm leading-tight">{service.name}</p>
                    </div>
                    <span className={`font-display text-base font-bold ${isSelected ? 'text-[#071b2b]' : 'text-[#d1a868]'}`}>
                      {service.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Escolha a Data */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between">
              <label htmlFor="input-booking-date" className="text-xs font-bold uppercase tracking-wider text-[#d1a868] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                2. Escolha a data
              </label>
              <span className="text-[11px] font-semibold text-[#d1a868]">
                {formattedDate}
              </span>
            </div>
            <div className="relative">
              <input
                id="input-booking-date"
                type="date"
                min={todayDateStr}
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-[#d1a868]/40 bg-[#061826] px-4 py-3 text-sm font-semibold text-[#f4efe6] shadow-inner focus:border-[#d1a868] focus:outline-none focus:ring-1 focus:ring-[#d1a868] [color-scheme:dark] cursor-pointer transition hover:border-[#d1a868]/70"
              />
            </div>
            <p className="text-[11px] text-[#f4efe6]/50">
              Data selecionada: <strong className="text-[#d1a868]">{formattedDate}</strong>
            </p>
          </div>

          {/* 3. Escolha o Horário */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#d1a868] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                3. Escolha o horário
              </label>
              {bookedSlotsForSelectedDate.length > 0 && (
                <span className="text-[11px] text-rose-400 font-medium">
                  {bookedSlotsForSelectedDate.length} {bookedSlotsForSelectedDate.length === 1 ? 'horário reservado' : 'horários reservados'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {config.timeSlots.map((time) => {
                const isBooked = bookedSlotsForSelectedDate.includes(time);
                const isSelected = selectedTime === time && !isBooked;

                return (
                  <button
                    key={time}
                    id={`timeslot-${time.replace(':', '')}`}
                    type="button"
                    disabled={isBooked}
                    onClick={() => {
                      if (!isBooked) {
                        setSelectedTime(time);
                      }
                    }}
                    title={isBooked ? 'Horário já reservado para esta data' : `Selecionar ${time}`}
                    className={`py-2 rounded-lg border text-xs font-bold transition ${
                      isBooked
                        ? 'line-through cursor-not-allowed opacity-50 border-white/10 bg-[#061826]/40 text-[#f4efe6]/40'
                        : isSelected
                        ? 'border-[#d1a868] bg-[#d1a868] text-[#071b2b] shadow-sm'
                        : 'border-[#d1a868]/20 bg-[#061826] text-white hover:border-[#d1a868]/50'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Nome do Cliente (Opcional) */}
          <div className="space-y-1.5 mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-[#d1a868] flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              4. Seu nome (opcional)
            </label>
            <input
              id="input-client-name"
              type="text"
              placeholder="Digite seu nome para o barbeiro"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-lg border border-[#d1a868]/30 bg-[#061826] px-3.5 py-2.5 text-sm text-white placeholder-[#f4efe6]/40 focus:border-[#d1a868] focus:outline-none"
            />
          </div>

          {/* SUMMARY & ACTION BUTTON */}
          <div className="rounded-xl bg-[#051522] p-4 border border-[#d1a868]/20 mb-4">
            <p className="text-xs text-[#f4efe6]/70 mb-1">Resumo do agendamento:</p>
            <div className="flex items-center justify-between font-bold text-sm text-white">
              <span>{selectedService.name} • {formattedDate} às {selectedTime}</span>
              <span className="text-[#d1a868] font-display text-base">{selectedService.price}</span>
            </div>
          </div>

          {/* Big WhatsApp Action Button */}
          <a
            id="btn-confirm-agendamento-whatsapp"
            href={whatsappBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBookingClick}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-4 text-center text-base font-extrabold uppercase tracking-wide text-white shadow-[0_8px_24px_rgba(5,150,105,0.4)] transition hover:bg-emerald-500 active:scale-[0.99]"
          >
            <MessageCircle className="h-6 w-6 shrink-0" />
            <span>Notificar Barbeiro no WhatsApp</span>
          </a>
        </section>

        {/* COMPACT LOCATION & CONTACT INFO */}
        <section className="rounded-2xl border border-[#d1a868]/20 bg-[#092237]/70 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-[#d1a868]/20 p-2 text-[#d1a868]">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">Localização</h3>
              <p className="text-xs text-[#f4efe6]/70 mt-0.5">
                {config.address} - {config.neighborhood}, {config.city}
              </p>
              <a
                id="btn-google-maps"
                href={config.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#d1a868] hover:underline"
              >
                <span>Abrir no Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="border-t border-[#d1a868]/15 pt-3 flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-[#d1a868]/20 p-2 text-[#d1a868]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Horário de Funcionamento</h3>
              <p className="text-xs text-[#f4efe6]/70 mt-0.5">
                {config.openingDays}: {config.openingHours}
              </p>
            </div>
          </div>
        </section>

        {/* COMPACT PHOTOS GALLERY */}
        {config.gallery && config.gallery.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d1a868]">
              Cortes na Barbearia Fiais
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {config.gallery.map((photo) => (
                <div 
                  key={photo.id}
                  className="aspect-square overflow-hidden rounded-xl border border-[#d1a868]/20 bg-[#092237]"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="h-full w-full object-cover transition hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MINIMAL FOOTER */}
        <footer className="pt-4 pb-8 text-center text-xs text-[#f4efe6]/50 space-y-2">
          <p>© {new Date().getFullYear()} Barbearia Fiais • Recife - PE</p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[#d1a868]">
            <a
              id="link-footer-whatsapp"
              href={genericWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              WhatsApp: {config.phoneDisplay}
            </a>
            <span>•</span>
            <a
              id="link-footer-instagram"
              href={config.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {config.instagramHandle}
            </a>
          </div>
          <div className="pt-3">
            {!isAdminAuthenticated ? (
              <button
                id="btn-footer-admin-access"
                type="button"
                onClick={() => setIsAdminLoginOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#d1a868]/75 hover:text-[#d1a868] transition"
                title="Acesso exclusivo ao barbeiro e proprietário"
              >
                <Lock className="h-3.5 w-3.5 text-[#d1a868]" />
                <span>Acesso do Dono / Barbeiro</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d1a868]/40 bg-[#051522] px-3 py-1">
                <span className="text-[11px] font-semibold text-[#d1a868]">
                  Modo Dono Ativo
                </span>
                <button
                  id="btn-footer-edit"
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="text-[11px] text-[#f4efe6] underline hover:text-[#d1a868]"
                >
                  Editar Página
                </button>
                <span className="text-[#f4efe6]/30">•</span>
                <button
                  id="btn-footer-logout"
                  type="button"
                  onClick={handleAdminLogout}
                  className="text-[11px] text-rose-300 hover:underline"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </footer>
      </main>

      {/* ADMIN LOGIN MODAL */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        currentPin={config.adminPin || '1999'}
      />

      {/* EDIT MODAL FOR ARTHUR & OWNER */}
      <EditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        config={config}
        onSave={handleSaveConfig}
        onReset={handleResetConfig}
      />
    </div>
  );
}
