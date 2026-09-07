import { supabase } from "@/lib/supabase";
import type { AdvisorMessage } from "@/types";

export interface AskAdvisorResult {
  reply: string;
}

/**
 * Envía la pregunta del usuario a la Edge Function `financial-advisor`, que
 * arma el contexto financiero en el servidor (ingresos, gastos, metas,
 * historial) y consulta a Claude. El cliente nunca ve ni manda credenciales
 * de la API de Claude, y la IA nunca recibe permisos para escribir datos.
 */
export async function askAdvisor(
  question: string,
  history: AdvisorMessage[],
): Promise<AskAdvisorResult> {
  const { data, error } = await supabase.functions.invoke("financial-advisor", {
    body: {
      question,
      history: history.slice(-10).map((message) => ({
        role: message.role,
        content: message.content,
      })),
    },
  });

  if (error) throw error;
  return data as AskAdvisorResult;
}
