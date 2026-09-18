// Edge Function: financial-advisor
//
// Recibe una pregunta del usuario, arma su contexto financiero (ingresos,
// gastos, metas, historial) consultando Postgres con el JWT del propio
// usuario (así RLS sigue aplicando: esta función nunca ve datos de nadie
// más), y consulta a Groq para responder. La IA solo tiene permiso de
// LEER ese contexto — nunca recibe herramientas para escribir en la base de
// datos ni para mover dinero. Esa restricción es responsabilidad de este
// archivo, no del modelo: no le damos tools, así que no puede actuar aunque
// "quisiera".
//
// Variables de entorno requeridas (Supabase → Project Settings → Edge Functions):
//   GROQ_API_KEY          — clave de la API de Groq (console.groq.com/keys)
//   SUPABASE_URL          — provisto automáticamente por la plataforma
//   SUPABASE_ANON_KEY     — provisto automáticamente por la plataforma

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
// "llama-3.3-70b-versatile" ya no existe en el catálogo de Groq (verificado
// contra /openai/v1/models). gpt-oss-120b es un modelo "razonador": gasta
// tokens pensando antes de escribir la respuesta visible, así que necesita
// suficiente margen en max_tokens (abajo) o el content puede llegar vacío.
const GROQ_MODEL = "openai/gpt-oss-120b";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  question: string;
  history?: ChatMessage[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Falta autenticación." }, 401);
    }

    const { question, history = [] }: RequestBody = await req.json();
    if (!question || typeof question !== "string") {
      return jsonResponse({ error: "Falta la pregunta." }, 400);
    }

    // Cliente "como el usuario": las políticas RLS de cada tabla deciden qué
    // filas puede leer, exactamente igual que si la app llamara a Supabase
    // directamente. Esta función nunca usa la service role key.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Sesión inválida." }, 401);
    }

    const context = await loadFinancialContext(supabase, user.id);
    const reply = await askGroq(question, history, context);

    return jsonResponse({ reply });
  } catch (error) {
    console.error("[financial-advisor] error:", error);
    return jsonResponse({ error: "No se pudo procesar la solicitud." }, 500);
  }
});

async function loadFinancialContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  const [{ data: income }, { data: goals }, { data: expenses }, { data: contributions }] =
    await Promise.all([
      supabase.from("income_configs").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("goals").select("*").eq("user_id", userId).order("month", { ascending: false }),
      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(60),
      supabase
        .from("contributions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(60),
    ]);

  return { income, goals: goals ?? [], expenses: expenses ?? [], contributions: contributions ?? [] };
}

async function askGroq(
  question: string,
  history: ChatMessage[],
  context: Awaited<ReturnType<typeof loadFinancialContext>>,
): Promise<string> {
  if (!GROQ_API_KEY) {
    return "El asesor financiero todavía no está configurado (falta GROQ_API_KEY).";
  }

  const systemPrompt = [
    "Eres el asesor financiero dentro de la app Quincena.",
    "Quincena ayuda al usuario a concentrar su ahorro en UNA sola meta por mes, elegida por una ruleta.",
    "Tu única función es responder preguntas usando el contexto financiero proporcionado (ingresos, gastos, metas, historial de aportes).",
    "Responde en español, de forma breve, cálida y directa. Usa cifras concretas del contexto cuando existan.",
    "Responde en texto plano: sin markdown, sin LaTeX ni notación matemática con \\[ \\] o $$ — la app solo muestra texto simple, no renderiza formato.",
    "NUNCA tomas decisiones por el usuario, NUNCA mueves dinero, NUNCA creas ni modificas metas o gastos: solo analizas y sugieres.",
    "Si el usuario pide algo fuera de lo financiero, redirige la conversación amablemente.",
    "",
    "Contexto financiero del usuario (JSON):",
    JSON.stringify(context),
  ].join("\n");

  // API de Groq: compatible con el formato de chat completions de OpenAI.
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 900,
      messages: [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[financial-advisor] Groq error:", errorText);
    throw new Error("Falló la llamada a Groq");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No pude generar una respuesta esta vez.";
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}
