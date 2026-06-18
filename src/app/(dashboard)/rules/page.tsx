import { Shield, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDataRepository } from "@/services";
import { DEFAULT_LENDER_ID } from "@/lib/constants";
import {
  recoveryActionLabels,
  ruleTriggerLabels,
  ruleOperatorLabels,
} from "@/lib/labels";

export default async function RulesPage() {
  const repo = getDataRepository();
  const rules = await repo.getRules(DEFAULT_LENDER_ID);
  const activeRules = rules.filter((r) => r.isActive);
  const inactiveRules = rules.filter((r) => !r.isActive);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recovery Rules"
        description="Configure automated recovery triggers and actions for your portfolio"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Rules</p>
            <p className="text-2xl font-bold">{rules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-emerald-600">
              {activeRules.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Auto-Execute</p>
            <p className="text-2xl font-bold">
              {rules.filter((r) => r.autoExecute && r.isActive).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Active Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-4">Priority</th>
                  <th className="text-left font-medium p-4">Rule</th>
                  <th className="text-left font-medium p-4">Trigger</th>
                  <th className="text-left font-medium p-4">Action</th>
                  <th className="text-left font-medium p-4 hidden md:table-cell">
                    Auto
                  </th>
                  <th className="text-left font-medium p-4 hidden lg:table-cell">
                    Cooldown
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {rule.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
                        {rule.description}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {ruleTriggerLabels[rule.trigger]}{" "}
                        {ruleOperatorLabels[rule.operator]}{" "}
                        {rule.threshold.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">
                        {recoveryActionLabels[rule.action]}
                      </Badge>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {rule.autoExecute ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <Zap className="h-3 w-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Manual
                        </span>
                      )}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-muted-foreground">
                      {rule.cooldownDays > 0
                        ? `${rule.cooldownDays} days`
                        : "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {inactiveRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              Inactive Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm opacity-60">
                <tbody>
                  {inactiveRules.map((rule) => (
                    <tr key={rule.id} className="border-b last:border-0">
                      <td className="p-4 font-medium">{rule.name}</td>
                      <td className="p-4 text-muted-foreground">
                        {rule.description}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">Inactive</Badge>
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
