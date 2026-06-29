import { Database, CheckCircle, AlertTriangle, Clock, Zap, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Connector {
  id: string;
  name: string;
  type: string;
  status: "healthy" | "warning" | "error";
  recordsToday: number;
  latencyMs: number;
  lastSync: string;
  modelTag: string;
}

const CONNECTORS: Connector[] = [
  { id: "1", name: "Core Banking System", type: "Banking Transactions", status: "healthy", recordsToday: 48320, latencyMs: 124, lastSync: "2 min ago", modelTag: "GBDT" },
  { id: "2", name: "Credit Bureau Feed", type: "Credit Bureau", status: "healthy", recordsToday: 12800, latencyMs: 87, lastSync: "5 min ago", modelTag: "GBDT" },
  { id: "3", name: "Telco Data API", type: "Alternative Data", status: "warning", recordsToday: 9410, latencyMs: 342, lastSync: "18 min ago", modelTag: "Survival" },
  { id: "4", name: "Mobile Money Gateway", type: "Banking Transactions", status: "healthy", recordsToday: 31200, latencyMs: 98, lastSync: "1 min ago", modelTag: "RL Policy" },
  { id: "5", name: "Social Signals Enricher", type: "Alternative Data", status: "healthy", recordsToday: 5600, latencyMs: 210, lastSync: "8 min ago", modelTag: "Survival" },
  { id: "6", name: "Payroll Verification", type: "Alternative Data", status: "error", recordsToday: 0, latencyMs: 0, lastSync: "2 hrs ago", modelTag: "GBDT" },
];

const FEATURE_STORE = [
  { name: "payment_streak_30d", type: "Behavioral", freshness: "2 min", model: "GBDT", description: "Consecutive on-time payments in last 30 days" },
  { name: "bureau_score_delta_90d", type: "Bureau", freshness: "5 min", model: "GBDT", description: "Change in credit bureau score over 90 days" },
  { name: "time_to_default_estimate", type: "Survival", freshness: "15 min", model: "Survival", description: "Predicted days until default (survival model)" },
  { name: "outreach_response_rate", type: "Behavioral", freshness: "3 min", model: "RL Policy", description: "Historical response rate to outreach attempts" },
  { name: "telco_data_score", type: "Telco", freshness: "18 min", model: "Survival", description: "Derived risk signal from telco usage patterns" },
  { name: "bankruptcy_distress_flag", type: "Bureau", freshness: "5 min", model: "GBDT", description: "Binary flag for distress / pre-bankruptcy signals" },
  { name: "optimal_contact_window", type: "Behavioral", freshness: "1 min", model: "RL Policy", description: "Predicted best time window for borrower contact" },
  { name: "income_volatility_index", type: "Alternative", freshness: "8 min", model: "Survival", description: "Coefficient of variation on estimated monthly income" },
];

function statusIcon(status: Connector["status"]) {
  if (status === "healthy") return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <AlertTriangle className="h-4 w-4 text-red-500" />;
}

function statusBadgeClass(status: Connector["status"]) {
  if (status === "healthy") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "warning") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

function modelBadgeClass(tag: string) {
  if (tag === "GBDT") return "bg-blue-100 text-blue-800 border-blue-200";
  if (tag === "Survival") return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-orange-100 text-orange-800 border-orange-200";
}

export default function IngestionPage() {
  const healthy = CONNECTORS.filter((c) => c.status === "healthy").length;
  const totalRecords = CONNECTORS.reduce((s, c) => s + c.recordsToday, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Ingestion & Feature Store"
        description="ETL connectors, feature engineering pipeline, and ML model signals"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Connectors", value: `${healthy}/${CONNECTORS.length}`, icon: Database },
          { label: "Records Today", value: totalRecords.toLocaleString(), icon: RefreshCw },
          { label: "Features in Store", value: FEATURE_STORE.length.toString(), icon: Zap },
          { label: "Avg Latency", value: "155ms", icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="h-4 w-4" />
                <p className="text-xs">{label}</p>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connectors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            ETL Connectors
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4">Connector</th>
                  <th className="text-left font-medium p-4">Type</th>
                  <th className="text-left font-medium p-4">Status</th>
                  <th className="text-right font-medium p-4 hidden sm:table-cell">Records Today</th>
                  <th className="text-right font-medium p-4 hidden md:table-cell">Latency</th>
                  <th className="text-left font-medium p-4 hidden lg:table-cell">Last Sync</th>
                  <th className="text-left font-medium p-4">Model</th>
                </tr>
              </thead>
              <tbody>
                {CONNECTORS.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {statusIcon(c.status)}
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{c.type}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadgeClass(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right hidden sm:table-cell font-medium">
                      {c.recordsToday > 0 ? c.recordsToday.toLocaleString() : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-4 text-right hidden md:table-cell text-muted-foreground">
                      {c.latencyMs > 0 ? `${c.latencyMs}ms` : "—"}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-muted-foreground">{c.lastSync}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${modelBadgeClass(c.modelTag)}`}>
                        {c.modelTag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Feature Store */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Feature Store
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4">Feature Name</th>
                  <th className="text-left font-medium p-4 hidden md:table-cell">Description</th>
                  <th className="text-left font-medium p-4">Type</th>
                  <th className="text-right font-medium p-4 hidden sm:table-cell">Freshness</th>
                  <th className="text-left font-medium p-4">Model</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_STORE.map((f) => (
                  <tr key={f.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{f.name}</code>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{f.description}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">{f.type}</Badge>
                    </td>
                    <td className="p-4 text-right hidden sm:table-cell text-muted-foreground">{f.freshness}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${modelBadgeClass(f.model)}`}>
                        {f.model}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
