import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { config } from '../config.js';

// Initialize Resend
const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
    },
});

/**
 * Global sendMail function that prioritizes Resend SDK if available
 */
async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}): Promise<void> {
    const resendFrom = 'Sushi de Maksim <info@sushidemaksim.com>';
    const nodemailerFrom = `Sushi de Maksim <${config.smtp.user}>`;

    if (resend) {
        try {
            // Split if it's a comma-separated string
            const recipients = to.includes(',') ? to.split(',').map(e => e.trim()) : [to];

            const { error } = await resend.emails.send({
                from: resendFrom,
                to: recipients,
                subject,
                html,
            });

            if (error) {
                // If it's a verification issue and we're sending to the admin, try the sandbox domain
                if (
                    (error as any).message?.includes('not verified') ||
                    (error as any).statusCode === 403
                ) {
                    console.warn('⚠️ Domain not verified on Resend. Retrying via Sandbox...');
                    const sandboxFrom = 'Sushi de Maksim <onboarding@resend.dev>';

                    const sandboxRecipients = to.includes(',')
                        ? to.split(',').map(e => e.trim())
                        : [to];
                    const { error: retryError } = await resend.emails.send({
                        from: sandboxFrom,
                        to: sandboxRecipients,
                        subject: `[SANDBOX] ${subject}`,
                        html,
                    });

                    if (!retryError) {
                        console.log('✅ Sent via Sandbox successfully');
                        return;
                    }
                    console.error('❌ Resend Sandbox Error:', retryError);
                } else {
                    console.error('❌ Resend Error:', error);
                }

                // Final fallback to Nodemailer: MUST use nodemailerFrom matching auth user
                console.log('🔄 Falling back to Nodemailer...');
                await transporter.sendMail({ from: nodemailerFrom, to, subject, html });
            }
        } catch (err) {
            console.error('❌ Resend Exception:', err);
            try {
                await transporter.sendMail({ from: nodemailerFrom, to, subject, html });
            } catch (smtpErr) {
                console.error('❌ Nodemailer Fallback also failed:', smtpErr);
            }
        }
    } else {
        await transporter.sendMail({ from: nodemailerFrom, to, subject, html });
    }
}

/**
 * Send a password-reset email with a 6-digit code.
 */
export async function sendResetCodeEmail(to: string, code: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#ea580c,#f26522);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Sushi de Maksim</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#374151;font-size:16px;margin:0 0 8px;">Hola,</p>
      <p style="color:#374151;font-size:16px;margin:0 0 24px;">
        Has solicitado restablecer tu contraseña. Usa el siguiente código:
      </p>
      <div style="background:#FFF7ED;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#ea580c;">${code}</span>
      </div>
      <p style="color:#6B7280;font-size:14px;margin:0 0 8px;">
        Este código es válido durante <strong>15 minutos</strong>.
      </p>
      <p style="color:#6B7280;font-size:14px;margin:0;">
        Si no has solicitado este cambio, ignora este email.
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sushi de Maksim</p>
    </div>
  </div>
</body>
</html>`;

    await sendEmail({ to, subject: 'Código de recuperación — Sushi de Maksim', html });
}

/**
 * Send a birthday gift email with a dynamic discount code.
 */
export async function sendBirthdayGiftEmail(
    to: string,
    name: string,
    code: string,
    percent: number = 10
): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#ea580c,#f26522);padding:24px;text-align:center;position:relative;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">¡Feliz Cumpleaños!</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px;font-style:italic;">Queremos celebrar tu día especial</p>
    </div>
    <div style="padding:24px;text-align:center;">
      <p style="color:#374151;font-size:18px;margin:0 0 16px;font-weight:bold;">¡Hola ${name}!</p>
      <p style="color:#6B7280;font-size:16px;line-height:1.6;margin:0 0 32px;">
        En este día tan especial, para nosotros es un honor celebrarlo contigo. Te enviamos un regalo exclusivo para que disfrutes de lo que más te gusta:
      </p>
      
        <p style="color:#C2410C;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Tu Código Descuento</p>
        <div style="font-size:36px;font-weight:900;color:#ea580c;letter-spacing:5px;">${code}</div>
        <p style="color:#C2410C;font-size:20px;font-weight:bold;margin:12px 0 0;">-${percent}% EN TODO EL MENÚ</p>
      </div>

      <p style="color:#374151;font-size:15px;margin:0 0 32px;">
        *Válido para tu próximo pedido desde hoy. Solo tienes que introducir el código al finalizar tu compra.
      </p>

      <a href="${config.frontendUrl}/menu" style="display:inline-block;background:#ea580c;color:#ffffff;padding:16px 40px;border-radius:16px;text-decoration:none;font-weight:900;font-size:15px;box-shadow:0 8px 20px rgba(234,88,12,0.2);">CANJEAR MI REGALO</a>
    </div>
    
    <div style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="color:#9CA3AF;font-size:13px;margin:0 0 8px;">¡Que tengas un día maravilloso!</p>
      <p style="color:#9CA3AF;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
      <p style="color:#6b7280;font-size:11px;margin:12px 0 0;">*Por seguridad, por favor muestra tu DNI al repartidor para validar la fecha.</p>
    </div>
  </div>
</body>
</html>`;

    await sendEmail({
        to,
        subject: '¡Feliz Cumpleaños! Tu regalo te espera en Sushi de Maksim',
        html,
    });
}

