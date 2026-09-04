import React, { useState } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Phone, 
  MapPin, 
  Clock, 
  Scissors, 
  Instagram, 
  Image as ImageIcon,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { BarbershopConfig, Service, GalleryItem } from '../types';
import { cleanPhoneForWhatsApp } from '../data/barbershop';

type EditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  config: BarbershopConfig;
  onSave: (newConfig: BarbershopConfig) => void;
  onReset: () => void;
};

export function EditModal({ isOpen, onClose, config, onSave, onReset }: EditModalProps) {
  const [currentTab, setCurrentTab] = useState<'geral' | 'servicos' | 'horarios' | 'fotos' | 'exportar'>('geral');
  const [form, setForm] = useState<BarbershopConfig>({ ...config });
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if config prop changes
  React.useEffect(() => {
    setForm({ ...config });
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleCopyCode = () => {
    const code = JSON.stringify(form, null, 2);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Service helpers
  const handleUpdateService = (index: number, field: keyof Service, value: string) => {
    const updated = [...form.services];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, services: updated });
  };

  const handleAddService = () => {
    const newService: Service = {
      id: `servico-${Date.now()}`,
      name: 'Novo Serviço',
      price: 'R$ 30,00',
      duration: '30 min',
      description: 'Descrição do novo serviço para corte ou cuidado.',
      iconName: 'Scissors',
    };
    setForm({ ...form, services: [...form.services, newService] });
  };

  const handleRemoveService = (index: number) => {
    const updated = form.services.filter((_, i) => i !== index);
    setForm({ ...form, services: updated });
  };

  // Time slots helpers
  const handleAddTimeSlot = (time: string) => {
    if (!time.trim() || form.timeSlots.includes(time.trim())) return;
    const updated = [...form.timeSlots, time.trim()].sort();
    setForm({ ...form, timeSlots: updated });
  };

  const handleRemoveTimeSlot = (time: string) => {
    setForm({ ...form, timeSlots: form.timeSlots.filter(t => t !== time) });
  };

  // Gallery helpers
  const handleAddGalleryItem = (url: string, title: string) => {
    if (!url.trim()) return;
    const newItem: GalleryItem = {
      id: `img-${Date.now()}`,
      src: url.trim(),
      alt: title || 'Corte Barbearia Fiais',
      title: title || 'Corte Estilizado',
    };
    setForm({ ...form, gallery: [...form.gallery, newItem] });
  };

  const handleRemoveGalleryItem = (id: string) => {
    setForm({ ...form, gallery: form.gallery.filter(item => item.id !== id) });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md">
      <div 
        id="edit-barbershop-modal"
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl border border-[#c7a767]/40 bg-[#082338] text-[#f6f1e7] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#c7a767]/20 bg-[#041827] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c7a767]/40 bg-[#123b59]/50 text-[#c7a767]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-2xl uppercase tracking-wider text-[#e2d0a3]">
                Editar Site da Barbearia
              </h3>
              <p className="text-xs text-[#f6f1e7]/70">
                Altere telefone, serviços, preços, horários e endereço em tempo real
              </p>
            </div>
          </div>
          <button
            id="btn-close-edit-modal"
            type="button"
            onClick={onClose}
            aria-label="Fechar editor"
            className="rounded-lg p-2 text-[#f6f1e7]/70 hover:bg-[#123b59] hover:text-white transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-[#c7a767]/15 bg-[#061d2e] px-4 pt-2">
          <button
            type="button"
            onClick={() => setCurrentTab('geral')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              currentTab === 'geral'
                ? 'border-[#c7a767] text-[#c7a767]'
                : 'border-transparent text-[#f6f1e7]/60 hover:text-white'
            }`}
          >
            <Phone className="h-4 w-4" />
            Contato & Local
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('servicos')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              currentTab === 'servicos'
                ? 'border-[#c7a767] text-[#c7a767]'
                : 'border-transparent text-[#f6f1e7]/60 hover:text-white'
            }`}
          >
            <Scissors className="h-4 w-4" />
            Serviços & Preços ({form.services.length})
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('horarios')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              currentTab === 'horarios'
                ? 'border-[#c7a767] text-[#c7a767]'
                : 'border-transparent text-[#f6f1e7]/60 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            Horários ({form.timeSlots.length})
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('fotos')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              currentTab === 'fotos'
                ? 'border-[#c7a767] text-[#c7a767]'
                : 'border-transparent text-[#f6f1e7]/60 hover:text-white'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Galeria ({form.gallery.length})
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('exportar')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              currentTab === 'exportar'
                ? 'border-[#c7a767] text-[#c7a767]'
                : 'border-transparent text-[#f6f1e7]/60 hover:text-white'
            }`}
          >
            <Copy className="h-4 w-4" />
            Exportar / Código
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB: GERAL */}
          {currentTab === 'geral' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-[#c7a767]/25 bg-[#041827]/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#c7a767] flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> WhatsApp de Atendimento
                  </span>
                  <span className="text-[11px] text-[#f6f1e7]/60">
                    Número que recebe as mensagens de agendamento
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#e2d0a3] mb-1">
                      WhatsApp (apenas números com DDD)
                    </label>
                    <input
                      type="text"
                      value={form.whatsappNumber}
                      onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                      placeholder="Ex: 5581999999999 ou 81999999999"
                      className="w-full rounded-md border border-[#c7a767]/30 bg-[#082338] px-3 py-2 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-[#f6f1e7]/60">
                      Link gerado: wa.me/{cleanPhoneForWhatsApp(form.whatsappNumber)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#e2d0a3] mb-1">
                      Texto exibido para o cliente
                    </label>
                    <input
                      type="text"
                      value={form.phoneDisplay}
                      onChange={(e) => setForm({ ...form, phoneDisplay: e.target.value })}
                      placeholder="Ex: (81) 98765-4321"
                      className="w-full rounded-md border border-[#c7a767]/30 bg-[#082338] px-3 py-2 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Instagram & Redes */}
              <div className="rounded-lg border border-[#c7a767]/25 bg-[#041827]/60 p-4">
                <span className="text-xs font-black uppercase tracking-wider text-[#c7a767] flex items-center gap-1.5 mb-3">
                  <Instagram className="h-4 w-4" /> Instagram da Barbearia
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#e2d0a3] mb-1">
                      Link do Perfil do Instagram
                    </label>
                    <input
                      type="text"
                      value={form.instagramUrl}
                      onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                      placeholder="https://instagram.com/barbeariafiais"
                      className="w-full rounded-md border border-[#c7a767]/30 bg-[#082338] px-3 py-2 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#e2d0a3] mb-1">
                      Arroba / Nome de Usuário
                    </label>
                    <input
                      type="text"
                      value={form.instagramHandle}
                      onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                      placeholder="@barbeariafiais"
                      className="w-full rounded-md border border-[#c7a767]/30 bg-[#082338] px-3 py-2 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="rounded-lg border border-[#c7a767]/25 bg-[#041827]/60 p-4">
                <span className="text-xs font-black uppercase tracking-wider text-[#c7a767] flex items-center gap-1.5 mb-3">
                  <MapPin className="h-4 w-4" /> Endereço & Localização
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#e2d0a3] mb-1">Rua e Número</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full rounded-md border border-[#c7a767]/30 bg-[#082338] px-3 py-2 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#e2d0a3] mb-1">Bairro e Cidade</label>
                    <input
                      type="text"
                      value={`${form.neighborhood}, ${form.city}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(',');
                        setForm({
                          ...form,
                          neighborhood: parts[0]?.trim() || '',
                          city: parts[1]?.trim() || form.city,
                        });
                      }}
                      className="w-full rounded-md border border-[#c7a767]/30 bg-[#082338] px-3 py-2 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#e2d0a3] mb-1">Link Google Maps</label>
                    <input
                      type="text"
                      value={form.googleMapsUrl}
                      onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
                      className="w-full rounded-md border border-[#c7a767]/30 bg-[#082338] px-3 py-2 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Horários de Funcionamento */}
              <div className="rounded-lg border border-[#c7a767]/25 bg-[#041827]/60 p-4">
                <span className="text-xs font-black uppercase tracking-wider text-[#c7a767] flex items-center gap-1.5 mb-3">
                  <Clock className="h-4 w-4" /> Horário de Funcionamento
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-[#e2d0a3] mb-1">Dias de Abertura</label>
                    <input
                      type="text"
                      value={form.openingDays}
                      onChange={(e) => setForm({ ...form, openingDays: e.target.value })}
                      className="w-full rounded-md border border-[#c7a767]/30 bg-[#082338] px-3 py-2 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#e2d0a3] mb-1">Faixa de Horário</label>
                    <input
                      type="text"
                      value={form.openingHours}
                      onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                      className="w-full rounded-md border border-[#c7a767]/30 bg-[#082338] px-3 py-2 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#e2d0a3] mb-1">Frase de Destaque / Slogan</label>
                    <input
                      type="text"
                      value={form.tagline}
                      onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                      className="w-full rounded-md border border-[#c7a767]/30 bg-[#082338] px-3 py-2 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SERVIÇOS & PREÇOS */}
          {currentTab === 'servicos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-xl uppercase text-[#e2d0a3]">Lista de Serviços</h4>
                  <p className="text-xs text-[#f6f1e7]/70">Edite os preços e nomes exibidos no menu e no WhatsApp</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="flex items-center gap-1.5 rounded-md bg-[#c7a767] px-3 py-2 text-xs font-black uppercase tracking-wide text-[#041827] hover:bg-[#e2d0a3] transition"
                >
                  <Plus className="h-4 w-4" /> Adicionar Serviço
                </button>
              </div>

              <div className="space-y-3">
                {form.services.map((service, index) => (
                  <div
                    key={service.id}
                    className="flex flex-col gap-3 rounded-lg border border-[#c7a767]/25 bg-[#041827]/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display text-lg uppercase text-[#e2d0a3]">
                        <Scissors className="h-4 w-4 text-[#c7a767]" />
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(index)}
                        className="p-1 text-red-400 hover:text-red-300 transition"
                        title="Excluir serviço"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-[#c7a767] mb-1">Nome do Serviço</label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => handleUpdateService(index, 'name', e.target.value)}
                          className="w-full rounded border border-[#c7a767]/30 bg-[#082338] px-2.5 py-1.5 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-[#c7a767] mb-1">Preço</label>
                        <input
                          type="text"
                          value={service.price}
                          onChange={(e) => handleUpdateService(index, 'price', e.target.value)}
                          placeholder="R$ 35,00"
                          className="w-full rounded border border-[#c7a767]/30 bg-[#082338] px-2.5 py-1.5 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-[#c7a767] mb-1">Duração Estimada</label>
                        <input
                          type="text"
                          value={service.duration}
                          onChange={(e) => handleUpdateService(index, 'duration', e.target.value)}
                          placeholder="45 min"
                          className="w-full rounded border border-[#c7a767]/30 bg-[#082338] px-2.5 py-1.5 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#c7a767] mb-1">Descrição Curta</label>
                      <input
                        type="text"
                        value={service.description}
                        onChange={(e) => handleUpdateService(index, 'description', e.target.value)}
                        className="w-full rounded border border-[#c7a767]/30 bg-[#082338] px-2.5 py-1.5 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: HORÁRIOS */}
          {currentTab === 'horarios' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-display text-xl uppercase text-[#e2d0a3]">Horários de Atendimento para Agendamento</h4>
                <p className="text-xs text-[#f6f1e7]/70">
                  Os clientes podem selecionar qualquer um destes horários no site para enviar pelo WhatsApp
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {form.timeSlots.map((time) => (
                  <div
                    key={time}
                    className="flex items-center gap-2 rounded-md border border-[#c7a767]/30 bg-[#041827] px-3 py-2 text-sm font-bold text-white"
                  >
                    <span>{time}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTimeSlot(time)}
                      className="text-[#f6f1e7]/50 hover:text-red-400 transition"
                      title="Remover horário"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add time slot */}
              <div className="mt-4 rounded-lg border border-[#c7a767]/20 bg-[#041827]/40 p-4">
                <label className="block text-xs font-bold text-[#e2d0a3] mb-1">Adicionar novo horário (ex: 13:30)</label>
                <div className="flex gap-2 max-w-xs">
                  <input
                    id="input-new-timeslot"
                    type="time"
                    className="rounded border border-[#c7a767]/30 bg-[#082338] px-3 py-1.5 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('input-new-timeslot') as HTMLInputElement;
                      if (input && input.value) {
                        handleAddTimeSlot(input.value);
                        input.value = '';
                      }
                    }}
                    className="rounded bg-[#c7a767] px-3 py-1.5 text-xs font-bold uppercase text-[#041827] hover:bg-[#e2d0a3] transition"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FOTOS */}
          {currentTab === 'fotos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display text-xl uppercase text-[#e2d0a3]">Fotos da Barbearia</h4>
                  <p className="text-xs text-[#f6f1e7]/70">Imagens exibidas na seção "Cortes da Casa"</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {form.gallery.map((item) => (
                  <div
                    key={item.id}
                    className="relative group overflow-hidden rounded-lg border border-[#c7a767]/30 bg-[#041827]"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-black/40">
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-display text-sm uppercase text-white truncate">{item.title || item.alt}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryItem(item.id)}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add custom photo URL */}
              <div className="rounded-lg border border-[#c7a767]/20 bg-[#041827]/40 p-4">
                <span className="block text-xs font-bold text-[#e2d0a3] mb-2">Adicionar foto por URL</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    id="input-new-photo-url"
                    type="url"
                    placeholder="URL da imagem (ex: /images/baiano1.jpeg ou link web)"
                    className="rounded border border-[#c7a767]/30 bg-[#082338] px-3 py-1.5 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                  />
                  <input
                    id="input-new-photo-title"
                    type="text"
                    placeholder="Título do corte (ex: Degradê Navalhado)"
                    className="rounded border border-[#c7a767]/30 bg-[#082338] px-3 py-1.5 text-sm text-white focus:border-[#c7a767] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const urlInput = document.getElementById('input-new-photo-url') as HTMLInputElement;
                    const titleInput = document.getElementById('input-new-photo-title') as HTMLInputElement;
                    if (urlInput && urlInput.value) {
                      handleAddGalleryItem(urlInput.value, titleInput ? titleInput.value : '');
                      urlInput.value = '';
                      if (titleInput) titleInput.value = '';
                    }
                  }}
                  className="mt-2 rounded bg-[#c7a767] px-3 py-1.5 text-xs font-bold uppercase text-[#041827] hover:bg-[#e2d0a3] transition"
                >
                  Adicionar à Galeria
                </button>
              </div>
            </div>
          )}

          {/* TAB: EXPORTAR */}
          {currentTab === 'exportar' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-display text-xl uppercase text-[#e2d0a3]">Salvar & Exportar Configuração</h4>
                <p className="text-xs text-[#f6f1e7]/70">
                  Suas alterações já ficam salvas no navegador. Se desejar atualizar o seu repositório no GitHub, você pode copiar os dados configurados abaixo!
                </p>
              </div>

              <div className="relative">
                <pre className="max-h-72 overflow-y-auto rounded-lg border border-[#c7a767]/20 bg-[#041827] p-4 text-xs font-mono text-[#e2d0a3]/90">
                  {JSON.stringify(form, null, 2)}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="absolute top-3 right-3 flex items-center gap-1.5 rounded bg-[#c7a767] px-3 py-1.5 text-xs font-bold text-[#041827] hover:bg-[#e2d0a3] transition shadow"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copiado!' : 'Copiar JSON'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#c7a767]/20 bg-[#041827] px-6 py-4">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Deseja restaurar as configurações originais da Barbearia Fiais?')) {
                onReset();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#f6f1e7]/60 hover:text-red-400 transition"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Originais
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#c7a767]/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#f6f1e7]/80 hover:border-[#c7a767] hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              id="btn-save-edit-barbershop"
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 rounded-md bg-[#c7a767] px-5 py-2 text-xs font-black uppercase tracking-wider text-[#041827] hover:bg-[#e2d0a3] transition shadow-[0_8px_20px_rgba(199,167,103,0.3)]"
            >
              {savedSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {savedSuccess ? 'Salvo!' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
