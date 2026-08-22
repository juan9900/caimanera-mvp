# Configuración de correo (Resend vía SMTP custom de Supabase)

Todos los correos de autenticación (confirmación de registro, recuperación de
contraseña, cambio de email) los envía **Supabase directamente**, usando
Resend como servidor SMTP custom. La app no llama a la API de Resend ni
guarda su API key — vive únicamente en la config de Supabase.

El código ya está listo (flujo de signup, `/recuperar`, `/restablecer`,
`app/auth/confirm/route.ts`, y los templates en `docs/email-templates/`).
Falta esta configuración manual, una sola vez, en Resend y Supabase.

## 1. Verificar el dominio en Resend

En [resend.com](https://resend.com) → Domains → agregar `lauretta.dev` y
cargar los registros DNS (SPF/DKIM/DMARC) que te da Resend en el proveedor
del dominio. Sin el dominio verificado, Resend rechaza los envíos desde
`infokancha@lauretta.dev`.

## 2. Configurar SMTP custom en Supabase

Dashboard del proyecto → **Authentication → Emails → SMTP Settings** → activar
"Enable Custom SMTP" y completar:

| Campo         | Valor                          |
| ------------- | ------------------------------- |
| Host          | `smtp.resend.com`               |
| Port          | `465` (SSL) o `587` (STARTTLS)  |
| Username      | `resend`                        |
| Password      | tu API key de Resend (`re_...`) |
| Sender email  | `infokancha@lauretta.dev`       |
| Sender name   | `Kancha`                        |

## 3. Pegar los templates

Dashboard → **Authentication → Email Templates**:

- **Confirm signup** → pegar el contenido de `docs/email-templates/confirm-signup.html`.
- **Reset Password** → pegar el contenido de `docs/email-templates/reset-password.html`.

Ambos usan `{{ .ConfirmationURL }}` (no cambiar a `{{ .TokenHash }}`): el
código en `app/auth/confirm/route.ts` espera el flujo PKCE que llega con
`?code=` a través de esa variable.

## 4. URL Configuration

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://juegakancha.netlify.app`
- **Redirect URLs**: agregar `https://juegakancha.netlify.app/**` y
  `http://localhost:3000/**` (para pruebas locales).

Si el Site URL queda apuntando a `localhost`, los links de los correos van
a `localhost` sin importar lo que haga el código.

## 5. (Opcional) Rate limits

**Authentication → Rate Limits** → revisar el límite de emails salientes si
vas a hacer varias pruebas seguidas de signup/reset.

## Verificación

1. Crear una cuenta nueva desde `/signup` → debería llegar un correo branded
   de Resend con el botón "Confirmar mi cuenta" → confirma y redirige a
   `/onboarding`.
2. Desde `/login` → "¿Olvidaste tu contraseña?" → `/recuperar` → pedir el
   enlace → debería llegar un correo branded con el botón "Restablecer
   contraseña" → lleva a `/restablecer` → cambia la contraseña.
3. En el dashboard de Resend (Logs) confirmar que los envíos aparecen ahí.