/**
 * Send an order receipt email.
 */
export async function sendOrderReceiptEmail(
    to: string,
    orderData: any,
    isAdminCopy = false
): Promise<void> {
    const subject = isAdminCopy
        ? `[NUEVO PEDIDO] #${String(orderData.orderId).padStart(5, '0')} — Sushi de Maksim`
        : `Confirmación de Pedido #${String(orderData.orderId).padStart(5, '0')} — Sushi de Maksim`;

    const greeting = isAdminCopy ? '¡Hola Administrador!' : `¡Hola ${orderData.customerName}!`;

    // Parse notes for special instructions
    const notes = orderData.notes || '';
    let paymentMethod = orderData.paymentMethod || 'No especificado';
    let noCall = false;
    let noBuzzer = false;
    let scheduledTime = '';
    let customerNote = '';
    let promoString = '';

    // NEW: Robustly extract scheduled time from the DB column natively
    if (
        orderData.estimatedDeliveryTime &&
        !orderData.estimatedDeliveryTime.includes('min') &&
        orderData.estimatedDeliveryTime.match(/^\d{4}-\d{2}-\d{2}/)
    ) {
        const rawDate = orderData.estimatedDeliveryTime;
        const isoMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
        if (isoMatch) {
            scheduledTime = `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}${isoMatch[4]}`;
        } else {
            scheduledTime = rawDate;
        }
    }

    const parts = notes.split(' | ');
    let deliveryType = 'DOMICILIO';
    parts.forEach((part: string) => {
        if (part.includes('[TIPO:')) {
            deliveryType = part.replace('[TIPO: ', '').replace(']', '').replace('[TIPO:', '');
        } else if (
            (part.includes('[MÉTODO DE PAGO:') || part.includes('[PAGO:')) &&
            (!orderData.paymentMethod || orderData.paymentMethod === 'No especificado')
        ) {
            paymentMethod = part
                .replace('[MÉTODO DE PAGO: ', '')
                .replace('[MÉTODO DE PAGO:', '')
                .replace('[PAGO: ', '')
                .replace('[PAGO:', '')
                .replace(']', '')
                .trim();
        } else if (part.includes('[ENTREGA PROGRAMADA:') || part.includes('[PROGRAMADO:')) {
            if (!scheduledTime) {
                scheduledTime = part
                    .replace('[ENTREGA PROGRAMADA: ', '')
                    .replace('[ENTREGA PROGRAMADA:', '')
                    .replace('[PROGRAMADO: ', '')
                    .replace('[PROGRAMADO:', '')
                    .replace(']', '');

                // Reformat ISO 2026-04-04 14:00 to 04-04-2026 14:00
                const isoMatch = scheduledTime.match(/^(\d{4})-(\d{2})-(\d{2})(.*)$/);
                if (isoMatch) {
                    scheduledTime = `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}${isoMatch[4]}`;
                }
            }
        } else if (
            part.includes('[NO LLAMAR PARA CONFIRMACIÓN]') ||
            part.includes('[SIN CONFIRMACIÓN LLAMADA]')
        ) {
            noCall = true;
        } else if (
            part.includes('[NO LLAMAR AL TELEFONILLO - LLAMAR AL MÓVIL]') ||
            part.includes('[NO LLAMAR TIMBRE]')
        ) {
            noBuzzer = true;
        } else if (part.includes('[PROMO:')) {
            promoString = part
                .replace('[PROMO: ', '')
                .replace('[PROMO:', '')
                .replace(']', '')
                .trim();
        } else {
            customerNote += (customerNote ? ' | ' : '') + part;
        }
    });

    // Final override based on address if notes parsing missed it
    if (orderData.deliveryAddress === 'RECOGIDA') {
        deliveryType = 'RECOGIDA';
    }

    const regularItems = orderData.items.filter((item: any) => Number(item.menu_item_id) !== -1);
    const deliveryItem = orderData.items.find((item: any) => Number(item.menu_item_id) === -1);

    // Prepare WhatsApp message for admin
    let waUrl = '';
    let waMessage = '';
    if (isAdminCopy) {
        const itemsListText = regularItems
            .map((item: any) => {
                const opt = item.selected_option ? ` (${item.selected_option})` : '';
                const itemTotal = (item.price_at_time * item.quantity).toFixed(2);
                return `• ${item.name}${opt} x${item.quantity}: ${itemTotal}€`;
            })
            .join('\n');

        const deliveryFeeText = deliveryItem
            ? `\n• Gastos de Envío: ${deliveryItem.price_at_time.toFixed(2)}€`
            : '';

        const scheduledText = scheduledTime ? `\n*ENTREGA PROGRAMADA: ${scheduledTime}*` : '';

        const paymentMethodLabel =
            paymentMethod.toUpperCase().includes('TARJETA') ||
            paymentMethod.toLowerCase().includes('card')
                ? 'Tarjeta'
                : paymentMethod.toUpperCase().includes('EFECTIVO') ||
                    paymentMethod.toLowerCase().includes('cash')
                  ? 'Efectivo'
                  : paymentMethod;

        const statusMessage = `¡Hola! Hemos recibido tu pedido и ya lo estamos preparando. Te lo entregaremos en unos 30 - 60 minutos.\n\n`;
        waMessage = `${statusMessage}Tu pedido #${String(orderData.orderId).padStart(5, '0')} está confirmado${scheduledText}\n\n${itemsListText}${deliveryFeeText}\n\n*Total: ${orderData.total.toFixed(2)}€*\n*Método de pago: ${paymentMethodLabel}*`;
        const cleanPhone = orderData.phoneNumber.replace(/\D/g, '');
        // wa.me doesn't like '+' prefix usually, digits only is safest
        waUrl = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(waMessage)}`;
    }

    const itemsHtml = regularItems
        .map(
            (item: any) => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 12px 0;">
        <div style="font-weight: 600; color: #111827; font-size: 15px;">${item.name} ${item.quantity > 1 ? `<span style="color:#ea580c;">x${item.quantity}</span>` : ''}</div>
        ${item.selected_option ? `<div style="color: #ea580c; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 2px;">Opción: ${item.selected_option}</div>` : ''}
        <div style="color: #6b7280; font-size: 13px;">Precio unitario: ${item.price_at_time.toFixed(2).replace('.', ',')} €</div>
      </td>
      <td style="padding: 12px 0; text-align: right; vertical-align: top; font-weight: 700; color: #111827; font-size: 15px;">
        ${(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')} €
      </td>
    </tr>
  `
        )
        .join('');

    const deliveryHtml = deliveryItem
        ? `
    <tr>
      <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Gastos de Envío</td>
      <td style="padding: 8px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 700;">
        ${deliveryItem.price_at_time.toFixed(2).replace('.', ',')} €
      </td>
    </tr>
  `
        : '';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:10px auto;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
    
    <div style="background-color: #000000; padding: 24px 20px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 24px;">Sushi de Maksim</h1>
      <p style="color: #6b7280; margin: 8px 0 0; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Confirmación de Pedido</p>
    </div>

    <div style="padding: 16px 20px;">
      <h2 style="color: #111827; margin: 0 0 4px; font-size: 20px; font-weight: 800;">${greeting}</h2>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
        El pedido <strong>#${String(orderData.orderId).padStart(5, '0')}</strong> ha sido recibido con éxito.
      </p>

      ${
          isAdminCopy
              ? `
      <div style="margin-bottom: 24px;">
        <a href="${waUrl}" style="display: block; background-color: #25D366; color: #ffffff; padding: 16px 20px; border-radius: 16px; text-decoration: none; font-weight: 900; font-size: 16px; text-align: center; box-shadow: 0 4px 12px rgba(37,211,102,0.2); margin-bottom: 12px;">
          CONFIRMAR EN WHATSAPP
        </a>
        
        ${
            !deliveryType.includes('RECOGIDA')
                ? `
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderData.deliveryAddress + ', Madrid, Spain')}" target="_blank" style="display: block; background-color: #4285F4; color: #ffffff; padding: 14px 20px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; text-align: center; margin-bottom: 12px; line-height: 1.4;">
          🗺️ MAPA: ${orderData.deliveryAddress}
        </a>
        `
                : ''
        }

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${
                orderData.customerEmail
                    ? `
            <td style="width: 50%; padding-right: 4px;">
              <a href="mailto:${orderData.customerEmail}?subject=${encodeURIComponent(`Pedido #${String(orderData.orderId).padStart(5, '0')} — Sushi de Maksim`)}&body=${encodeURIComponent(waMessage.replace(/\*/g, ''))}" style="display: block; background-color: #ffffff; color: #111827; padding: 12px 0; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px; text-align: center; border: 1px solid #e2e8f0;">
                ✉️ RESPONDER EMAIL
              </a>
            </td>
            `
                    : ''
            }
            <td style="width: ${orderData.customerEmail ? '50%' : '100%'}; padding-left: 4px;">
              <a href="tel:${orderData.phoneNumber}" style="display: block; background-color: #ea580c; color: #ffffff; padding: 12px 0; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px; text-align: center;">
                📞 LLAMAR CLIENTE
              </a>
            </td>
          </tr>
        </table>
      </div>
      `
              : ''
      }

      <!-- Order Summary Card -->
      <div style="background-color: #f9fafb; border-radius: 16px; padding: 12px 16px; margin-bottom: 16px; border: 1px solid #f1f5f9;">
        <h3 style="color: #111827; margin: 0 0 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Resumen del Pedido</h3>
        
        <table style="width:100%; border-collapse:collapse;">
          ${itemsHtml}
          ${deliveryHtml}
        </table>

        <div style="margin-top: 8px; padding-top: 8px; border-top: 2px solid #e2e8f0;">
          <table style="width:100%; border-collapse:collapse;">
            ${
                promoString
                    ? `
            <tr>
              <td style="padding-top: 8px; color: #16a34a; font-size: 14px; font-weight: 700;">Descuento Promocional</td>
              <td style="padding-top: 8px; text-align: right; color: #16a34a; font-size: 14px; font-weight: 700;">${promoString}</td>
            </tr>
            `
                    : ''
            }
            <tr>
              <td style="padding-top: 8px; color: #111827; font-size: 18px; font-weight: 900;">TOTAL</td>
              <td style="padding-top: 8px; text-align: right; color: #ea580c; font-size: 20px; font-weight: 900;">${orderData.total.toFixed(2).replace('.', ',')} €</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Payment & Delivery Type -->
      <div style="margin-bottom: 16px;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top;">
              <h4 style="color: #9ca3af; margin: 0 0 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Método de Pago</h4>
              <div style="color: #111827; font-size: 15px; font-weight: 700;">
                ${paymentMethod.includes('TARJETA') ? 'Tarjeta' : 'Efectivo'}
              </div>
            </td>
            <td style="width: 50%; vertical-align: top;">
              <h4 style="color: #9ca3af; margin: 0 0 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Tipo de Entrega</h4>
              <div style="color: #111827; font-size: 15px; font-weight: 700;">
                ${deliveryType.includes('RECOGIDA') ? 'Recogida en Local' : 'Entrega a Domicilio'}
              </div>
            </td>
          </tr>
        </table>

        ${
            scheduledTime || noCall || noBuzzer || customerNote
                ? `
        <h4 style="color: #9ca3af; margin: 12px 0 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Instrucciones Especiales</h4>
        <div style="background-color: #FFF7ED; border-radius: 12px; padding: 12px; border: 1px solid #ffedd5;">
          ${scheduledTime ? `<div style="color: #111827; font-size: 13px; font-weight: 700; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #ffedd5;">Entrega programada: <span style="color: #ea580c;">${scheduledTime}</span></div>` : ''}
          ${noCall ? '<div style="color: #c2410c; font-size: 13px; font-weight: 700; margin-bottom: 4px;">No llamar para confirmar pedido</div>' : ''}
          ${noBuzzer ? '<div style="color: #c2410c; font-size: 13px; font-weight: 700; margin-bottom: 4px;">No llamar al timbre (llamar al móvil)</div>' : ''}
          ${customerNote ? `<div style="color: #4b5563; font-size: 13px; line-height: 1.4; margin-top: ${noCall || noBuzzer ? '8px' : '0'}; border-top: ${noCall || noBuzzer ? '1px solid #ffedd5' : 'none'}; padding-top: ${noCall || noBuzzer ? '8px' : '0'};"><strong>Mensaje:</strong> ${customerNote}</div>` : ''}
        </div>
        `
                : ''
        }
      </div>

      <!-- Delivery Details -->
      <h4 style="color: #9ca3af; margin: 0 0 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${deliveryType.includes('RECOGIDA') ? 'Punto de Recogida' : 'Detalles de Envío'}</h4>
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 12px; border: 1px solid #e2e8f0;">
        <div style="color: #4b5563; font-size: 13px; line-height: 1.5;">
          ${
              deliveryType.includes('RECOGIDA')
                  ? '<strong>Dirección:</strong> Calle Barrilero, 20, 28007 Madrid'
                  : `<strong>Dirección:</strong> ${orderData.deliveryAddress}`
          }
          <br>
          <strong>📱 Teléfono:</strong> ${orderData.phoneNumber}
        </div>
      </div>

      <!-- Store Info & Support -->
      <div style="margin-top: 12px; padding: 16px; background-color: #000000; border-radius: 16px; color: #ffffff;">
        <h4 style="color: #ea580c; margin: 0 0 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; text-align: center;">¿Necesitas algo? Contáctanos</h4>
        
        <table style="width:100%; border-collapse:collapse; margin-bottom: 16px;">
          <tr>
            <td style="width: 33%; padding: 0 4px;">
              <a href="https://wa.me/34631920312" style="display: block; background-color: #25D366; color: #ffffff; padding: 10px 0; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 12px; text-align: center;">WhatsApp</a>
            </td>
            <td style="width: 33%; padding: 0 4px;">
              <a href="mailto:info@sushidemaksim.com" style="display: block; background-color: #ffffff; color: #000000; padding: 10px 0; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 12px; text-align: center;">Email</a>
            </td>
            <td style="width: 33%; padding: 0 4px;">
              <a href="tel:+34631920312" style="display: block; background-color: #ea580c; color: #ffffff; padding: 10px 0; border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 12px; text-align: center;">Llamar</a>
            </td>
          </tr>
        </table>

        <h4 style="color: #6b7280; margin: 16px 0 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Horario de Atención</h4>
        <table style="width: 100%; color: #9ca3af; font-size: 11px; border-collapse: collapse;">
            <tr><td style="padding: 2px 0;">Miércoles – Jueves:</td><td style="text-align: right; color: #ffffff;">19:00 – 23:00</td></tr>
            <tr><td style="padding: 2px 0;">Viernes – Domingo:</td><td style="text-align: right; color: #ffffff;">14:00 – 23:00</td></tr>
            <tr><td style="padding: 2px 0;">Lunes – Martes:</td><td style="text-align: right;">Cerrado</td></tr>
        </table>
        
        <div style="margin-top: 12px; border-top: 1px solid #374151; padding-top: 12px; font-size: 10px; text-align: center; color: #6b7280;">
          <strong>Sushi de Maksim</strong><br>
          NIF: B02761906<br>
          Calle Barrilero, 20, 28007 Madrid
        </div>
      </div>

      <div style="margin-top: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 14px; font-style: italic; margin: 0;">
          Gracias por confiar en nosotros.<br>
          ¡Esperamos que disfrutes de la experiencia Maksim!
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #f1f5f9;">
      <p style="color: #9ca3af; font-size: 13px; margin: 0 0 12px;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
      <div style="color: #6b7280; font-size: 11px;">
        Este es un correo automático, por favor no respondas a este mensaje.
      </div>
    </div>

  </div>
