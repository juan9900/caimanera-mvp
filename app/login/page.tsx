import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900">
        Iniciar sesión
      </h1>
      <LoginForm />
    </div>
  );
}
