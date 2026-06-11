const stack = [
  { name: "Next.js", role: "Frontend & API" },
  { name: "Amazon Aurora PostgreSQL", role: "Database" },
  { name: "AWS Cognito", role: "Authentication" },
  { name: "AWS Bedrock", role: "AI Engine" },
  { name: "Vercel", role: "Hosting" },
];

export function StackBar() {
  return (
    <section className="border-y border-border bg-card/40 py-10">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Built on the Zero Stack — AWS and Vercel
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {stack.map((item) => (
            <li key={item.name} className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <span className="text-xs text-muted-foreground">{item.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