</body>
</html>
  `;

    await sendEmail({ to: isAdminCopy ? config.adminEmail : to, subject, html });
}

/**
 * Send a welcome email to a new user.
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#000000,#333333);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Sushi de Maksim</h1>
    </div>
    <div style="padding:32px;text-align:center;">
      <h2 style="color:#111827;margin:0 0 16px;font-size:20px;">¡Hola ${name}!</h2>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Gracias por registrarte en **Sushi de Maksim**. Estamos encantados de tenerte con nosotros.
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 32px;">
        Prepárate para disfrutar del mejor sushi artesanal directamente en tu mesa. ¡Explora nuestro menú y haz tu primer pedido hoy mismo!
      </p>
      <a href="${config.frontendUrl}/menu" style="display:inline-block;background:#ea580c;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;box-shadow:0 4px 12px rgba(234,88,12,0.2);">VER EL MENÚ</a>
    </div>
    <div style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
    </div>
  </div>
</body>
</html>`;

    await sendEmail({
        to,
        subject: '¡Bienvenido a Sushi de Maksim!',
        html,
    });
}

/**
 * Send an email activation link to a new user.
 */
export async function sendVerificationEmail(
    to: string,
    name: string,
    token: string,
    promoCode: string,
    percent: number = 10,
    redirectTo?: string
): Promise<void> {
    const activationUrl = `${config.frontendUrl}/verify?token=${token}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.05);">
    
    <div style="background-color: #000000; padding: 32px 20px; text-align: center;">
      <h1 style="color:#fff;margin:0;font-size:32px;font-weight:900;text-transform:uppercase;letter-spacing:4px;display:inline-block;border:4px solid #fff;padding:10px 20px;">MAKSIM.</h1>
      <p style="color: #6b7280; margin: 10px 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Sushi de Autor</p>
    </div>

    <!-- Content -->
    <div style="padding: 24px 20px; text-align: center;">
      <h2 style="color: #111827; margin: 0 0 16px; font-size: 28px; font-weight: 800; line-height: 1.2;">¡Hola ${name}!</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
        Estamos muy felices de tenerte con nosotros. Para empezar a disfrutar del mejor sushi artesanal, activa tu cuenta y desbloquea tu regalo de bienvenida.
      </p>

      <!-- Welcome Gift Section -->
      <div style="background: #FFF7ED; border: 2px dashed #ffedd5; border-radius: 20px; padding: 24px; margin-bottom: 32px;">
        <p style="color: #c2410c; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 8px;">TU REGALO (-${percent}%)</p>
        <div style="color: #ea580c; font-size: 32px; font-weight: 900; margin-bottom: 8px;">${promoCode}</div>
        <p style="color: #9a3412; font-size: 14px; font-weight: bold; margin: 0 0 4px;">
          * Mínimo de pedido: <strong>20€</strong>
        </p>
        <p style="color: #9a3412; font-size: 14px; font-weight: bold; margin: 0;">
          Válido solo durante <strong>7 días</strong>
        </p>
      </div>

      <!-- Activation Button -->
      <a href="${activationUrl}" style="display:inline-block;background:#ea580c;color:#ffffff;padding:18px 40px;border-radius:18px;text-decoration:none;font-weight:900;font-size:16px;box-shadow:0 8px 25px rgba(234,88,12,0.25);margin-bottom:32px;">
        ACTIVAR MI CUENTA
      </a>

      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
        <a href="${activationUrl}" style="color: #ea580c; text-decoration: none;">${activationUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #f1f5f9;">
      <p style="color: #9ca3af; font-size: 13px; margin: 0 0 12px;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
      <div style="color: #6b7280; font-size: 11px;">
        Recibiste este correo porque te registraste en www.sushidemaksim.com
      </div>
    </div>

  </div>
</body>
</html>`;

    await sendEmail({
        to,
        subject: '¡Activa tu cuenta y recibe un regalo! — Sushi de Maksim',
        html,
    });
}

