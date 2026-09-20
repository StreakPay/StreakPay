export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-cyan/5" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-accent/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-cyan/10 rounded-full blur-[100px]" />
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
