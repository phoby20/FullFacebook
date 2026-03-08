export function resetPasswordTemplate(resetUrl: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0">
      <tr>
        <td align="center">

          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;padding:40px;box-shadow:0 8px 30px rgba(0,0,0,0.08)">

            <tr>
              <td align="center" style="padding-bottom:20px">
                <h2 style="margin:0;font-size:24px;color:#111">
                  Password Reset
                </h2>
              </td>
            </tr>

            <tr>
              <td style="font-size:16px;color:#444;padding-bottom:24px;text-align:center">
                We received a request to reset your password.
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-bottom:30px">

                <a href="${resetUrl}"
                   style="
                   background:#2563eb;
                   color:#ffffff;
                   padding:14px 26px;
                   border-radius:8px;
                   text-decoration:none;
                   font-size:16px;
                   font-weight:600;
                   display:inline-block;">
                   Reset Password
                </a>

              </td>
            </tr>

            <tr>
              <td style="font-size:14px;color:#666;text-align:center;padding-bottom:20px">
                This link will expire in <b>1 hour</b>.
              </td>
            </tr>

            <tr>
              <td style="font-size:13px;color:#888;text-align:center;padding-bottom:20px">
                If the button above doesn't work, copy and paste this URL into your browser:
              </td>
            </tr>

            <tr>
              <td style="word-break:break-all;text-align:center;font-size:13px;color:#2563eb">
                <a href="${resetUrl}" style="color:#2563eb;text-decoration:none">
                  ${resetUrl}
                </a>
              </td>
            </tr>

            <tr>
              <td style="font-size:12px;color:#999;text-align:center;padding-top:30px">
                If you did not request this email, you can safely ignore it.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
}
