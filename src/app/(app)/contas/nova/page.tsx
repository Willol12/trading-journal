import { AccountForm } from "@/components/account-form";
import { createAccount } from "../actions";

export default function NovaContaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-xl font-semibold tracking-tight text-fg">Nova conta / mesa</h1>
      <AccountForm action={createAccount} />
    </div>
  );
}
