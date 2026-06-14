import { config } from '../config.js';
import { supabase } from '../db/supabase.js';
import { sendEmail } from '../utils/email.js';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const args = process.argv.slice(2);
    const isTest = args.includes('--test');
    const isSend = args.includes('--send');
    const testEmailIndex = args.indexOf('--test');
    const testEmail = testEmailIndex !== -1 ? args[testEmailIndex + 1] : null;

    // Support a direct list of emails
    const emailsArgIndex = args.indexOf('--emails');
    const targetEmails =
        emailsArgIndex !== -1 ? args[emailsArgIndex + 1].split(',').map(e => e.trim()) : null;

    console.log('--- 🍣 Sushi de Maksim: Spain World Cup Match Correction Email ---');
    console.log(`Frontend URL: ${config.frontendUrl}`);

    let recipients: string[] = [];

    if (isTest && testEmail) {
        recipients = [testEmail];
        console.log(`🧪 Running in TEST mode. Target email: ${testEmail}`);
    } else if (targetEmails) {
        recipients = targetEmails;
        console.log(`🎯 Sending to manual target emails: ${recipients.join(', ')}`);
    } else {
        // Fetch subscribers
        const { data: subscribers, error: subErr } = await supabase
            .from('newsletter_subscribers')
            .select('email');
        if (subErr) {
            console.error('Error fetching subscribers:', subErr);
            process.exit(1);
        }

        // Fetch registered users
        const { data: users, error: userErr } = await supabase.from('users').select('email');
        if (userErr) {
            console.error('Error fetching users:', userErr);
            process.exit(1);
        }

        const emailSet = new Set<string>();
        subscribers?.forEach(s => {
            if (s.email) emailSet.add(s.email.toLowerCase().trim());
        });
        users?.forEach(u => {
            if (u.email) emailSet.add(u.email.toLowerCase().trim());
        });

        recipients = Array.from(emailSet);
        console.log(`👥 Found ${recipients.length} unique subscriber & user emails.`);
    }

    if (recipients.length === 0) {
        console.log('❌ No recipients found. Exiting.');
        process.exit(0);
    }

    const subject =
        '⚠️ [CORRECCIÓN DE HORA] ¡Apoya a la Roja desde las 17:30h en Sushi de Maksim! 🇪🇸⚽';
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background-color: #000000; padding: 32px 20px; text-align: center;">
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:900;text-transform:uppercase;letter-spacing:4px;display:inline-block;border:4px solid #fff;padding:10px 20px;">MAKSIM.</h1>
      <p style="color: #6b7280; margin: 10px 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Sushi de Autor</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px 24px; text-align: center;">
      <span style="display:inline-block;background-color:#fffbeb;border:1px solid #fde68a;color:#d97706;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;padding:6px 16px;border-radius:20px;margin-bottom:20px;">
        ⚠️ ACTUALIZACIÓN DE HORARIO ⚽
      </span>
      
      <h2 style="color: #111827; margin: 0 0 16px; font-size: 26px; font-weight: 800; line-height: 1.2; text-transform: uppercase;">
        Corrección de horario para mañana lunes
      </h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px; text-align: left;">
        Estimado cliente, te enviamos este correo para corregir el horario de nuestro evento especial de mañana lunes para el debut de la <strong>Selección Española</strong>.
      </p>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 28px; text-align: left;">
        El partido y la transmisión en nuestra pantalla gigante comenzarán a las <strong>18:00h</strong> (y no a las 21:00h como indicamos por error en el correo anterior). Estaremos <strong>recibiendo reservas y abriendo mesas a partir de las 17:30h</strong> para que puedas acomodarte antes del inicio del juego.
      </p>

      <!-- Event Highlights box -->
      <div style="background: #FFF7ED; border: 2px dashed #ffedd5; border-radius: 20px; padding: 24px; margin-bottom: 32px; text-align: left;">
        <h3 style="color: #ea580c; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 16px;">NUEVOS DETALLES DEL EVENTO</h3>
        
        <div style="margin-bottom: 12px; font-size: 15px; color: #111827; display: flex; align-items: center; gap: 8px;">
          📅 <strong>Fecha:</strong> Lunes, 15 de Junio
        </div>
        <div style="margin-bottom: 12px; font-size: 15px; color: #111827; display: flex; align-items: center; gap: 8px;">
          ⏰ <strong>Hora:</strong> Transmisión desde las 18:00h (Reservas desde las 17:30h)
        </div>
        <div style="margin-bottom: 12px; font-size: 15px; color: #111827; display: flex; align-items: center; gap: 8px;">
          📍 <strong>Dirección:</strong> Calle Barrilero, 20, 28007 Madrid (Barrio de Retiro)
        </div>
        <div style="background-color: #ffedd5; border-radius: 12px; padding: 12px; margin-top: 16px; font-size: 14px; color: #c2410c; font-weight: bold;">
          🍺 PROMO SELECCIÓN: Botella de Cerveza de Verano (0.33l) a solo 2€ durante toda la transmisión del partido.
        </div>
      </div>

      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 32px; text-align: left;">
        Lamentamos cualquier inconveniente que hayamos podido causar. Las mesas son muy limitadas y esperamos completar el aforo rápidamente. ¡Reserva la tuya hoy mismo!
      </p>

      <!-- CTA Button -->
      <a href="${config.frontendUrl}/reservar" style="display:inline-block;background:#ea580c;color:#ffffff;padding:18px 40px;border-radius:18px;text-decoration:none;font-weight:900;font-size:16px;box-shadow:0 8px 25px rgba(234,88,12,0.25);margin-bottom:24px;text-transform:uppercase;letter-spacing:1px;">
        Reservar Mesa Ahora
      </a>
      
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #f1f5f9;">
      <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">Calle Barrilero, 20, 28007 Madrid | Tel: +34 631 920 312</p>
    </div>

  </div>
</body>
</html>`;

    if (isSend || targetEmails || (isTest && testEmail)) {
        console.log(`🚀 Sending correction email to ${recipients.length} recipients...`);
        const failed: string[] = [];
        for (let i = 0; i < recipients.length; i++) {
            const email = recipients[i];
            try {
                await sendEmail({ to: email, subject, html });
                console.log(`[${i + 1}/${recipients.length}] ✅ Sent to ${email}`);
            } catch (err) {
                console.error(`[${i + 1}/${recipients.length}] ❌ Failed for ${email}`);
                failed.push(email);
            }
            await sleep(250); // Delay of 250ms (max 4 reqs/sec) to avoid Resend rate limiting (5 reqs/sec)
        }
        console.log('\n🏁 Finished sending.');
        if (failed.length > 0) {
            console.log(`⚠️ Failed recipients (${failed.length}): ${failed.join(', ')}`);
        } else {
            console.log('🎉 All emails sent successfully!');
        }
    } else {
        console.log('\n📝 DRY RUN: No emails were sent.');
        console.log('To send a test email, run:');
        console.log('   npx tsx src/scripts/sendSpainMatchCorrection.ts --test <your-email>');
        console.log('To send to ALL subscribers and users, run:');
        console.log('   npx tsx src/scripts/sendSpainMatchCorrection.ts --send\n');
    }
}

main().catch(console.error);
