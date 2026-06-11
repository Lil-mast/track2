import { BorrowersTable } from "@/components/dashboard/borrowers-table";

export const metadata = {
  title: "Borrowers — RecoveryAI",
};

export default function BorrowersPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Borrowers</h1>
        <p className="text-sm text-muted-foreground">
          All active loan accounts with AI risk scores and recommended actions.
        </p>
      </header>
      <BorrowersTable />
    </div>
  );
}