/**
 * Send an email change verification link to a user.
 */
export async function sendEmailChangeVerificationEmail(
    to: string,
    name: string,
    token: string
): Promise<void> {
    const activationUrl = `${config.frontendUrl}/verify-email-change?token=${token}`;
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.05);">
    
    <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Sushi de Maksim</h1>
      <p style="color: #6b7280; margin: 10px 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Confirmación de Email</p>
    </div>

    <div style="padding: 24px; text-align: center;">
      <h2 style="color: #111827; margin: 0 0 16px; font-size: 28px; font-weight: 800; line-height: 1.2;">¡Hola ${name}!</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
        Has solicitado cambiar tu correo electrónico en Sushi de Maksim. Para completar el proceso, por favor haz clic en el botón de abajo.
      </p>

      <a href="${activationUrl}" style="display:inline-block;background:#ea580c;color:#ffffff;padding:18px 40px;border-radius:18px;text-decoration:none;font-weight:900;font-size:16px;box-shadow:0 8px 25px rgba(234,88,12,0.25);margin-bottom:32px;">
        CONFIRMAR NUEVO EMAIL
      </a>

      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
        Este enlace es válido durante 24 horas. Si no has solicitado este cambio, puedes ignorar este mensaje de forma segura.
      </p>
    </div>

    <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #f1f5f9;">
      <p style="color: #9ca3af; font-size: 13px; margin: 0 0 12px;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
    </div>
  </div>
