import { LoginForm } from "@/components/auth/login-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-6xl font-bold tracking-tighter">MOONGRAPH</h1>
      <LoginForm />
    </div>
  );
}
