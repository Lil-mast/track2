import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDataRepository } from "@/services";
import { DEFAULT_LENDER_ID } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { auditActionLabels } from "@/lib/labels";

export default async function AuditLogsPage() {
  const repo = getDataRepository();
  const { data: logs, total } = await repo.getAuditLogs(DEFAULT_LENDER_ID, {
    pageSize: 50,
  });

  const actionColors: Record<string, string> = {
    login: "bg-blue-100 text-blue-800",
    view: "bg-slate-100 text-slate-700",
    create: "bg-emerald-100 text-emerald-800",
    update: "bg-amber-100 text-amber-800",
    delete: "bg-red-100 text-red-800",
    approve: "bg-emerald-100 text-emerald-800",
    reject: "bg-red-100 text-red-800",
    execute: "bg-blue-100 text-blue-800",
    export: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description={`${total} activity records for compliance and traceability`}
      />

      {logs.length === 0 ? (
        <EmptyState
          title="No audit logs"
          description="Activity will be recorded here as users interact with the platform."
          icon={<ScrollText className="h-10 w-10" />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-4">Timestamp</th>
                    <th className="text-left font-medium p-4">User</th>
                    <th className="text-left font-medium p-4">Action</th>
                    <th className="text-left font-medium p-4 hidden md:table-cell">
                      Entity
                    </th>
                    <th className="text-left font-medium p-4">Description</th>
                    <th className="text-left font-medium p-4 hidden lg:table-cell">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{log.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.userEmail}
                        </p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${actionColors[log.action] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {auditActionLabels[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">
                          {log.entityType}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[180px]">
                          {log.entityLabel}
                        </p>
                      </td>
                      <td className="p-4 text-muted-foreground max-w-md">
                        <p className="truncate">{log.description}</p>
                      </td>
                      <td className="p-4 hidden lg:table-cell font-mono text-xs text-muted-foreground">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