</body>
</html>`;

    await sendEmail({
        to,
        subject: 'Confirma tu nuevo correo electrónico — Sushi de Maksim',
        html,
    });
}

/**
 * Send a welcome email to a new newsletter subscriber.
 */
export async function sendNewsletterWelcomeEmail(
    to: string,
    promoCode: string,
    discountPercent: number = 5
): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);">
    <div style="background-color: #000000; padding: 24px 20px; text-align: center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Sushi de Maksim</h1>
    </div>
    <div style="background:linear-gradient(135deg,#000000,#333333);padding:24px;text-align:center;position:relative;">
      <h1 style="color:#fff;margin:0;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">¡Ya eres del Club!</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px;font-style:italic;">Bienvenido a la familia Sushi de Maksim</p>
    </div>
    <div style="padding:24px;text-align:center;">
      <p style="color:#374151;font-size:18px;margin:0 0 16px;font-weight:bold;">¡Hola!</p>
      <p style="color:#6B7280;font-size:16px;line-height:1.6;margin:0 0 32px;">
        Gracias por suscribirte. Como prometimos, aquí tienes un regalo especial para que disfrutes de tu próximo pedido con nosotros:
      </p>
      
      <div style="background:#FFF7ED;border:2px dashed #ffedd5;border-radius:20px;padding:32px;margin-bottom:32px;position:relative;">
        <p style="color:#c2410c;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Tu Código Promocional</p>
        <div style="font-size:36px;font-weight:900;color:#ea580c;letter-spacing:5px;">${promoCode}</div>
        <p style="color:#9a3412;font-size:20px;font-weight:bold;margin:12px 0 0;">-${discountPercent}% EN TU PRÓXIMO PEDIDO</p>
      </div>

      <p style="color:#374151;font-size:15px;margin:0 0 32px;">
        *Válido durante los próximos 7 días. Solo tienes que introducir el código al finalizar tu compra en la web.
      </p>

      <a href="${config.frontendUrl}/menu" style="display:inline-block;background:#ea580c;color:#ffffff;padding:16px 40px;border-radius:16px;text-decoration:none;font-weight:900;font-size:15px;box-shadow:0 8px 20px rgba(234,88,12,0.2);">¡PEDIR AHORA!</a>
    </div>
    
    <div style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
      <p style="color:#6b7280;font-size:10px;margin:12px 0 0;">Recibiste este email porque te suscribiste a nuestra newsletter en https://www.sushidemaksim.com</p>
    </div>
  </div>
</body>
</html>`;

    await sendEmail({
        to,
        subject: '¡Bienvenido al Club! Tu regalo de Sushi de Maksim te espera',
        html,
    });
}

