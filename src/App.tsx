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
  LogOut,
  AlertTriangle,
  X,
  RefreshCw
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
import { 
  getBookedSlotsByDate, 
  bookSlotInDatabase, 
  clearBookedSlotsForDate, 
  subscribeToAgendamentos, 
  isSupabaseConfigured 
} from './lib/supabase';
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

  // Booked slots map (initial cached from localStorage, then synced with Supabase)
  const [bookedSlots, setBookedSlots] = useState<BookedSlotsMap>(() => loadBookedSlotsFromStorage());
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [bookingConflictError, setBookingConflictError] = useState<string | null>(null);
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState<string | null>(null);

  // Sync booked slots from Supabase whenever selectedDate changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSlots(true);
    setBookingConflictError(null);

    getBookedSlotsByDate(selectedDate)
      .then((slots) => {
        if (!isMounted) return;
        setBookedSlots((prev) => ({
          ...prev,
          [selectedDate]: slots,
        }));
      })
      .catch((err) => {
        console.error('Erro ao consultar horários no Supabase:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Real-time synchronization: listen for new bookings across all devices
  useEffect(() => {
    const unsubscribe = subscribeToAgendamentos((newAgendamento) => {
      if (newAgendamento && newAgendamento.data && newAgendamento.horario) {
        setBookedSlots((prev) => {
          const currentList = prev[newAgendamento.data] || [];
          if (currentList.includes(newAgendamento.horario)) return prev;
          return {
            ...prev,
            [newAgendamento.data]: [...currentList, newAgendamento.horario],
          };
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

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

  // Handler: Submits booking to Supabase first, verifies collision, then opens WhatsApp
  const handleBookingConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setBookingConflictError(null);
    setBookingSuccessMessage(null);

    // Client-side quick check
    if (bookedSlotsForSelectedDate.includes(selectedTime)) {
      setBookingConflictError('Este horário já está reservado para este dia. Por favor, selecione outro horário livre.');
      return;
    }

    setIsSubmittingBooking(true);

    try {
      const result = await bookSlotInDatabase({
        data: selectedDate,
        horario: selectedTime,
        servico: selectedService.name,
        cliente_nome: clientName,
      });

      if (!result.success) {
        setIsSubmittingBooking(false);
        if (result.alreadyBooked) {
          // Immediately block the slot on screen
          setBookedSlots((prev) => {
            const list = prev[selectedDate] || [];
            if (list.includes(selectedTime)) return prev;
            return {
              ...prev,
              [selectedDate]: [...list, selectedTime],
            };
          });
          setBookingConflictError(
            result.error || 'Atenção: este horário acabou de ser preenchido por outro cliente! Por favor, escolha outro horário disponível.'
          );
        } else {
          setBookingConflictError(result.error || 'Erro ao sincronizar agendamento. Tente novamente.');
        }
        return;
      }

      // Successful insertion in Supabase
      setBookedSlots((prev) => {
        const list = prev[selectedDate] || [];
        if (list.includes(selectedTime)) return prev;
        return {
          ...prev,
          [selectedDate]: [...list, selectedTime],
        };
      });

      setIsSubmittingBooking(false);
      setBookingSuccessMessage('Horário bloqueado com sucesso! Redirecionando para o WhatsApp...');

      // Open WhatsApp after database confirmation
      setTimeout(() => {
        window.open(whatsappBookingUrl, '_blank', 'noopener,noreferrer');
      }, 250);

      setTimeout(() => {
        setBookingSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setIsSubmittingBooking(false);
      setBookingConflictError('Ocorreu uma instabilidade na conexão com o banco. Tente novamente.');
    }
  };

  const handleClearSlotsForDate = async () => {
    if (!confirm(`Deseja liberar todos os agendamentos do dia ${formattedDate}?`)) return;
    await clearBookedSlotsForDate(selectedDate);
    setBookedSlots((prev) => {
      const updated = { ...prev };
      delete updated[selectedDate];
      return updated;
    });
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
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#d1a868] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                3. Escolha o horário
              </label>
              <div className="flex items-center gap-2">
                {isSupabaseConfigured ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400" title="Sincronização global via Supabase ativa">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Horários em tempo real
                  </span>
                ) : (
                  <span className="text-[10px] text-[#f4efe6]/40" title="Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para sincronização em tempo real">
                    Modo local
                  </span>
                )}
                {isLoadingSlots && (
                  <RefreshCw className="h-3 w-3 animate-spin text-[#d1a868]" title="Atualizando horários..." />
                )}
                {bookedSlotsForSelectedDate.length > 0 && (
                  <span className="text-[11px] text-rose-400 font-medium">
                    {bookedSlotsForSelectedDate.length} {bookedSlotsForSelectedDate.length === 1 ? 'reservado' : 'reservados'}
                  </span>
                )}
                {isAdminAuthenticated && bookedSlotsForSelectedDate.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSlotsForDate}
                    className="text-[10px] text-rose-300 underline hover:text-rose-200"
                    title="Liberar todos os agendamentos desta data"
                  >
                    (Liberar dia)
                  </button>
                )}
              </div>
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

          {/* ALERTA DE CONFLITO / AGENDAMENTO DUPLO */}
          {bookingConflictError && (
            <div
              id="alert-booking-conflict"
              role="alert"
              className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/50 bg-rose-950/70 p-3.5 text-rose-200 shadow-lg animate-in fade-in"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-rose-300">Horário Indisponível</p>
                <p className="mt-0.5 leading-relaxed text-[#f4efe6]/90">{bookingConflictError}</p>
              </div>
              <button
                type="button"
                onClick={() => setBookingConflictError(null)}
                className="text-rose-400 hover:text-white transition p-1"
                title="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* SUCESSO DE RESERVA */}
          {bookingSuccessMessage && (
            <div
              id="alert-booking-success"
              role="status"
              className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/70 p-3 text-xs text-emerald-200 shadow-md animate-in fade-in"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{bookingSuccessMessage}</span>
            </div>
          )}

          {/* SUMMARY & ACTION BUTTON */}
          <div className="rounded-xl bg-[#051522] p-4 border border-[#d1a868]/20 mb-4">
            <p className="text-xs text-[#f4efe6]/70 mb-1">Resumo do agendamento:</p>
            <div className="flex items-center justify-between font-bold text-sm text-white">
              <span>{selectedService.name} • {formattedDate} às {selectedTime}</span>
              <span className="text-[#d1a868] font-display text-base">{selectedService.price}</span>
            </div>
          </div>

          {/* Big WhatsApp Action Button with Database Sync & Conflict Protection */}
          <button
            id="btn-confirm-agendamento-whatsapp"
            type="button"
            disabled={isSubmittingBooking || bookedSlotsForSelectedDate.includes(selectedTime)}
            onClick={handleBookingConfirm}
            className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-4 text-center text-base font-extrabold uppercase tracking-wide text-white shadow-[0_8px_24px_rgba(5,150,105,0.4)] transition active:scale-[0.99] ${
              isSubmittingBooking
                ? 'bg-emerald-700 opacity-80 cursor-wait'
                : bookedSlotsForSelectedDate.includes(selectedTime)
                ? 'bg-gray-700 opacity-50 cursor-not-allowed text-[#f4efe6]/60 shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-emerald-900/40'
            }`}
          >
            {isSubmittingBooking ? (
              <>
                <RefreshCw className="h-5 w-5 shrink-0 animate-spin" />
                <span>Sincronizando e Abrindo WhatsApp...</span>
              </>
            ) : (
              <>
                <MessageCircle className="h-6 w-6 shrink-0" />
                <span>Notificar Barbeiro no WhatsApp</span>
              </>
            )}
          </button>
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
