import 'server-only';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { Email } from './email';

// Envio pelo Amazon SES (E3-A; conta da Libergas em us-east-2, dominio libergas.com.br verificado, fora
// do sandbox - conferido por Daniel em 04/11). Credencial de um usuario IAM que so pode enviar e-mail.
// Nomes SES_* (e nao AWS_*): a Vercel reserva parte das variaveis AWS_* para a propria plataforma.

export const REMETENTE = 'Libergás – Leitura de gás <leitura@libergas.com.br>';
export const RESPONDER_PARA = 'libergas@libergas.com.br'; // G3 (Daniel, 04/11): caixa que os 6 usuarios acessam

let cliente: SESv2Client | null = null;

function sesCliente(): SESv2Client {
  if (cliente) return cliente;
  const accessKeyId = process.env.SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error('Envio de e-mail não configurado (SES_ACCESS_KEY_ID / SES_SECRET_ACCESS_KEY).');
  cliente = new SESv2Client({ region: process.env.SES_REGION || 'us-east-2', credentials: { accessKeyId, secretAccessKey } });
  return cliente;
}

export async function enviarEmail(para: string, email: Email): Promise<{ ok: true; id: string | null } | { ok: false; erro: string }> {
  try {
    const r = await sesCliente().send(new SendEmailCommand({
      FromEmailAddress: REMETENTE,
      Destination: { ToAddresses: [para] },
      ReplyToAddresses: [RESPONDER_PARA],
      Content: {
        Simple: {
          Subject: { Data: email.assunto, Charset: 'UTF-8' },
          Body: { Html: { Data: email.html, Charset: 'UTF-8' }, Text: { Data: email.texto, Charset: 'UTF-8' } },
        },
      },
    }));
    return { ok: true, id: r.MessageId ?? null };
  } catch (err) {
    const erro = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('[enviarEmail]', erro);
    return { ok: false, erro: erro.slice(0, 500) };
  }
}