/**
 * Send an abandoned cart reminder email.
 */
export async function sendAbandonedCartEmail(
    to: string,
    name: string,
    items: any[]
): Promise<void> {
    const itemsHtml = items
        .slice(0, 3)
        .map(
            (item: any) => `
        <div style="display: flex; align-items: center; margin-bottom: 12px; background: #f9fafb; padding: 10px; border-radius: 12px; border: 1px solid #f1f5f9;">
            <div style="font-weight: 800; font-size: 14px; color: #111827; flex: 1;">${item.menu_items?.name || 'Producto'}</div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 700;">${item.quantity} x ${item.menu_items?.price?.toFixed(2) || '0.00'} €</div>
        </div>
    `
        )
        .join('');

    const moreItems =
        items.length > 3
            ? `<p style="color: #6b7280; font-size: 13px; margin: 4px 0;">...y ${items.length - 3} productos más</p>`
            : '';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fdfbf7;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.06);border:1px solid #f1f5f9;">
    <div style="background:#000;padding:24px 24px;text-align:center;">
       <h1 style="color:#fff;margin:0;font-size:24px;">Sushi de Maksim</h1>
    </div>
    <div style="background:#111;padding:32px 24px;text-align:center;">
       <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">¿Se te antoja algo?</h1>
    </div>
    <div style="padding:32px 24px;text-align:center;">
      <p style="color:#111827;font-size:18px;margin:0 0 16px;font-weight:800;">¡Hola ${name}!</p>
      <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hemos guardado los productos que dejaste en tu cesta. Siguen esperándote, pero no por mucho tiempo. El sushi sabe mejor cuando está fresco... ¡y ahora mismo!
      </p>
      
      <div style="text-align: left; margin-bottom: 32px;">
        <h3 style="color: #9ca3af; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">En tu cesta:</h3>
        ${itemsHtml}
        ${moreItems}
      </div>

      <a href="${config.frontendUrl}/cart" style="display:inline-block;background:#ea580c;color:#ffffff;padding:18px 48px;border-radius:20px;text-decoration:none;font-weight:900;font-size:16px;box-shadow:0 10px 30px rgba(234,88,12,0.2);">VOLVER A MI CESTA</a>
      
      <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;">
        Si tienes problemas con tu pedido, escríbenos por WhatsApp.
      </p>
    </div>
    
    <div style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
    </div>
  </div>
