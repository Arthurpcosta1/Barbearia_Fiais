import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Credenciais públicas padrão do projeto Barbearia Fiais no Supabase
const DEFAULT_SUPABASE_URL = "https://uimrkgpgogvxqrutrujv.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_5i9uALTh6DFTP7BG830WcQ_0CHhkgEq";

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL || 
  DEFAULT_SUPABASE_URL
).trim();

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  DEFAULT_SUPABASE_KEY
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface Agendamento {
  id?: string;
  data: string; // 'YYYY-MM-DD'
  horario: string; // '14:00'
  servico: string;
  cliente_nome?: string | null;
  created_at?: string;
}

/**
 * Busca todos os horários agendados/bloqueados para uma data específica (YYYY-MM-DD).
 */
export async function getBookedSlotsByDate(date: string): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) {
    // Fallback local se o Supabase ainda não estiver configurado
    try {
      const local = localStorage.getItem('barbearia_fiais_booked_slots');
      if (local) {
        const parsed = JSON.parse(local);
        return parsed[date] || [];
      }
    } catch {
      // ignore
    }
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('horario')
      .eq('data', date);

    if (error) {
      console.error('Erro ao buscar horários no Supabase:', error);
      // Fallback em caso de erro transitório de rede
      try {
        const local = localStorage.getItem('barbearia_fiais_booked_slots');
        if (local) {
          const parsed = JSON.parse(local);
          return parsed[date] || [];
        }
      } catch {
        // ignore
      }
      return [];
    }

    const slots = (data || []).map((row) => row.horario);
    return slots;
  } catch (err) {
    console.error('Exceção ao consultar agendamentos:', err);
    return [];
  }
}

/**
 * Registra um agendamento e bloqueia o horário globalmente.
 * Retorna se foi bem sucedido ou se o horário já acabou de ser reservado.
 */
export async function bookSlotInDatabase(agendamento: {
  data: string;
  horario: string;
  servico: string;
  cliente_nome?: string;
}): Promise<{ success: boolean; alreadyBooked?: boolean; error?: string }> {
  // Salva no localStorage como cache/fallback imediato
  try {
    const local = localStorage.getItem('barbearia_fiais_booked_slots');
    const parsed = local ? JSON.parse(local) : {};
    const existing = parsed[agendamento.data] || [];
    if (!existing.includes(agendamento.horario)) {
      parsed[agendamento.data] = [...existing, agendamento.horario];
      localStorage.setItem('barbearia_fiais_booked_slots', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured || !supabase) {
    // Sem Supabase configurado, conclui com base no localStorage
    return { success: true };
  }

  try {
    // 1. Verificação prévia de colisão imediata
    const { data: existingSlots, error: checkError } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('data', agendamento.data)
      .eq('horario', agendamento.horario);

    if (!checkError && existingSlots && existingSlots.length > 0) {
      return {
        success: false,
        alreadyBooked: true,
        error: 'Este horário acabou de ser preenchido por outro cliente. Por favor, selecione outro horário.',
      };
    }

    // 2. Inserção no banco
    const { error: insertError } = await supabase
      .from('agendamentos')
      .insert([
        {
          data: agendamento.data,
          horario: agendamento.horario,
          servico: agendamento.servico,
          cliente_nome: agendamento.cliente_nome ? agendamento.cliente_nome.trim() : null,
        },
      ]);

    if (insertError) {
      // Código PostgreSQL 23505 = unique_violation (caso haja restrição UNIQUE(data, horario))
      if (
        insertError.code === '23505' ||
        insertError.message?.toLowerCase().includes('duplicate') ||
        insertError.message?.toLowerCase().includes('unique')
      ) {
        return {
          success: false,
          alreadyBooked: true,
          error: 'Este horário acabou de ser preenchido por outro cliente. Por favor, escolha outro horário.',
        };
      }

      console.error('Erro ao inserir agendamento no Supabase:', insertError);
      return {
        success: false,
        error: insertError.message || 'Falha ao sincronizar com o banco de dados.',
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exceção ao agendar:', err);
    return {
      success: false,
      error: err?.message || 'Erro inesperado na conexão com o banco.',
    };
  }
}

/**
 * Permite ao barbeiro/admin desmarcar/liberar todos os agendamentos de uma data.
 */
export async function clearBookedSlotsForDate(date: string): Promise<boolean> {
  try {
    const local = localStorage.getItem('barbearia_fiais_booked_slots');
    if (local) {
      const parsed = JSON.parse(local);
      delete parsed[date];
      localStorage.setItem('barbearia_fiais_booked_slots', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured || !supabase) return true;

  try {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('data', date);

    return !error;
  } catch (err) {
    console.error('Erro ao limpar agendamentos no banco:', err);
    return false;
  }
}

/**
 * Escuta em tempo real novos agendamentos inseridos no banco.
 */
export function subscribeToAgendamentos(onNewAgendamento: (agendamento: Agendamento) => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {};

  try {
    const channel = supabase
      .channel('realtime_agendamentos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agendamentos' },
        (payload) => {
          if (payload.new) {
            onNewAgendamento(payload.new as Agendamento);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription failed:', err);
    return () => {};
  }
}