</body>
</html>`;

    await sendEmail({
        to,
        subject: 'Te has olvidado algo delicioso...',
        html,
    });
}

/**
 * Send a reservation confirmation email to the customer and admin.
 */
export async function sendReservationEmail(
    reservationData: any,
    isAdminCopy = false
): Promise<void> {
    const subject = isAdminCopy
        ? `[NUEVA RESERVA] - ${reservationData.name} (${reservationData.guests} pers.)`
        : `Confirmación de Reserva — Sushi de Maksim`;

    const greeting = isAdminCopy ? '¡Hola Administrador!' : `¡Hola ${reservationData.name}!`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
        
        <div style="background-color: #000000; padding: 32px 20px; text-align: center;">
            <h1 style="color:#fff;margin:0;font-size:26px;">Sushi de Maksim</h1>
            <p style="color: #6b7280; margin: 10px 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Reserva de Mesa</p>
        </div>

        <div style="padding: 32px 24px;">
            <h2 style="color: #111827; margin: 0 0 8px; font-size: 24px; font-weight: 800;">${greeting}</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                ${
                    isAdminCopy
                        ? `Has recibido una nueva solicitud de reserva. Revisa los detalles a continuación:`
                        : `Hemos recibido tu solicitud de reserva en **Sushi de Maksim**. Nuestro equipo revisará la disponibilidad y te contactará pronto para confirmar.`
                }
            </p>

            ${
                isAdminCopy
                    ? (() => {
                          let dateStr = new Date(
                              reservationData.reservation_date
                          ).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                          });
                          dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
                          const waMessage = `Hola ${reservationData.name}, confirmo tu reserva para el ${dateStr} a las ${reservationData.reservation_time} (${reservationData.guests} personas). ¡Te esperamos!`;
                          const cleanPhone = reservationData.phone.replace(/\D/g, '');
                          const waUrl = `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(waMessage)}`;

                          return `
                <div style="margin-bottom: 24px; text-align: center;">
                    <a href="${waUrl}" style="display: block; background-color: #25D366; color: #ffffff; padding: 16px 20px; border-radius: 16px; text-decoration: none; font-weight: 900; font-size: 16px; text-align: center; box-shadow: 0 4px 12px rgba(37,211,102,0.2);">
                        CONFIRMAR EN WHATSAPP
                    </a>
                </div>
                `;
                      })()
                    : ''
            }

            <!-- Reservation Details Card -->
            <div style="background-color: #f9fafb; border-radius: 20px; padding: 24px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
                <h3 style="color: #9ca3af; margin: 0 0 16px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Detalles de la Reserva</h3>
                
                <table style="width:100%; border-collapse:collapse;">
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <div style="color: #6b7280; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Fecha</div>
                            <div style="color: #111827; font-size: 16px; font-weight: 700;">${new Date(reservationData.reservation_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <div style="color: #6b7280; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Hora</div>
                            <div style="color: #111827; font-size: 16px; font-weight: 700;">${reservationData.reservation_time}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                            <div style="color: #6b7280; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Personas</div>
                            <div style="color: #111827; font-size: 16px; font-weight: 700;">${reservationData.guests} comensales</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 0;">
                            <div style="color: #6b7280; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Contacto</div>
                            <div style="color: #111827; font-size: 16px; font-weight: 700;">${reservationData.phone}</div>
                        </td>
                    </tr>
                </table>

                ${
                    reservationData.notes
                        ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e2e8f0;">
                    <div style="color: #6b7280; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Notas / Comentarios</div>
                    <div style="color: #4b5563; font-size: 14px; font-style: italic; line-height: 1.5;">"${reservationData.notes}"</div>
                </div>
                `
                        : ''
                }
            </div>

            <!-- Next Steps / Actions -->
            ${
                !isAdminCopy
                    ? `
            <div style="background-color: #FFF7ED; border-radius: 16px; padding: 20px; text-align: center; border: 1px solid #ffedd5;">
                <p style="color: #c2410c; font-size: 14px; font-weight: 800; margin: 0;">
                    Tu reserva está en estado: PENDIENTE
                </p>
                <p style="color: #4b5563; font-size: 13px; margin: 8px 0 0;">
                    Te enviaremos otro email o te llamaremos para confirmar la mesa.
                </p>
            </div>
            `
                    : `
            <div style="text-align: center;">
                <a href="${config.frontendUrl}" style="display:inline-block;background:#000000;color:#ffffff;padding:16px 40px;border-radius:16px;text-decoration:none;font-weight:900;font-size:14px;box-shadow:0 8px 25px rgba(0,0,0,0.1);">GESTIONAR EN PANEL</a>
            </div>
            `
            }
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="color: #9ca3af; font-size: 13px; margin: 0 0 12px;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
            <div style="color: #6b7280; font-size: 11px;">
                Este es un correo automático de https://www.sushidemaksim.com
            </div>
        </div>

    </div>
</body>
</html>
    `;

    await sendEmail({ to: isAdminCopy ? config.adminEmail : reservationData.email, subject, html });
}

/**
 * Send a loyalty gift email (every 5th order).
 */
export async function sendLoyaltyGiftEmail(
    to: string,
    name: string,
    code: string,
    percent: number = 5
): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);">
    <div style="background-color: #000000; padding: 24px 20px; text-align: center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Sushi de Maksim</h1>
    </div>
    <div style="background:linear-gradient(135deg,#ea580c,#f26522);padding:24px;text-align:center;position:relative;">
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">¡Gracias por tu Fidelidad!</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px;font-style:italic;">Tu 4º pedido merece un premio</p>
    </div>
    <div style="padding:24px;text-align:center;">
      <p style="color:#374151;font-size:18px;margin:0 0 16px;font-weight:bold;">¡Hola ${name}!</p>
      <p style="color:#6B7280;font-size:16px;line-height:1.6;margin:0 0 32px;">
        Acabas de completar cuatro pedidos con nosotros... Eso significa que ya eres parte de la verdadera mafia del sushi. Para celebrarlo, tienes un descuento especial para tu <strong>5º pedido</strong>:
      </p>
      
      <div style="background:#FFF7ED;border:2px dashed #ffedd5;border-radius:20px;padding:32px;margin-bottom:32px;position:relative;">
        <p style="color:#c2410c;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Tu Código Exclusivo</p>
        <div style="font-size:32px;font-weight:900;color:#ea580c;letter-spacing:3px;">${code}</div>
        <p style="color:#c2410c;font-size:20px;font-weight:bold;margin:12px 0 0;">-${percent}% EN TU PRÓXIMO PEDIDO</p>
      </div>

      <p style="color:#374151;font-size:14px;margin:0 0 32px;">
        *Este código es para uso personal y es válido durante <strong>7 días</strong> a partir de hoy. Solo introdúcelo en la cesta.
      </p>

      <a href="${config.frontendUrl}/menu" style="display:inline-block;background:#ea580c;color:#ffffff;padding:16px 40px;border-radius:16px;text-decoration:none;font-weight:900;font-size:15px;box-shadow:0 8px 20px rgba(234,88,12,0.2);">PEDIR AHORA</a>
    </div>
    
    <div style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
      <p style="color:#6b7280;font-size:11px;margin:12px 0 0;">Regalo automático por tu lealtad a Sushi de Maksim</p>
    </div>
  </div>
</body>
</html>`;

    await sendEmail({
        to,
        subject: 'Tienes un premio por tu 4º pedido — Sushi de Maksim',
        html,
    });
}

/**
 * Send a loyalty dessert gift email (every 10th order).
 */
export async function sendDessertGiftEmail(to: string, name: string, code: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);">
    <div style="background-color: #000000; padding: 24px 20px; text-align: center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Sushi de Maksim</h1>
    </div>
    <div style="background:linear-gradient(135deg,#ea580c,#f26522);padding:24px;text-align:center;position:relative;">
      <h1 style="color:#fff;margin:0;font-size:26px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">¡Tu Roll Dulce de Regalo!</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:16px;font-style:italic;">¡Has completado 9 pedidos!</p>
    </div>
    <div style="padding:24px;text-align:center;">
      <p style="color:#374151;font-size:18px;margin:0 0 16px;font-weight:bold;">¡Felicidades ${name}!</p>
      <p style="color:#6B7280;font-size:16px;line-height:1.6;margin:0 0 32px;">
        Eres un verdadero embajador de Sushi de Maksim. Para celebrar tus 9 pedidos con nosotros, te invitamos a un <strong>Roll Dulce</strong> en tu <strong>10º pedido</strong>:
      </p>
      
      <div style="background:#FFF7ED;border:2px dashed #ffedd5;border-radius:20px;padding:32px;margin-bottom:32px;position:relative;">
        <p style="color:#c2410c;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Tu Código Regalo</p>
        <div style="font-size:32px;font-weight:900;color:#ea580c;letter-spacing:3px;">${code}</div>
        <p style="color:#c2410c;font-size:20px;font-weight:bold;margin:12px 0 0;">ROLL DULCE GRATIS EN TU PEDIDO</p>
      </div>

      <p style="color:#374151;font-size:14px;line-height:1.4;margin:0 0 32px;">
        *Introduce este código al finalizar tu compra y recibirás tu Roll Dulce de regalo. ¡Nosotros nos encargamos del resto!
        <br><br>
        <span style="font-size:12px;color:#9CA3AF;">Válido durante <strong>7 días</strong> a partir de hoy.</span>
      </p>

      <a href="${config.frontendUrl}/menu" style="display:inline-block;background:#ea580c;color:#ffffff;padding:16px 40px;border-radius:16px;text-decoration:none;font-weight:900;font-size:15px;box-shadow:0 8px 20px rgba(234,88,12,0.2);">CANJEAR MI ROLL DULCE</a>
    </div>
    
    <div style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
      <p style="color:#6b7280;font-size:11px;margin:12px 0 0;">Regalo exclusivo por tu fidelidad nivel Platino</p>
    </div>
  </div>
</body>
</html>`;

    await sendEmail({
        to,
        subject: '¡Felicidades! Tienes un Roll Dulce de regalo por tu 9º pedido',
        html,
    });
}

/**
 * Send a contact form message to the admin.
 */
export async function sendContactFormEmail(
    fromName: string,
    fromEmail: string,
    message: string
): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);">
    <div style="background:#111;padding:24px;text-align:center;">
       <h1 style="color:#fff;margin:0;font-size:20px;">Nuevo Mensaje de Contacto</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;"><strong>De:</strong> ${fromName} (${fromEmail})</p>
      <p style="margin:0 0 8px;"><strong>Mensaje:</strong></p>
      <div style="background:#f3f4f6;padding:20px;border-radius:12px;color:#4b5563;line-height:1.6;font-style:italic;">
        "${message}"
      </div>
    </div>
    <div style="background:#f9fafb;padding:24px;text-align:center;border-top:1px solid #f1f5f9;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">© ${new Date().getFullYear()} Sushi de Maksim | Madrid</p>
    </div>
  </div>
</body>
</html>`;

    await sendEmail({
        to: config.adminEmail,
        subject: `Mensaje de ${fromName} via sushidemaksim.com`,
        html,
    });
}
